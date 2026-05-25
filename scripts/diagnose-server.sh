#!/bin/bash
# Быстрая диагностика по типичным ошибкам из nginx/bot логов.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

WEB_ROOT="${WEB_ROOT:-/var/www/vkconf/dist-miniapp}"

echo "=== Miniapp static ==="
if [ -f "${WEB_ROOT}/index.html" ]; then
  ok "${WEB_ROOT}/index.html существует"
  head -12 "${WEB_ROOT}/index.html" | sed 's/^/    /'
else
  fail "нет ${WEB_ROOT}/index.html → белый экран / цикл nginx"
  echo "    Запустите: ./scripts/publish-miniapp.sh"
fi

echo ""
echo "=== HTTPS главная ==="
code=$(curl -sk -o /tmp/vkconf-home.html -w "%{http_code}" "https://vkconf.skypath.fun/" || echo "000")
if [ "$code" = "200" ] && grep -q 'id="root"' /tmp/vkconf-home.html 2>/dev/null; then
  ok "GET / → HTTP ${code}, HTML с #root"
else
  fail "GET / → HTTP ${code} (ожидали 200 и miniapp HTML)"
fi

echo ""
echo "=== MAX bot / miniapp (из логов docker) ==="
if docker compose logs bot 2>/dev/null | tail -80 | grep -q 'не совпадает с ботом токена'; then
  warn "MAX_BOT_USERNAME в .env не совпадает с BOT_TOKEN"
  docker compose logs bot 2>/dev/null | grep 'miniapp' | tail -5 | sed 's/^/    /' || true
  echo "    Исправление на сервере:"
  echo "      sed -i '/^MAX_BOT_USERNAME=/d' .env"
  echo "      docker compose up -d bot --force-recreate"
  echo "    В панели MAX мини-приложение привяжите к @username из лога (не к display name)."
else
  docker compose logs bot 2>/dev/null | grep 'miniapp' | tail -3 | sed 's/^/    /' || warn "нет строк miniapp в логах bot"
fi

echo ""
echo "=== Nginx redirect cycle (последние ошибки) ==="
if [ -r /var/log/nginx/error.log ]; then
  cycles=$(grep -c 'redirection cycle' /var/log/nginx/error.log 2>/dev/null || echo 0)
  recent=$(grep 'redirection cycle' /var/log/nginx/error.log 2>/dev/null | tail -1 || true)
  if [ "${cycles}" -gt 0 ]; then
    if [ -n "${recent}" ]; then
      warn "были циклы redirect (${cycles} записей). Последняя:"
      echo "    ${recent}"
    fi
    echo "    Обновите nginx: sudo ./scripts/install-nginx-vkconf.sh"
    echo "    и опубликуйте miniapp: ./scripts/publish-miniapp.sh"
  else
    ok "циклов redirect в error.log не найдено"
  fi
else
  warn "нет доступа к /var/log/nginx/error.log"
fi

echo ""
echo "=== Postgres healthcheck noise ==="
if docker compose logs postgres 2>/dev/null | tail -5 | grep -q 'database "vkconf" does not exist'; then
  warn 'pg_isready без -d: шум "database vkconf does not exist" (исправлено в docker-compose.yml)'
  echo "    Перезапуск: docker compose up -d postgres"
else
  ok "нет свежих ошибок database vkconf в postgres"
fi
