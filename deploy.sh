#!/bin/bash
set -e

echo "🚀 Начинаем деплой VK Cloud Conf 2026 Bot..."

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Проверяем наличие .env
if [ ! -f .env ]; then
  echo -e "${RED}❌ Файл .env не найден! Скопируйте .env.example и заполните.${NC}"
  exit 1
fi

# Проверяем BOT_TOKEN
if grep -q "BOT_TOKEN=your_max_bot_token_here" .env; then
  echo -e "${RED}❌ BOT_TOKEN не заполнен в .env!${NC}"
  exit 1
fi

echo -e "${YELLOW}📦 Собираем Docker образы...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}🗄️  Запускаем базу данных...${NC}"
docker-compose up -d postgres
sleep 5

echo -e "${YELLOW}🔄 Применяем миграции...${NC}"
docker-compose run --rm bot sh -c "npx prisma migrate deploy"

echo -e "${YELLOW}🌱 Запускаем seed...${NC}"
docker-compose run --rm bot sh -c "npx tsx prisma/seed.ts" || echo "Seed уже выполнен, пропускаем"

echo -e "${YELLOW}🤖 Запускаем сервисы...${NC}"
docker-compose up -d bot admin

echo -e "${YELLOW}⏳ Ждём запуска (10 сек)...${NC}"
sleep 10

echo -e "${YELLOW}📋 Статус контейнеров:${NC}"
docker-compose ps

echo -e "${YELLOW}📝 Последние логи бота:${NC}"
docker-compose logs --tail=20 bot

echo -e "${GREEN}✅ Деплой завершён!${NC}"
echo ""
echo "Admin API: http://localhost:3001"
echo "Bot webhook: http://localhost:3000/webhook"
echo ""
echo -e "${YELLOW}Не забудьте зарегистрировать webhook в MAX:${NC}"
echo "curl -X POST https://platform-api.max.ru/subscriptions \\"
echo "  -H \"Authorization: \$(grep BOT_TOKEN .env | cut -d= -f2)\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"url\": \"https://ВАШ_ДОМЕН/webhook\", \"update_types\": [\"bot_started\", \"message_created\", \"message_callback\"]}'"
