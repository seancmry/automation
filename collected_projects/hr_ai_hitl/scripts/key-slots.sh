#!/usr/bin/env bash
# Show where to paste keys — safe to run from agent or terminal (no secrets).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
EXAMPLE="$ROOT/.env.example"

provider="${1:-}"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
dim() { printf '\033[2m%s\033[0m\n' "$*"; }

bold "API key slots — hr-ai-hitl"
echo ""
echo "Do NOT paste keys in Cursor chat. Use one of:"
echo "  1) npm run setup:keys     (masked prompts in terminal)"
echo "  2) Edit the file below    (paste after the = sign)"
echo ""

if [[ ! -f "$ENV_FILE" ]]; then
  dim "Creating $ENV_FILE from .env.example …"
  cp "$EXAMPLE" "$ENV_FILE"
fi

bold "File to edit:"
echo "  $ENV_FILE"
echo ""

show_block() {
  local name="$1"
  local key_var="$2"
  local model_var="$3"
  local model_default="$4"
  local url="$5"
  echo "┌─ $name ─────────────────────────────────"
  echo "│  $url"
  echo "│"
  echo "│  $key_var=<paste key here>"
  echo "│  $model_var=$model_default"
  echo "│  AI_PROVIDER=$name"
  echo "└──────────────────────────────────────────"
  echo ""
}

case "$(echo "$provider" | tr '[:upper:]' '[:lower:]')" in
  google|gemini)
    show_block "google" "GOOGLE_GENERATIVE_AI_API_KEY" "GOOGLE_MODEL" "gemini-flash-latest" \
      "https://aistudio.google.com/apikey"
    ;;
  groq)
    show_block "groq" "GROQ_API_KEY" "GROQ_MODEL" "openai/gpt-oss-20b" \
      "https://console.groq.com/keys"
    ;;
  openai)
    show_block "openai" "OPENAI_API_KEY" "OPENAI_MODEL" "gpt-4o-mini" \
      "https://platform.openai.com/api-keys"
    ;;
  *)
    show_block "google" "GOOGLE_GENERATIVE_AI_API_KEY" "GOOGLE_MODEL" "gemini-flash-latest" \
      "https://aistudio.google.com/apikey"
    show_block "groq" "GROQ_API_KEY" "GROQ_MODEL" "openai/gpt-oss-20b" \
      "https://console.groq.com/keys"
    show_block "openai" "OPENAI_API_KEY" "OPENAI_MODEL" "gpt-4o-mini" \
      "https://platform.openai.com/api-keys"
    dim "Tip: npm run keys:slots -- groq   (one provider only)"
    ;;
esac

echo "After saving, tell the agent: \"keys configured\" (not the values)."
echo "Verify: npm run keys:check"
