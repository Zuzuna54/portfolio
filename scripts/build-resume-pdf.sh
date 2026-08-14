#!/usr/bin/env bash
#
# Generate public/resume.pdf from the site's own /resume page.
#
#   npm run resume:pdf
#
# The résumé data lives in exactly one place — app/resume/page.tsx — and this
# prints it. There is no second copy to drift.
#
# That matters more than it sounds. The previous PDF was built from a Word file
# in a different folder, and by 14 Aug it contradicted the site on six claims:
# four memory tiers vs three, two datastores that were never in the stack, the
# wrong latency figure, a retention model that was close to the opposite of the
# real one, an isolation mechanism that does not exist in that architecture, and
# a start date a month off. Both documents get read by the same recruiter.
#
# Typography and layout come from `@media print` in styles/_print.scss.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/resume.pdf"
PORT="${PORT:-3999}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

if [[ ! -x "$CHROME" ]]; then
  echo "✗ Chrome not found at: $CHROME" >&2
  echo "  Set CHROME=/path/to/chrome and re-run." >&2
  exit 1
fi

# Build and serve the real production output rather than dev: dev injects the
# HMR client and overlay, and both have shown up in printed output before.
echo "→ building"
( cd "$ROOT" && npm run build >/dev/null )

echo "→ serving on :$PORT"
( cd "$ROOT" && npx next start -p "$PORT" >/tmp/resume-pdf-server.log 2>&1 & )
SERVER_PID=$!
cleanup() { pkill -f "next start -p $PORT" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://localhost:$PORT/resume"; then break; fi
  sleep 1
done
curl -fsS -o /dev/null "http://localhost:$PORT/resume" || { echo "✗ server never came up" >&2; exit 1; }

echo "→ printing"
TMPDIR_RUN="$(mktemp -d)"
"$CHROME" \
  --headless \
  --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$OUT" \
  --user-data-dir="$TMPDIR_RUN" \
  --virtual-time-budget=10000 \
  "http://localhost:$PORT/resume" >/dev/null 2>&1
rm -rf "$TMPDIR_RUN"

[[ -s "$OUT" ]] || { echo "✗ no PDF produced" >&2; exit 1; }
echo "✓ $(basename "$OUT") — $(du -h "$OUT" | cut -f1)"
