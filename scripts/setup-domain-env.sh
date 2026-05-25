#!/bin/bash
# Подставляет один домен в .env (WEBHOOK_URL, MINI_APP_URL, ADMIN_CORS_ORIGIN)
set -e

DOMAIN="${1:-vkconf.skypath.fun}"
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

rm -f .env.bak

echo "✅ Домен ${DOMAIN} записан в .env:"
echo "   WEBHOOK_URL=${BASE}"
echo "   MINI_APP_URL=${MINI_APP}"
echo "   ADMIN_CORS_ORIGIN=${BASE}"
echo ""
echo "Webhook для MAX: ${BASE}/webhook"
echo "Мини-приложение: ${MINI_APP}"
