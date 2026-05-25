#!/bin/bash
# Подставляет один домен и (опционально) имя бота MAX в .env
set -e

DOMAIN="${1:-vkconf.skypath.fun}"
BOT_USERNAME="${2:-}"
BASE="https://${DOMAIN}"
MINI_APP="${BASE}/"

if [ ! -f .env ]; then
  echo "❌ Нет файла .env — скопируйте: cp .env.example .env"
  exit 1
fi

set_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" .env; then
    sed -i.bak "s|^${key}=.*|${key}=${value}|" .env
  else
    echo "${key}=${value}" >> .env
  fi
}

set_var WEBHOOK_URL "$BASE"
set_var MINI_APP_URL "$MINI_APP"
set_var ADMIN_CORS_ORIGIN "$BASE"

if [ -n "$BOT_USERNAME" ]; then
  set_var MAX_BOT_USERNAME "$BOT_USERNAME"
fi

rm -f .env.bak

echo "✅ Домен ${DOMAIN} записан в .env:"
echo "   WEBHOOK_URL=${BASE}"
echo "   MINI_APP_URL=${MINI_APP}  ← вставить в панель MAX (мини-приложение)"
echo "   ADMIN_CORS_ORIGIN=${BASE}"
if [ -n "$BOT_USERNAME" ]; then
  echo "   MAX_BOT_USERNAME=${BOT_USERNAME}"
  echo "   Кнопка в боте: https://max.ru/${BOT_USERNAME}?startapp"
else
  echo ""
  echo "⚠️  Укажите MAX_BOT_USERNAME (имя бота в MAX) для кнопки мини-приложения:"
  echo "   ./scripts/setup-domain-env.sh ${DOMAIN} ИмяВашегоБота"
fi
echo ""
echo "Webhook для MAX: ${BASE}/webhook"
