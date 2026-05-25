#!/bin/bash
# Проверка .env перед деплоем (запускать на сервере или локально)
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ ! -f .env ]; then
  echo -e "${RED}❌ Файл .env не найден. Выполните: cp .env.example .env${NC}"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

errors=0

check_nonempty() {
  local name="$1"
  local value="$2"
  if [ -z "${value// }" ]; then
    echo -e "${RED}❌ $name не заполнен${NC}"
    errors=$((errors + 1))
  fi
}

check_nonempty "BOT_TOKEN" "$BOT_TOKEN"
check_nonempty "ADMIN_CODE_WORD" "$ADMIN_CODE_WORD"
check_nonempty "ADMIN_JWT_SECRET" "$ADMIN_JWT_SECRET"
check_nonempty "WEBHOOK_URL" "$WEBHOOK_URL"
check_nonempty "MINI_APP_URL" "$MINI_APP_URL"

if [ -n "$ADMIN_JWT_SECRET" ] && [ "${#ADMIN_JWT_SECRET}" -lt 32 ]; then
  echo -e "${RED}❌ ADMIN_JWT_SECRET должен быть не короче 32 символов${NC}"
  errors=$((errors + 1))
fi

if [ "$errors" -gt 0 ]; then
  echo -e "${RED}Исправьте .env и запустите снова.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ .env прошёл проверку${NC}"
