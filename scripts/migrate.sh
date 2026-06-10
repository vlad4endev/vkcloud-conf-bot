#!/usr/bin/env bash
# Prisma migrate deploy inside Docker (postgres hostname only resolves in compose network).
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

$COMPOSE up -d postgres
sleep 3
$COMPOSE run --rm bot npx prisma migrate deploy
