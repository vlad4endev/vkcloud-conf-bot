#!/bin/sh
set -eu

INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-2}"
INTERVAL_SEC=$((INTERVAL_HOURS * 3600))

echo "🕐 Автобэкап каждые ${INTERVAL_HOURS} ч. → ${BACKUP_DIR:-/backups}"

while true; do
  if sh /scripts/backup.sh; then
    echo "⏭️  Следующий бэкап через ${INTERVAL_HOURS} ч."
  else
    echo "⚠️  Бэкап завершился с ошибкой, повтор через ${INTERVAL_HOURS} ч." >&2
  fi
  sleep "$INTERVAL_SEC"
done
