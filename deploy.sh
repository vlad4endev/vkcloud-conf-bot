#!/bin/bash
set -e

echo "🚀 Начинаем деплой VK Cloud Conf 2026 Bot..."

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo -e "${RED}❌ Не найден docker compose. Установите Docker 24+ и Compose 2+.${NC}"
  exit 1
fi

if [ ! -f .env ]; then
  echo -e "${RED}❌ Файл .env не найден! Скопируйте .env.example и заполните.${NC}"
  exit 1
fi

chmod +x scripts/check-env.sh 2>/dev/null || true
./scripts/check-env.sh

echo -e "${YELLOW}📦 Собираем Docker образы...${NC}"
$COMPOSE build --no-cache

echo -e "${YELLOW}🗄️  Запускаем базу данных...${NC}"
$COMPOSE up -d postgres
sleep 5

echo -e "${YELLOW}🔄 Применяем миграции...${NC}"
$COMPOSE run --rm bot sh -c "npx prisma migrate deploy"

echo -e "${YELLOW}🌱 Запускаем seed (если ещё не выполнен)...${NC}"
$COMPOSE run --rm bot sh -c "npx --yes tsx prisma/seed.ts" || echo "Seed уже выполнен или пропущен"

echo -e "${YELLOW}🤖 Запускаем сервисы...${NC}"
$COMPOSE up -d bot admin

echo -e "${YELLOW}⏳ Ждём запуска (10 сек)...${NC}"
sleep 10

echo -e "${YELLOW}📋 Статус контейнеров:${NC}"
$COMPOSE ps

echo -e "${YELLOW}📝 Последние логи бота:${NC}"
$COMPOSE logs --tail=20 bot

WEBHOOK_BASE=$(grep -E '^WEBHOOK_URL=' .env | cut -d= -f2- | tr -d '\r')
BOT_TOKEN=$(grep -E '^BOT_TOKEN=' .env | cut -d= -f2- | tr -d '\r')

echo -e "${GREEN}✅ Деплой завершён!${NC}"
echo ""
echo "Admin API:  http://localhost:3001/health"
echo "Bot health: http://localhost:3000/health"
echo "Webhook:    ${WEBHOOK_BASE}/webhook"
echo ""
if [ -n "$WEBHOOK_BASE" ]; then
  echo -e "${YELLOW}Webhook регистрируется автоматически при старте бота (WEBHOOK_URL в .env).${NC}"
  echo "Проверка вручную:"
  echo "curl -X POST https://platform-api.max.ru/subscriptions \\"
  echo "  -H \"Authorization: ${BOT_TOKEN}\" \\"
  echo "  -H \"Content-Type: application/json\" \\"
  echo "  -d '{\"url\": \"${WEBHOOK_BASE}/webhook\", \"update_types\": [\"bot_started\", \"message_created\", \"message_callback\"]}'"
fi
