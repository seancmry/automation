#!/usr/bin/env bash
# Interactive API key setup — keys are typed in your terminal only (never chat).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
dim() { printf '\033[2m%s\033[0m\n' "$*"; }

if [[ ! -t 0 ]]; then
  echo "Run this in your terminal (stdin must be a TTY):"
  echo "  cd $ROOT && npm run setup:keys"
  exit 1
fi

bold "HR AI HITL demo — API key setup"
echo "Keys stay on your machine (.env.local). Nothing is sent to Cursor chat."
echo ""

PS3="Choose provider (number): "
options=("Google Gemini (free)" "Groq (free)" "OpenAI (paid)" "Skip — I'll edit .env.local manually")
select opt in "${options[@]}"; do
  case $REPLY in
    1) PROVIDER="google"; break ;;
    2) PROVIDER="groq"; break ;;
    3) PROVIDER="openai"; break ;;
    4)
      cp -n "$ROOT/.env.example" "$ENV_FILE" 2>/dev/null || true
      bold "Template ready at:"
      echo "  $ENV_FILE"
      dim "Open that file and paste keys after the = signs. Then: npm run keys:check"
      exit 0
      ;;
    *) echo "Pick 1–4." ;;
  esac
done

read_secret() {
  local prompt="$1"
  local value=""
  printf '%s' "$prompt" >&2
  read -rs value < /dev/tty
  echo "" >&2
  if [[ -z "$value" ]]; then
    echo "Empty input — aborted." >&2
    exit 1
  fi
  if [[ "$value" == *"Paste"* ]] || [[ "$value" == *"(hidden)"* ]]; then
    echo "That looks like the prompt text, not a key — aborted." >&2
    exit 1
  fi
  if [[ ${#value} -lt 20 ]]; then
    echo "Key too short (${#value} chars) — double-check and try again." >&2
    exit 1
  fi
  printf '%s' "$value"
}

case "$PROVIDER" in
  google)
    KEY_VAR="GOOGLE_GENERATIVE_AI_API_KEY"
    MODEL_VAR="GOOGLE_MODEL"
    MODEL_DEFAULT="gemini-flash-latest"
    KEY_URL="https://aistudio.google.com/apikey"
    ;;
  groq)
    KEY_VAR="GROQ_API_KEY"
    MODEL_VAR="GROQ_MODEL"
    MODEL_DEFAULT="openai/gpt-oss-20b"
    KEY_URL="https://console.groq.com/keys"
    ;;
  openai)
    KEY_VAR="OPENAI_API_KEY"
    MODEL_VAR="OPENAI_MODEL"
    MODEL_DEFAULT="gpt-4o-mini"
    KEY_URL="https://platform.openai.com/api-keys"
    ;;
esac

echo ""
bold "Get a key (if needed): $KEY_URL"
SECRET="$(read_secret "Paste $KEY_VAR (hidden): ")"

MODEL="$MODEL_DEFAULT"
dim "Model: $MODEL_DEFAULT (default — no input needed; edit $MODEL_VAR in .env.local later to override)"

# Start from example, then overlay chosen provider block
if [[ -f "$ENV_FILE" ]]; then
  dim "Backing up existing .env.local → .env.local.bak"
  cp "$ENV_FILE" "$ENV_FILE.bak"
fi
cp "$ROOT/.env.example" "$ENV_FILE"

# Strip existing key lines we'll rewrite (portable sed)
for v in GOOGLE_GENERATIVE_AI_API_KEY GROQ_API_KEY OPENAI_API_KEY AI_PROVIDER \
  GOOGLE_MODEL GROQ_MODEL OPENAI_MODEL; do
  sed -i '' "/^${v}=/d" "$ENV_FILE" 2>/dev/null || sed -i "/^${v}=/d" "$ENV_FILE"
done

{
  echo ""
  echo "# Written by scripts/setup-keys.sh on $(date -u +%Y-%m-%dT%H:%MZ)"
  echo "AI_PROVIDER=$PROVIDER"
  echo "${KEY_VAR}=${SECRET}"
  echo "${MODEL_VAR}=${MODEL}"
} >>"$ENV_FILE"

chmod 600 "$ENV_FILE" 2>/dev/null || true

echo ""
bold "Saved → $ENV_FILE"
dim "(file mode 600 if your OS supports it)"
echo ""
"$ROOT/scripts/check-keys.sh"
echo ""
bold "Next: npm run dev   then open http://localhost:3000"
