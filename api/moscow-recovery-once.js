import { Client } from 'ssh2';

export const maxDuration = 60;

const EXPECTED_IP = '72.56.14.168';
const EXPECTED_HOSTNAME = 'msk-1-vm-6dy5';

function runRemote(config, script) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      try { conn.end(); } catch {}
      fn(value);
    };

    conn.on('ready', () => {
      conn.exec('bash -s', (error, stream) => {
        if (error) return finish(reject, error);
        let stdout = '';
        let stderr = '';
        stream.on('data', (chunk) => { stdout += chunk.toString(); });
        stream.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
        stream.on('close', (code, signal) => finish(resolve, {
          code,
          signal,
          stdout: stdout.slice(-18000),
          stderr: stderr.slice(-12000),
        }));
        stream.end(script);
      });
    });
    conn.on('error', (error) => finish(reject, error));
    conn.connect(config);
  });
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-content-type-options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method' });

  const host = process.env.VPS_IP || '';
  const username = process.env.VPS_USER || 'root';
  const rawKey = process.env.VPS_SSH_PRIVATE_KEY || '';
  const password = process.env.VPS_ROOT_PASSWORD || '';

  if (host !== EXPECTED_IP) {
    return res.status(409).json({ ok: false, error: 'target-refused', expected: EXPECTED_IP, configured: host || null });
  }
  if (!rawKey && !password) {
    return res.status(500).json({ ok: false, error: 'missing-ssh-credential' });
  }

  const config = {
    host,
    port: 22,
    username,
    readyTimeout: 15000,
    keepaliveInterval: 3000,
    keepaliveCountMax: 3,
  };
  if (rawKey) config.privateKey = rawKey.replace(/\\n/g, '\n');
  if (password) config.password = password;

  const script = String.raw`set -Eeuo pipefail
EXPECTED_HOST='${EXPECTED_HOSTNAME}'
EXPECTED_IP='${EXPECTED_IP}'
HOST="$(hostname 2>/dev/null || true)"
IPS="$(hostname -I 2>/dev/null || true)"
if [[ "$HOST" != "$EXPECTED_HOST" ]] && ! ip -4 addr show scope global 2>/dev/null | grep -qE 'inet 72\.56\.14\.168/'; then
  echo "REFUSED wrong-host hostname=$HOST ips=$IPS"
  exit 42
fi

echo '=== TARGET ==='
date -Is
hostname
hostname -I 2>/dev/null || true

echo '=== BEFORE ==='
uptime
free -h
ps -eo pid,ppid,user,etime,%cpu,%mem,args --sort=-%cpu | head -n 45

mapfile -t GAME_SERVICES < <(find /etc/systemd/system -maxdepth 1 -type f -name 'actions.runner.ptaskaev91-glitch-facefall-survivor*.service' -printf '%f\n' 2>/dev/null | sort)
mapfile -t CONTROL_SERVICES < <(find /etc/systemd/system -maxdepth 1 -type f -name 'actions.runner.ptaskaev91-glitch-server-control-ru*.service' -printf '%f\n' 2>/dev/null | sort)

echo "game_services=\${GAME_SERVICES[*]:-none}"
echo "control_services=\${CONTROL_SERVICES[*]:-none}"
if ((\${#GAME_SERVICES[@]} == 0 || \${#CONTROL_SERVICES[@]} == 0)); then
  echo 'REFUSED missing exact target runner services'
  exit 43
fi

TARGET_USERS=()
for svc in "\${GAME_SERVICES[@]}" "\${CONTROL_SERVICES[@]}"; do
  user="$(systemctl show -p User --value "$svc" 2>/dev/null || true)"
  [[ -n "$user" ]] && TARGET_USERS+=("$user")
  echo "$svc user=\${user:-unknown} active=$(systemctl is-active "$svc" 2>/dev/null || true)"
done

echo '=== STOP GAME + CONTROL-RU RUNNER CGROUPS ==='
for svc in "\${GAME_SERVICES[@]}" "\${CONTROL_SERVICES[@]}"; do
  systemctl kill --kill-who=all --signal=SIGTERM "$svc" >/dev/null 2>&1 || true
  systemctl stop --no-block "$svc" >/dev/null 2>&1 || true
done
sleep 4
for svc in "\${GAME_SERVICES[@]}" "\${CONTROL_SERVICES[@]}"; do
  systemctl kill --kill-who=all --signal=SIGKILL "$svc" >/dev/null 2>&1 || true
  timeout 5s systemctl stop "$svc" >/dev/null 2>&1 || true
  systemctl reset-failed "$svc" >/dev/null 2>&1 || true
done
sleep 2

echo '=== HEAVY LOCK ==='
LOCK_PIDS="$(fuser /var/lock/dev-platform/heavy.lock 2>/dev/null || true)"
echo "holders=\${LOCK_PIDS:-none}"
for pid in $LOCK_PIDS; do
  user="$(ps -o user= -p "$pid" 2>/dev/null | xargs || true)"
  cmd="$(ps -o args= -p "$pid" 2>/dev/null || true)"
  owned=0
  for target_user in "\${TARGET_USERS[@]}"; do
    [[ -n "$target_user" && "$user" == "$target_user" ]] && owned=1
  done
  [[ "$cmd" == *'/opt/actions-runner-game/'* || "$cmd" == *'/opt/actions-runner-server-control-ru/'* ]] && owned=1
  if (( owned )); then
    echo "killing-owned-lock-holder pid=$pid user=$user cmd=$cmd"
    kill -TERM "$pid" 2>/dev/null || true
    sleep 1
    kill -KILL "$pid" 2>/dev/null || true
  else
    echo "preserving-unrelated-lock-holder pid=$pid user=$user cmd=$cmd"
  fi
done

echo '=== NGINX ==='
nginx -t
systemctl restart nginx
systemctl is-active nginx

echo '=== RESTART CONTROL-RU ONLY ==='
for svc in "\${CONTROL_SERVICES[@]}"; do
  systemctl start "$svc"
  printf '%s=' "$svc"
  systemctl is-active "$svc"
done

install -d -m 2775 -o root -g dev-platform /var/lib/dev-platform/state/game 2>/dev/null || true
printf '%s\n' "paused-by-vercel-recovery $(date -Is)" >/var/lib/dev-platform/state/game/runner-paused-for-production

echo '=== AFTER ==='
uptime
free -h
echo 'game runner intentionally paused:'
for svc in "\${GAME_SERVICES[@]}"; do printf '%s=' "$svc"; systemctl is-active "$svc" 2>/dev/null || true; done
echo 'control-ru runner:'
for svc in "\${CONTROL_SERVICES[@]}"; do printf '%s=' "$svc"; systemctl is-active "$svc" 2>/dev/null || true; done
echo 'nginx:'
systemctl is-active nginx
echo 'heavy lock:'
fuser -v /var/lock/dev-platform/heavy.lock 2>/dev/null || true
echo 'local game health:'
curl -sS -D- --max-time 5 -H 'Host: super-makar.72-56-14-168.sslip.io' http://127.0.0.1/health 2>&1 || true
`;

  try {
    const result = await runRemote(config, script);
    const ok = result.code === 0;
    return res.status(ok ? 200 : 500).json({ ok, target: host, ...result });
  } catch (error) {
    return res.status(500).json({ ok: false, target: host, error: error instanceof Error ? error.message : String(error) });
  }
}
