#!/bin/bash
# Проверка production на сервере (nginx + docker + miniapp).
set -e

DOMAIN="${1:-vkconf.skypath.fun}"
BASE="https://${DOMAIN}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

echo "=== Docker ==="
if command -v docker >/dev/null 2>&1; then
  docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null || warn "docker compose ps недоступен"
else
  warn "docker не найден"
fi

echo ""
echo "=== Локальные сервисы ==="
for spec in "3000:/health:bot" "3001:/health:admin"; do
  port="${spec%%:*}"
  rest="${spec#*:}"
  path="${rest%%:*}"
  name="${rest##*:}"
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}${path}" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    ok "${name} http://127.0.0.1:${port}${path} → ${code}"
  else
    fail "${name} http://127.0.0.1:${port}${path} → ${code} (запустите ./deploy.sh)"
  fi
done

api_code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3001/api/config" 2>/dev/null || echo "000")
if [ "$api_code" = "200" ]; then
  ok "admin /api/config → ${api_code}"
else
  fail "admin /api/config → ${api_code}"
fi

echo ""
echo "=== Nginx: активный server_name ==="
if command -v nginx >/dev/null 2>&1; then
  nginx -T 2>/dev/null | grep -E "server_name|root " | head -20 || warn "nginx -T недоступен (нужен sudo)"
  if [ -L /etc/nginx/sites-enabled/default ] 2>/dev/null || [ -f /etc/nginx/sites-enabled/default ]; then
    fail "Включён sites-enabled/default — отключите: sudo rm /etc/nginx/sites-enabled/default"
  else
    ok "default site отключён"
  fi
  if [ -L "/etc/nginx/sites-enabled/vkconf" ]; then
    ok "sites-enabled/vkconf есть"
  else
    fail "нет sites-enabled/vkconf — sudo ./scripts/install-nginx-vkconf.sh"
  fi
else
  warn "nginx не найден"
fi

echo ""
echo "=== Miniapp static ==="
if [ -f /var/www/vkconf/dist-miniapp/index.html ]; then
  ok "/var/www/vkconf/dist-miniapp/index.html"
else
  fail "нет miniapp — ./scripts/publish-miniapp.sh"
fi

echo ""
echo "=== HTTPS ${DOMAIN} ==="
health=$(curl -sk "${BASE}/health" 2>/dev/null || true)
if echo "$health" | grep -q '"status"'; then
  ok "/health → ${health}"
else
  fail "/health → не JSON (скорее всего не тот nginx server): ${health:0:80}"
fi

config=$(curl -sk "${BASE}/api/config" 2>/dev/null || true)
if echo "$config" | grep -q 'event_description\|"event'; then
  ok "/api/config → JSON"
else
  fail "/api/config → ${config:0:80}"
fi

root_code=$(curl -sk -o /dev/null -w "%{http_code}" "${BASE}/" 2>/dev/null || echo "000")
root_body=$(curl -sk "${BASE}/" 2>/dev/null | head -c 200 || true)
if [ "$root_code" = "500" ]; then
  fail "/ → HTTP 500 (нет index.html или права nginx — запустите ./scripts/publish-miniapp.sh)"
elif [ "$root_code" = "200" ] && echo "$root_body" | grep -qE 'id="root"|VK Cloud|<!doctype html>'; then
  ok "/ → miniapp HTML (HTTP 200)"
  if echo "$root_body" | grep -q 'polyfills-legacy\|__MINIAPP_MOUNTED'; then
    ok "/ → актуальная сборка (legacy + boot watchdog)"
  elif echo "$root_body" | grep -q 'window.WebApp && window.WebApp.ready'; then
    fail "/ → устаревший index.html на сервере. Выполните: git pull && ./scripts/publish-miniapp.sh"
  else
    warn "/ → неизвестная версия index.html — пересоберите miniapp"
  fi
elif [ "$root_code" = "200" ] && [ "$(curl -skI "${BASE}/" 2>/dev/null | grep -i content-length | awk '{print $2}' | tr -d '\r')" = "615" ]; then
  fail "/ → 615 байт (дефолтная страница nginx, не miniapp)"
else
  fail "/ → HTTP ${root_code} — ${root_body:0:60}"
fi

echo ""
echo "Готово."
