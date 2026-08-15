#!/usr/bin/env python3
import json, os, subprocess, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN = os.environ.get('MGMT_TOKEN','')
PORT = int(os.environ.get('MGMT_PORT','8765'))


def run(cmd, timeout=30):
    p = subprocess.run(cmd, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
    return {'rc': p.returncode, 'out': p.stdout[-16000:]}


def baseline():
    return {
        'hostname': run('hostname'),
        'uptime': run('uptime -p'),
        'disk': run('df -h /'),
        'memory': run('free -h'),
        'failed_units': run('systemctl --failed --no-pager --plain || true'),
        'docker_ps': run("docker ps -a --format 'table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}' 2>/dev/null || true"),
        'docker_df': run('docker system df 2>/dev/null || true'),
        'ports': run("ss -tulpn | head -120"),
        'timers': run("systemctl list-timers --all --no-pager | grep -Ei 'gateway|server-control|chat-bootstrap|amnezia|xray' || true"),
    }


def gateway_status():
    return {
        'containers': run("docker ps --format '{{.Names}}|{{.Status}}|{{.Ports}}' | grep -E 'public-web-gateway|browser-worker' || true"),
        'edge_health': run("curl -ksS --max-time 10 -w '\nHTTP=%{http_code}' https://127.0.0.1:8443/health 2>&1 || true"),
        'renew_service': run('systemctl status public-web-gateway-renew.service --no-pager -l 2>&1 || true'),
        'renew_timer': run('systemctl status public-web-gateway-renew.timer --no-pager -l 2>&1 || true'),
    }


def gateway_test():
    return {
        'direct': run("curl -LksS --max-time 20 -o /tmp/adm44.html -w 'HTTP=%{http_code} SIZE=%{size_download} TIME=%{time_total}' https://adm44.ru/authorities/administration/alternates.php; printf ' '; grep -o 'Заместители губернатора' /tmp/adm44.html | head -1 || true", 30),
        'edge_health': run("curl -ksS --max-time 10 -w '\nHTTP=%{http_code}' https://127.0.0.1:8443/health 2>&1 || true"),
    }


def cert_status():
    return {
        'renewal_conf': run("for f in /etc/letsencrypt/renewal/*.conf; do echo ===$f===; sed -n '1,160p' \"$f\"; done 2>/dev/null || true"),
        'certs': run("find /etc/letsencrypt/live -maxdepth 2 -name fullchain.pem -print -exec openssl x509 -in {} -noout -subject -issuer -dates \\; 2>/dev/null || true"),
        'port80': run("ss -ltnp '( sport = :80 )' || true"),
        'certbot_processes': run("ps aux | grep -E '[c]ertbot|[a]cme' || true"),
        'renew_journal': run('journalctl -u public-web-gateway-renew.service -n 120 --no-pager 2>&1 || true'),
    }


def cert_renew():
    run('systemctl reset-failed public-web-gateway-renew.service 2>/dev/null || true')
    start = run('timeout 260 systemctl start public-web-gateway-renew.service', 280)
    time.sleep(2)
    return {
        'start': start,
        'service': run('systemctl status public-web-gateway-renew.service --no-pager -l 2>&1 || true'),
        'journal': run('journalctl -u public-web-gateway-renew.service -n 160 --no-pager 2>&1 || true'),
        'certs': run("find /etc/letsencrypt/live -maxdepth 2 -name fullchain.pem -print -exec openssl x509 -in {} -noout -subject -dates \\; 2>/dev/null || true"),
        'edge_health': run("curl -ksS --max-time 10 -w '\nHTTP=%{http_code}' https://127.0.0.1:8443/health 2>&1 || true"),
    }

ACTIONS = {
    'status': baseline,
    'gateway-status': gateway_status,
    'gateway-test': gateway_test,
    'cert-status': cert_status,
    'cert-renew': cert_renew,
}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return
    def do_GET(self):
        parts = [p for p in self.path.split('?')[0].split('/') if p]
        if len(parts) != 2 or parts[0] != TOKEN or parts[1] not in ACTIONS:
            self.send_response(404); self.end_headers(); return
        action = parts[1]
        try:
            data = ACTIONS[action]()
            body = json.dumps({'ok': True, 'action': action, 'data': data}, ensure_ascii=False, indent=2).encode()
            self.send_response(200)
        except Exception as e:
            body = json.dumps({'ok': False, 'action': action, 'error': repr(e)}, ensure_ascii=False, indent=2).encode()
            self.send_response(500)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.end_headers(); self.wfile.write(body)

if __name__ == '__main__':
    if not TOKEN or len(TOKEN) < 24:
        raise SystemExit('MGMT_TOKEN missing or too short')
    ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
