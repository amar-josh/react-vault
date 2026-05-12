#!/usr/bin/env bash
# Opt-in prompt audit log. Enabled when BFSI_AUDIT_PROMPTS=1 is set in the shell env.
# Per Claude Code spec: async, no decision control.
set -euo pipefail

# Only run if explicitly enabled
[[ "${BFSI_AUDIT_PROMPTS:-0}" == "1" ]] || exit 0

INPUT=$(cat)
PROMPT=$(printf '%s' "$INPUT" | jq -r '.prompt // ""')
SESSION=$(printf '%s' "$INPUT" | jq -r '.session_id // ""')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
AUDIT_DIR="$PROJECT_DIR/.claude"
AUDIT_LOG="$AUDIT_DIR/audit.log"

mkdir -p "$AUDIT_DIR"

# Scrub obvious PII patterns from the prompt before logging
SCRUBBED=$(printf '%s' "$PROMPT" |
  sed -E 's/[A-Z]{5}[0-9]{4}[A-Z]/<PAN>/g' |
  sed -E 's/[0-9]{12}/<AADHAAR-ish>/g' |
  sed -E 's/[6-9][0-9]{9}/<MOBILE>/g' |
  sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/<EMAIL>/g'
)

# Append a JSON line
jq -n -c \
  --arg ts "$TIMESTAMP" \
  --arg session "$SESSION" \
  --arg prompt "$SCRUBBED" \
  '{timestamp: $ts, session_id: $session, event: "user_prompt", prompt_scrubbed: $prompt}' \
  >> "$AUDIT_LOG"

exit 0
