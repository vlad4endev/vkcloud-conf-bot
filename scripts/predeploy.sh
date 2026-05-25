#!/bin/bash
# Локальная подготовка артефактов перед выкладкой на сервер
set -e

echo "📋 Проверка зависимостей..."
if [ ! -d node_modules ]; then
  npm ci
fi
if [ ! -d miniapp/node_modules ]; then
  (cd miniapp && npm ci)
fi

echo "🔍 Typecheck + сборка backend и miniapp..."
npm run predeploy

echo "✅ Локальная подготовка завершена."
echo "   dist/         — backend"
echo "   dist-miniapp/ — мини-приложение (залить на CDN/nginx)"
echo ""
echo "Дальше на сервере:"
echo "  ./scripts/setup-domain-env.sh vkconf.skypath.fun"
echo "  ./scripts/check-env.sh → ./deploy.sh"
echo "  sudo cp nginx/vkconf.skypath.fun.conf /etc/nginx/sites-available/vkconf"
echo "  ./scripts/publish-miniapp.sh"
