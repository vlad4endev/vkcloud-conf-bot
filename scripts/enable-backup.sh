#!/usr/bin/env bash
# Включить автобэкап каждые BACKUP_INTERVAL_HOURS (по умолчанию 2 ч.)
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

chmod +x scripts/backup.sh scripts/backup-entrypoint.sh scripts/restore-backup.sh
mkdir -p backups
chmod 700 backups 2>/dev/null || true

if [ -f .env ]; then
  if ! grep -q '^BACKUP_INTERVAL_HOURS=' .env; then
    echo "BACKUP_INTERVAL_HOURS=2" >>.env
    echo "➕ Добавлено BACKUP_INTERVAL_HOURS=2 в .env"
  fi
  if ! grep -q '^BACKUP_RETENTION_DAYS=' .env; then
    echo "BACKUP_RETENTION_DAYS=7" >>.env
    echo "➕ Добавлено BACKUP_RETENTION_DAYS=7 в .env"
  fi
else
  echo "⚠️  Нет .env — используются значения по умолчанию из docker-compose"
fi

echo "🚀 Запуск контейнера backup..."
$COMPOSE up -d backup

echo ""
echo "📦 Первый бэкап (может занять до минуты)..."
$COMPOSE logs --tail=20 backup || true

echo ""
echo "✅ Автобэкап включён."
echo "   Интервал: ${BACKUP_INTERVAL_HOURS:-2} ч."
echo "   Каталог:  $ROOT/backups/"
echo ""
echo "Проверка:"
echo "  docker compose ps backup"
echo "  docker compose logs -f backup"
echo "  ls -la backups/"
