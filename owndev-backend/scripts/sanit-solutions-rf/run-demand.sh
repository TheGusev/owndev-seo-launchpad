#!/usr/bin/env bash
# Запуск Demand Intelligence для проекта «Санитарные Решения РФ»
# через V3 pipeline (POST /api/v3/pipeline)
#
# Использование:
#   bash run-demand.sh <BACKEND_URL>
# Пример:
#   bash run-demand.sh http://localhost:3000
#   bash run-demand.sh https://owndev.ru
set -euo pipefail

BACKEND_URL="${1:-http://localhost:3000}"
SEEDS_FILE="$(dirname "$0")/seeds.json"

if [ ! -f "$SEEDS_FILE" ]; then
  echo "✗ seeds.json not found at $SEEDS_FILE"
  exit 1
fi

echo "→ Backend: $BACKEND_URL"
echo "→ Seeds:   $SEEDS_FILE"
echo ""

# Все 31 seed (services + city/service + cities general)
SEEDS=$(jq -c '
  (.seeds_services_pure + .seeds_city_service_priority_14 + .seeds_cities_general)
' "$SEEDS_FILE")

PROJECT=$(jq -c '{
  project_code: .project_code,
  brand: .brand,
  seeds: (.seeds_services_pure + .seeds_city_service_priority_14 + .seeds_cities_general),
  recommended_geos: ["225", "10995", "977"],
  skip_crawl: true,
  skip_audit: true
}' "$SEEDS_FILE")

echo "→ Запуск pipeline (только Demand stage, остальное пропускаем)..."
echo ""

JOB_ID="sanit-demand-$(date +%s)"

curl -sS -X POST "$BACKEND_URL/api/v3/pipeline" \
  -H 'Content-Type: application/json' \
  -d "$(echo "$PROJECT" | jq --arg jid "$JOB_ID" '. + {job_id: $jid}')" \
  | jq '.'

echo ""
echo "→ Проверь результат: $BACKEND_URL/api/v3/pipeline/$JOB_ID"
