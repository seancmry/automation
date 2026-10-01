#!/usr/bin/env bash
# Start Odoo + Postgres, init DB (first run), seed HR demo contacts.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="${ODOO_DB:-hr_hitl_demo}"
ADMIN_PASS="${ODOO_ADMIN_PASSWORD:-admin}"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
dim() { printf '\033[2m%s\033[0m\n' "$*"; }

if ! command -v docker >/dev/null; then
  echo "Docker not found. Install Docker Desktop and retry."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker Desktop, then retry."
  exit 1
fi

bold "1/5 Starting containers"
docker compose up -d

bold "2/5 Waiting for Odoo on :8069"
for i in $(seq 1 60); do
  if curl -sf "http://localhost:8069/web/login" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [[ "$i" -eq 60 ]]; then
    echo "Timed out waiting for Odoo."
    exit 1
  fi
done

bold "3/5 Initializing database (skip if already exists): $DB_NAME"
if docker compose exec -T odoo odoo -d "$DB_NAME" -i base,mail,contacts,hr_demo_case \
  --stop-after-init \
  --db_host=db --db_user=odoo --db_password=odoo 2>&1 | tail -3; then
  dim "Database initialized."
else
  dim "Database may already exist — continuing."
fi

bold "4/5 Upgrading hr_demo_case module (custom case fields)"
if bash scripts/install-odoo-module.sh; then
  dim "Module ready."
else
  dim "Module install skipped or failed — run: npm run odoo:install-module"
fi

# Ensure .env.local has live mode defaults
ENV_FILE="$ROOT/.env.local"
if [[ -f "$ENV_FILE" ]]; then
  grep -q '^ODOO_MODE=live' "$ENV_FILE" || echo "ODOO_MODE=live" >>"$ENV_FILE"
else
  cp .env.example "$ENV_FILE"
  {
    echo "ODOO_MODE=live"
    echo "ODOO_URL=http://localhost:8069"
    echo "ODOO_DB=$DB_NAME"
    echo "ODOO_USERNAME=admin"
    echo "ODOO_PASSWORD=$ADMIN_PASS"
  } >>"$ENV_FILE"
fi

bold "5/5 Seeding HR cases into Odoo"
export ODOO_MODE=live
export ODOO_URL="${ODOO_URL:-http://localhost:8069}"
export ODOO_DB="$DB_NAME"
export ODOO_USERNAME="${ODOO_USERNAME:-admin}"
export ODOO_PASSWORD="${ODOO_PASSWORD:-$ADMIN_PASS}"

npx --yes tsx scripts/seed-odoo-cases.ts

echo ""
bold "Done."
echo "  Odoo UI:  http://localhost:8069/web/login?db=$DB_NAME  (admin / $ADMIN_PASS)"
echo "  App:      set ODOO_MODE=live in .env.local, restart npm run dev"
echo "  Contacts: search by ref leave-overlap, policy-question, equipment"
