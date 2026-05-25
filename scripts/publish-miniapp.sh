#!/bin/bash
# Сборка miniapp и публикация в /var/www/vkconf/dist-miniapp
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"
WEB_ROOT="${WEB_ROOT:-/var/www/vkconf/dist-miniapp}"

build_miniapp() {
  if command -v docker >/dev/null 2>&1; then
    echo "📦 Сборка miniapp в Docker (Linux, исправляет rolldown на VPS)..."
    docker run --rm \
      -v "${ROOT}:/workspace" \
      -w /workspace/miniapp \
      node:20-bookworm-slim \
      bash -c "rm -rf node_modules && npm ci && npm run build"
    return
  fi

  echo "📦 Сборка miniapp локально (переустановка зависимостей)..."
  rm -rf miniapp/node_modules
  (cd miniapp && npm ci)
  npm run build:miniapp
}

build_miniapp

if [ ! -f dist-miniapp/index.html ]; then
  echo "❌ dist-miniapp/index.html не найден после сборки"
  exit 1
fi

echo "📂 Публикация в ${WEB_ROOT}..."
sudo mkdir -p "${WEB_ROOT}"
sudo rm -rf "${WEB_ROOT:?}"/*
sudo cp -a dist-miniapp/. "${WEB_ROOT}/"
sudo chown -R www-data:www-data "${WEB_ROOT}"
sudo find "${WEB_ROOT}" -type d -exec chmod 755 {} \;
sudo find "${WEB_ROOT}" -type f -exec chmod 644 {} \;

if [ ! -f "${WEB_ROOT}/index.html" ]; then
  echo "❌ После публикации нет ${WEB_ROOT}/index.html"
  exit 1
fi

echo "✅ Miniapp опубликован: ${WEB_ROOT}"
echo "   Файлов: $(find "${WEB_ROOT}" -type f | wc -l)"
curl -sI "https://vkconf.skypath.fun/" 2>/dev/null | head -3 || true
