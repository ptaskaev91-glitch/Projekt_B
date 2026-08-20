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
          stdout: stdout.slice(-24000),
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

  const script = [
    'set -Eeuo pipefail',
    `EXPECTED_HOST='${EXPECTED_HOSTNAME}'`,
    `EXPECTED_IP='${EXPECTED_IP}'`,
    'HOST="$(hostname 2>/dev/null || true)"',
    'IPS="$(hostname -I 2>/dev/null || true)"',
    'if [[ "$HOST" != "$EXPECTED_HOST" ]] && ! ip -4 addr show scope global 2>/dev/null | grep -qE "inet 72\\.56\\.14\\.168/"; then echo "REFUSED wrong-host hostname=$HOST ips=$IPS"; exit 42; fi',
    "echo '=== TARGET ==='",
    'date -Is',
    'hostname',
    'hostname -I 2>/dev/null || true',
    "echo '=== BRAIN CHECKOUT ==='",
    'BRAIN_DIR=/opt/actions-runner-brain/_work/Brain/Brain',
    'test -d "$BRAIN_DIR/.git" || { echo "REFUSED missing Brain checkout"; exit 43; }',
    'REMOTE="$(git -C "$BRAIN_DIR" remote get-url origin 2>/dev/null || true)"',
    'echo "brain_remote=$REMOTE"',
    'case "$REMOTE" in *ptaskaev91-glitch/Brain*) ;; *) echo "REFUSED unexpected Brain remote"; exit 44;; esac',
    'git -C "$BRAIN_DIR" fetch origin main',
    'git -C "$BRAIN_DIR" reset --hard origin/main',
    'echo "brain_commit=$(git -C "$BRAIN_DIR" rev-parse HEAD)"',
    'cd "$BRAIN_DIR"',
    "echo '=== INSTALL SHARE GATEWAY ==='",
    'bash ops/install-share-gateway.sh',
    "echo '=== LOCAL/PUBLIC HEALTH ==='",
    'systemctl is-active brain-share-gateway.service',
    'curl -fsS --max-time 10 http://127.0.0.1:8795/share/health',
    `curl -fsS --max-time 15 https://${EXPECTED_IP}:8788/share/ | grep -F 'Пароль Brain' >/dev/null`,
    "python3 - <<'PY'",
    'import http.cookiejar',
    'import pathlib',
    'import urllib.parse',
    'import urllib.request',
    "secret = pathlib.Path('/etc/brain/webdav-client.txt').read_text()",
    "password = next(line.split('=',1)[1] for line in secret.splitlines() if line.startswith('password='))",
    'jar = http.cookiejar.CookieJar()',
    'opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))',
    "data = urllib.parse.urlencode({'password': password}).encode()",
    `req = urllib.request.Request('https://${EXPECTED_IP}:8788/share/login', data=data, method='POST')`,
    'with opener.open(req, timeout=20) as response:',
    "    body = response.read().decode('utf-8', errors='replace')",
    "assert 'Импорт чата' in body",
    "assert any(cookie.name == 'brain_share_session' for cookie in jar)",
    'PY',
    "echo 'share_login=passed'",
    "echo '=== RECOVER RUNNERS ==='",
    'if command -v dev-platform-recover >/dev/null 2>&1; then',
    '  dev-platform-recover brain',
    '  dev-platform-recover server-control-ru || true',
    'else',
    '  BRAIN_SERVICE="$(systemctl list-unit-files --type=service --no-legend --no-pager | awk \"$1 ~ /^actions\\.runner\\./ && $1 ~ /moscow-brain-01/ {print $1; exit}\")"',
    '  test -n "$BRAIN_SERVICE"',
    '  systemctl restart "$BRAIN_SERVICE"',
    '  sleep 3',
    '  systemctl is-active "$BRAIN_SERVICE"',
    'fi',
    "echo '=== FINAL ==='",
    'nginx -t',
    'systemctl is-active nginx',
    'systemctl is-active brain-share-gateway.service',
    `curl -fsS --max-time 10 https://${EXPECTED_IP}:8788/share/health`,
    "echo 'BRAIN_SHARE_RECOVERY_OK'",
  ].join('\n') + '\n';

  try {
    const result = await runRemote(config, script);
    const ok = result.code === 0 && result.stdout.includes('BRAIN_SHARE_RECOVERY_OK');
    return res.status(ok ? 200 : 500).json({ ok, target: host, ...result });
  } catch (error) {
    return res.status(500).json({ ok: false, target: host, error: error instanceof Error ? error.message : String(error) });
  }
}
