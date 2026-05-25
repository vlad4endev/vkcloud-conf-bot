#!/bin/bash
# Сборка miniapp и публикация статики в /var/www/vkconf/dist-miniapp (на сервере)
set -e

WEB_ROOT="${WEB_ROOT:-/var/www/vkconf/dist-miniapp}"

echo "📦 Сборка miniapp..."
npm run build:miniapp

echo "📂 Публикация в ${WEB_ROOT}..."
sudo mkdir -p "$(dirname "$WEB_ROOT")"
sudo rm -rf "${WEB_ROOT}"
sudo cp -r dist-miniapp "$WEB_ROOT"
sudo chown -R www-data:www-data "$(dirname "$WEB_ROOT")" 2>/dev/null || true

echo "✅ Miniapp опубликован: ${WEB_ROOT}"
echo "   Проверка: curl -sI https://vkconf.skypath.fun/ | head -5"
