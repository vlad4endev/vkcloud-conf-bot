#!/usr/bin/env bash
# Сборка admin-panel и публикация в /var/www/vkconf/dist-adminpanel
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/vkconf/dist-adminpanel}"

cd "$ROOT"

if [ ! -d admin-panel/node_modules ]; then
  echo "→ npm install (admin-panel)"
  npm --prefix admin-panel install
fi

echo "→ npm run build:admin-panel"
npm run build:admin-panel

if [ ! -f dist-adminpanel/index.html ]; then
  echo "❌ dist-adminpanel/index.html не найден после сборки"
  exit 1
fi

echo "→ копирование в ${WEB_ROOT}"
sudo mkdir -p "${WEB_ROOT}"
sudo cp -a dist-adminpanel/. "${WEB_ROOT}/"
sudo chown -R www-data:www-data "${WEB_ROOT}" 2>/dev/null || true

echo "✅ Админка: https://vkconf.skypath.fun/panel/"
