#!/usr/bin/env bash
# Подключение Yandex Cloud SearchAPI на прод-сервере 155.212.188.244
# Запускать НА сервере (или через ssh).
#
# Использование:
#   YANDEX_FOLDER_ID=b1g... YANDEX_IAM_TOKEN=AQVN... bash setup-env-prod.sh
set -euo pipefail

if [ -z "${YANDEX_FOLDER_ID:-}" ] || [ -z "${YANDEX_IAM_TOKEN:-}" ]; then
  echo "✗ Передай переменные окружения:"
  echo "    YANDEX_FOLDER_ID=b1g... YANDEX_IAM_TOKEN=AQVN... bash setup-env-prod.sh"
  exit 1
fi

ENV_FILE="/opt/owndev/owndev-backend/.env"   # поправь путь если другой
if [ ! -f "$ENV_FILE" ]; then
  echo "✗ .env не найден по пути $ENV_FILE — поправь путь в скрипте"
  exit 1
fi

echo "→ Бэкап .env"
cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%s)"

# Удалить старые значения если есть
sed -i '/^YANDEX_WORDSTAT_MODE=/d' "$ENV_FILE"
sed -i '/^YANDEX_FOLDER_ID=/d' "$ENV_FILE"
sed -i '/^YANDEX_IAM_TOKEN=/d' "$ENV_FILE"

# Добавить новые
{
  echo ""
  echo "# Yandex Cloud SearchAPI v2 (Wordstat) — добавлено $(date -Iseconds)"
  echo "YANDEX_WORDSTAT_MODE=search_api"
  echo "YANDEX_FOLDER_ID=$YANDEX_FOLDER_ID"
  echo "YANDEX_IAM_TOKEN=$YANDEX_IAM_TOKEN"
} >> "$ENV_FILE"

echo "✓ .env обновлён"
echo "→ Перезапуск PM2..."
pm2 restart owndev-backend --update-env
pm2 logs owndev-backend --lines 30 --nostream
