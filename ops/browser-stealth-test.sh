#!/usr/bin/env bash
set -Eeuo pipefail

TARGET='https://adm44.ru/authorities/administration/alternates.php'
HOST_FILE='/opt/browser-worker/browser-job.js'
ORIG_FILE='/opt/browser-worker/browser-job.js.pre-stealth-original'
CONTAINER='browser-worker'
TMP_JSON="$(mktemp)"
trap 'rm -f "$TMP_JSON"' EXIT

if [[ ! -f "$HOST_FILE" ]]; then
  echo 'STEALTH_RESULT status=missing_host_file'
  exit 10
fi

if [[ ! -f "$ORIG_FILE" ]]; then
  cp -a "$HOST_FILE" "$ORIG_FILE"
fi

# Always start this experiment from the known-good original.
cp -a "$ORIG_FILE" "$HOST_FILE"

rollback() {
  cp -a "$ORIG_FILE" "$HOST_FILE"
  docker cp "$HOST_FILE" "$CONTAINER:/app/browser-job.js" >/dev/null 2>&1 || true
  echo 'STEALTH_ROLLBACK=yes'
}

python3 - "$HOST_FILE" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text()

needle='''      "--disable-dev-shm-usage",'''
replacement='''      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",'''
if needle not in s:
    raise SystemExit('launch args anchor not found')
s=s.replace(needle,replacement,1)

needle='''  context = await browser.newContext({'''
replacement='''  const browserVersion = browser.version();
  const stealthUserAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion} Safari/537.36`;

  context = await browser.newContext({
    userAgent: stealthUserAgent,
    extraHTTPHeaders: { "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7" },'''
if needle not in s:
    raise SystemExit('context anchor not found')
s=s.replace(needle,replacement,1)

needle='''  const page = await context.newPage();'''
replacement='''  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "languages", { get: () => ["ru-RU", "ru", "en-US", "en"] });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "platform", { get: () => "Linux x86_64" });
    if (!window.chrome) Object.defineProperty(window, "chrome", { value: { runtime: {} } });
  });'''
if needle not in s:
    raise SystemExit('page anchor not found')
s=s.replace(needle,replacement,1)

p.write_text(s)
PY

docker cp "$HOST_FILE" "$CONTAINER:/tmp/browser-job.stealth.js"
if ! docker exec "$CONTAINER" node --check /tmp/browser-job.stealth.js >/dev/null 2>&1; then
  rollback
  echo 'STEALTH_RESULT status=syntax_failed'
  exit 11
fi

docker cp "$HOST_FILE" "$CONTAINER:/app/browser-job.js"

set +e
docker exec public-web-gateway sh -lc "curl -sS --max-time 45 -X POST -H 'content-type: application/json' --data '{\"url\":\"$TARGET\"}' http://127.0.0.1:8080/browser/render" >"$TMP_JSON"
RC=$?
set -e

RESULT="$(python3 - "$TMP_JSON" <<'PY'
import json,sys
from pathlib import Path
raw=Path(sys.argv[1]).read_text(errors='replace')
try:
    obj=json.loads(raw)
    text=json.dumps(obj, ensure_ascii=False)
except Exception:
    text=raw
match='yes' if 'Заместители губернатора' in text else 'no'
forbidden='yes' if ('Forbidden' in text or '403' in text) else 'no'
print(f'match={match} forbidden={forbidden} bytes={len(raw.encode())}')
PY
)"

echo "STEALTH_TEST curl_rc=$RC $RESULT"

if [[ "$RESULT" == *'match=yes'* ]]; then
  echo 'STEALTH_RESULT status=success rollback=no'
  exit 0
fi

rollback
echo 'STEALTH_RESULT status=failed rollback=yes'
exit 0
