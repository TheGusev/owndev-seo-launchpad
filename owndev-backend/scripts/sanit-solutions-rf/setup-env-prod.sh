#!/usr/bin/env bash
# Подключение Yandex Cloud SearchAPI v2 (Wordstat) на прод-сервере 155.212.188.244
# Запускать НА сервере (или через ssh).
#
# Использование:
#   YANDEX_FOLDER_ID=b1g... YANDEX_API_KEY=AQVN... bash setup-env-prod.sh
#
# Совместимость: если у тебя уже была переменная YANDEX_IAM_TOKEN — её тоже подхватит,
# но рекомендуется использовать YANDEX_API_KEY (AI Studio).
set -euo pipefail

KEY="${YANDEX_API_KEY:-${YANDEX_IAM_TOKEN:-}}"
if [ -z "${YANDEX_FOLDER_ID:-}" ] || [ -z "$KEY" ]; then
  echo "✗ Передай переменные окружения:"
  echo "    YANDEX_FOLDER_ID=b1g... YANDEX_API_KEY=AQVN... bash setup-env-prod.sh"
  exit 1
fi

# Авто-обнаружение .env
ENV_FILE=""
for candidate in \
    /opt/owndev/owndev-backend/.env \
    /var/www/owndev/owndev-backend/.env \
    /root/owndev-seo-launchpad/owndev-backend/.env \
    /home/owndev/owndev-seo-launchpad/owndev-backend/.env; do
  if [ -f "$candidate" ]; then ENV_FILE="$candidate"; break; fi
done
if [ -z "$ENV_FILE" ]; then
  ENV_FILE=$(find /opt /var/www /root /home -maxdepth 6 -type f -name '.env' 2>/dev/null \
             | grep owndev | head -1 || true)
fi
if [ -z "$ENV_FILE" ] || [ ! -f "$ENV_FILE" ]; then
  echo "✗ .env не найден. Передай явно: ENV_FILE=/path/to/.env bash setup-env-prod.sh"
  exit 1
fi
echo "→ ENV_FILE = $ENV_FILE"

echo "→ Бэкап .env"
cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%s)"

# Удалить старые значения если есть
sed -i '/^YANDEX_WORDSTAT_MODE=/d' "$ENV_FILE"
sed -i '/^YANDEX_FOLDER_ID=/d' "$ENV_FILE"
sed -i '/^YANDEX_IAM_TOKEN=/d' "$ENV_FILE"
sed -i '/^YANDEX_API_KEY=/d' "$ENV_FILE"

# Добавить новые
{
  echo ""
  echo "# Yandex Cloud SearchAPI v2 (Wordstat) — добавлено $(date -Iseconds)"
  echo "YANDEX_WORDSTAT_MODE=search_api"
  echo "YANDEX_FOLDER_ID=$YANDEX_FOLDER_ID"
  echo "YANDEX_API_KEY=$KEY"
} >> "$ENV_FILE"

echo "✓ .env обновлён"
echo "→ Перезапуск PM2 (owndev-backend)..."
pm2 restart owndev-backend --update-env
sleep 2
echo "→ Логи:"
pm2 logs owndev-backend --lines 30 --nostream
