#!/usr/bin/env bash
#
# Confidentiality gate for everything this site publishes.
#
#   npm run redact
#
# Delegates to the denylist and scanner in the presence-control repo so there is
# exactly one denylist, not two that drift. Uses -print0/xargs -0 rather than a
# shell variable: zsh does not word-split an unquoted "$var", so passing a list
# that way silently collapses to a single bogus argument.
set -euo pipefail

GATE="${REDACT_GATE:-$HOME/Desktop/github_manager/scripts/redact-check.sh}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -x "$GATE" && ! -f "$GATE" ]]; then
  echo "⚠  Gate not found at $GATE" >&2
  echo "   Set REDACT_GATE to redact-check.sh, or skip if you don't have it." >&2
  exit 0   # don't fail a clean-checkout build just because the gate is elsewhere
fi

find "$ROOT/content" "$ROOT/app" "$ROOT/lib" "$ROOT/components" \
  -type f \( -name '*.mdx' -o -name '*.md' -o -name '*.tsx' -o -name '*.ts' \) -print0 \
  | xargs -0 bash "$GATE"
