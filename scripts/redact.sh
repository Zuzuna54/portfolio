#!/usr/bin/env bash
#
# Confidentiality gate for everything this site publishes.
#
#   npm run redact
#
# The denylist and scanner live outside this repo so there is exactly one
# denylist, not two that drift. Where they live is deliberately not recorded
# here: this repo is public and linked from the site's own footer, so a
# hardcoded path published the layout of tooling that is not meant to be
# public.
#
# Point it at the scanner one of two ways, both untracked:
#   REDACT_GATE=/path/to/redact-check.sh npm run redact
#   echo /path/to/redact-check.sh > .redact-gate
#
# Uses -print0/xargs -0 rather than a shell variable: zsh does not word-split an
# unquoted "$var", so passing a file list that way silently collapses to a single
# bogus argument — and the scanner then reports CLEAN having scanned nothing.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$ROOT/.redact-gate"

GATE="${REDACT_GATE:-}"
if [[ -z "$GATE" && -f "$CONFIG" ]]; then
  GATE="$(tr -d '[:space:]' < "$CONFIG")"
fi

if [[ -z "$GATE" ]]; then
  # No env var and no local config: this is a clean checkout by someone who
  # isn't the owner. Don't fail their build over tooling they were never given.
  echo "⚠  No redaction gate configured — skipping." >&2
  echo "   Set REDACT_GATE, or write the scanner's path to .redact-gate" >&2
  exit 0
fi

if [[ ! -f "$GATE" ]]; then
  # Configured but broken. Fail loudly: this is the owner's machine with a stale
  # path, and exiting 0 here would publish unscanned content while printing a
  # warning nobody reads in CI output.
  echo "✗ Redaction gate configured but missing: $GATE" >&2
  exit 1
fi

find "$ROOT/content" "$ROOT/app" "$ROOT/lib" "$ROOT/components" \
  -type f \( -name '*.mdx' -o -name '*.md' -o -name '*.tsx' -o -name '*.ts' \) -print0 \
  | xargs -0 bash "$GATE"
