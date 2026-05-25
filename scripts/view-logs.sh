#!/bin/bash
# Просмотр логов VK CONF на сервере (Docker + nginx + miniapp).
# Использование:
#   ./scripts/view-logs.sh           # снимок последних строк
#   ./scripts/view-logs.sh -f bot  # follow только бот
#   ./scripts/view-logs.sh -f      # follow bot + admin
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

LINES="${LINES:-80}"
FOLLOW=""
SERVICE=""

while [ $# -gt 0 ]; do
  case "$1" in
    -f|--follow)
      FOLLOW=1
      shift
      ;;
    -n)
      LINES="$2"
      shift 2
      ;;
    bot|admin|postgres|all)
      SERVICE="$1"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [-f] [-n 200] [bot|admin|postgres|all]"
      exit 0
      ;;
    *)
      echo "Неизвестный аргумент: $1" >&2
      exit 1
      ;;
  esac
done

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "❌ docker compose не найден" >&2
  exit 1
fi

compose_logs() {
  local svc="$1"
  if [ -n "${FOLLOW}" ]; then
    echo "——— ${svc} (follow, Ctrl+C) ———"
    $COMPOSE logs -f --tail="${LINES}" "${svc}"
  else
    echo ""
    echo "========== ${svc} (последние ${LINES} строк) =========="
    $COMPOSE logs --tail="${LINES}" "${svc}" 2>&1 || true
  fi
}

if [ -n "${FOLLOW}" ]; then
  case "${SERVICE:-all}" in
    bot) compose_logs bot ;;
    admin) compose_logs admin ;;
    postgres) compose_logs postgres ;;
    *)
      echo "Следим за bot и admin (Ctrl+C)..."
      $COMPOSE logs -f --tail="${LINES}" bot admin
      ;;
  esac
  exit 0
fi

echo "=== docker compose ps ==="
$COMPOSE ps 2>&1 || true

echo ""
echo "=== miniapp (статика) ==="
if [ -f dist-miniapp/index.html ]; then
  ls -la dist-miniapp/index.html dist-miniapp/assets/*.js 2>/dev/null | head -5 || true
elif [ -f /var/www/vkconf/dist-miniapp/index.html ]; then
  ls -la /var/www/vkconf/dist-miniapp/index.html /var/www/vkconf/dist-miniapp/assets/*.js 2>/dev/null | head -5 || true
else
  echo "⚠️  dist-miniapp/index.html не найден"
fi

if [ -f /var/log/nginx/error.log ]; then
  echo ""
  echo "========== nginx error.log (последние ${LINES}) =========="
  sudo tail -n "${LINES}" /var/log/nginx/error.log 2>/dev/null || tail -n "${LINES}" /var/log/nginx/error.log 2>/dev/null || true
fi

case "${SERVICE:-all}" in
  bot) compose_logs bot ;;
  admin) compose_logs admin ;;
  postgres) compose_logs postgres ;;
  all)
    compose_logs bot
    compose_logs admin
    compose_logs postgres
    ;;
esac

echo ""
echo "Подсказки:"
echo "  ./scripts/view-logs.sh -f bot     # логи бота в реальном времени"
echo "  ./scripts/view-logs.sh -n 200   # больше строк"
echo "  docker compose logs bot | grep -i error"
