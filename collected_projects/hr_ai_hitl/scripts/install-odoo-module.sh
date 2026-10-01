#!/usr/bin/env bash
# Install or upgrade hr_demo_case custom fields on the demo database.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DB_NAME="${ODOO_DB:-hr_hitl_demo}"
ODOO_ARGS=(
  -d "$DB_NAME"
  --stop-after-init
  --db_host=db
  --db_user=odoo
  --db_password=odoo
)

if ! docker compose ps odoo 2>/dev/null | grep -q "Up"; then
  echo "Odoo container is not running. Run: npm run odoo:up"
  exit 1
fi

run_module() {
  local flag="$1"
  docker compose exec -T odoo odoo "${ODOO_ARGS[@]}" "$flag" hr_demo_case 2>&1
}

echo "Installing hr_demo_case on database: $DB_NAME"
LOG="$(run_module -u || true)"

if echo "$LOG" | grep -q 'invalid module names, ignored: hr_demo_case'; then
  echo "Module not installed yet — running fresh install …"
  run_module -i
elif ! echo "$LOG" | grep -q 'Module hr_demo_case loaded'; then
  echo "Upgrade had no effect — running install …"
  run_module -i
else
  echo "$LOG" | tail -5
fi

docker compose restart odoo >/dev/null
echo "Module hr_demo_case ready. Odoo restarted."
