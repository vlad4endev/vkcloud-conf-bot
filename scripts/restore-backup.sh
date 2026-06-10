#!/usr/bin/env bash
# Восстановление из каталога backups/YYYYMMDD-HHMMSS
# Использование: ./scripts/restore-backup.sh 20260610-120000
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Использование: $0 <имя-каталога-бэкапа>"
  echo "Пример: $0 20260610-120000"
  echo "Список: ls -1 backups/"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-vkconf}"
POSTGRES_DB="${POSTGRES_DB:-vkcloud_conf}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
SOURCE="$BACKUP_DIR/$1"

if [ ! -d "$SOURCE" ]; then
  echo "❌ Каталог не найден: $SOURCE"
  exit 1
fi

if [ ! -f "$SOURCE/database.sql.gz" ]; then
  echo "❌ Нет database.sql.gz в $SOURCE"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "❌ Нужен docker compose"
  exit 1
fi

echo "⚠️  Восстановление перезапишет БД $POSTGRES_DB и uploads."
read -r -p "Продолжить? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Отменено."
  exit 0
fi

echo "🗄️  Восстановление PostgreSQL..."
gunzip -c "$SOURCE/database.sql.gz" | $COMPOSE exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1

if [ -f "$SOURCE/uploads.tar.gz" ]; then
  echo "📁 Восстановление uploads..."
  $COMPOSE exec -T bot sh -c 'rm -rf /app/uploads/*'
  gunzip -c "$SOURCE/uploads.tar.gz" | $COMPOSE exec -T bot tar -C /app -xf -
fi

echo "✅ Восстановление из $1 завершено."
