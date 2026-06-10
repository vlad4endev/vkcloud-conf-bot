#!/usr/bin/env bash
# Полное обновление production: код, Docker, миграции, статика miniapp + админка
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "❌ Нужен docker compose"
  exit 1
fi

echo "📥 git pull..."
git pull

echo "🔨 Сборка образов bot + admin (без кэша)..."
$COMPOSE build --no-cache bot admin

echo "🗄️ PostgreSQL..."
$COMPOSE up -d postgres
sleep 5

echo "🔄 Миграции Prisma (в контейнере)..."
$COMPOSE run --rm bot npx prisma migrate deploy

echo "🚀 Запуск сервисов (пересоздание контейнеров)..."
chmod +x scripts/backup.sh scripts/backup-entrypoint.sh scripts/restore-backup.sh 2>/dev/null || true
mkdir -p backups
$COMPOSE up -d --force-recreate bot admin backup

echo "🌐 Публикация miniapp и админ-панели..."
chmod +x scripts/publish-miniapp.sh scripts/publish-admin-panel.sh
./scripts/publish-admin-panel.sh
./scripts/publish-miniapp.sh

if command -v nginx >/dev/null 2>&1; then
  sudo nginx -t && sudo systemctl reload nginx
fi

echo ""
echo "✅ Готово. Проверка:"
echo "  curl -s https://vkconf.skypath.fun/health"
echo "  curl -s https://vkconf.skypath.fun/api/config | head"
echo "  Откройте https://vkconf.skypath.fun/panel/ → Расписание (чекбоксы спикеров)"
echo "  Откройте miniapp → Программа (переключатель треков)"
