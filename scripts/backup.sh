#!/usr/bin/env bash
# Резервная копия PostgreSQL + uploads (Docker volume).
# Запуск: ./scripts/backup.sh
# Внутри контейнера backup — автоматически каждые BACKUP_INTERVAL_HOURS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-vkconf}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-vkconf_secret}"
POSTGRES_DB="${POSTGRES_DB:-vkcloud_conf}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  COMPOSE=""
fi

timestamp="$(date -u +%Y%m%d-%H%M%S)"
target="$BACKUP_DIR/$timestamp"
mkdir -p "$target"
chmod 700 "$BACKUP_DIR" 2>/dev/null || true

dump_db() {
  local outfile="$target/database.sql.gz"
  if [ -n "${PGHOST:-}" ]; then
    export PGPASSWORD="$POSTGRES_PASSWORD"
    pg_dump -h "$PGHOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl | gzip -9 >"$outfile"
    unset PGPASSWORD
    return
  fi

  if [ -z "$COMPOSE" ]; then
    echo "❌ Нет docker compose и PGHOST — не могу сделать dump БД"
    exit 1
  fi

  if ! $COMPOSE ps --status running postgres 2>/dev/null | grep -q postgres; then
    echo "❌ Контейнер postgres не запущен"
    exit 1
  fi

  $COMPOSE exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl | gzip -9 >"$outfile"
}

archive_uploads() {
  local uploads_src=""
  if [ -d /uploads ]; then
    uploads_src="/uploads"
  elif [ -d "$ROOT/uploads" ]; then
    uploads_src="$ROOT/uploads"
  elif [ -n "$COMPOSE" ] && $COMPOSE ps --status running bot 2>/dev/null | grep -q bot; then
    $COMPOSE exec -T bot tar -C /app -czf - uploads 2>/dev/null >"$target/uploads.tar.gz" || true
    return
  fi

  if [ -n "$uploads_src" ] && [ -n "$(ls -A "$uploads_src" 2>/dev/null || true)" ]; then
    tar -C "$(dirname "$uploads_src")" -czf "$target/uploads.tar.gz" "$(basename "$uploads_src")"
  else
    echo "uploads: пусто или недоступно" >"$target/uploads.skipped"
  fi
}

write_manifest() {
  cat >"$target/manifest.json" <<EOF
{
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "postgresDb": "$POSTGRES_DB",
  "postgresUser": "$POSTGRES_USER",
  "files": {
    "database": "database.sql.gz",
    "uploads": "$( [ -f "$target/uploads.tar.gz" ] && echo uploads.tar.gz || echo uploads.skipped )"
  }
}
EOF
}

prune_old() {
  if [ ! -d "$BACKUP_DIR" ]; then
    return
  fi
  find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime "+$BACKUP_RETENTION_DAYS" -exec rm -rf {} + 2>/dev/null || true
}

echo "📦 Резервная копия → $target"
dump_db
archive_uploads
write_manifest
prune_old

db_size="$(du -h "$target/database.sql.gz" | cut -f1)"
echo "✅ Готово: database.sql.gz ($db_size), хранение ${BACKUP_RETENTION_DAYS} дн."
