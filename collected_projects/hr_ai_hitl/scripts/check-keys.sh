#!/usr/bin/env bash
# Report which env vars are set — never prints secret values.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

status_var() {
  local key="$1"
  local line val
  line="$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | tail -1 || true)"
  if [[ -z "$line" ]]; then
    echo "  $key: (missing)"
    return
  fi
  val="${line#*=}"
  # trim optional quotes
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  if [[ -n "$val" ]]; then
    echo "  $key: SET (${#val} chars)"
  else
    echo "  $key: (empty)"
  fi
}

echo "API key status ($ENV_FILE):"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "  (file not found — run: npm run setup:keys)"
  exit 1
fi

for v in AI_PROVIDER \
  GOOGLE_GENERATIVE_AI_API_KEY GOOGLE_MODEL \
  GROQ_API_KEY GROQ_MODEL \
  OPENAI_API_KEY OPENAI_MODEL \
  ODOO_MODE; do
  status_var "$v"
done
