#!/bin/bash
# Сборка miniapp и публикация в /var/www/vkconf/dist-miniapp
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"
WEB_ROOT="${WEB_ROOT:-/var/www/vkconf/dist-miniapp}"
BUILD_USER="${BUILD_USER:-$(id -u):$(id -g)}"

docker_available() {
  command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1
}

ensure_miniapp_writable() {
  # node_modules после Docker часто принадлежит root — ломает npm ci у ubuntu
  if [ -d miniapp/node_modules ] && [ ! -w miniapp/node_modules ]; then
    echo "🔧 Исправление прав miniapp/node_modules (были root)..."
    sudo rm -rf miniapp/node_modules
  fi

  if [ -d miniapp/node_modules ]; then
    rm -rf miniapp/node_modules 2>/dev/null || sudo rm -rf miniapp/node_modules
  fi

  sudo chown -R "${BUILD_USER}" miniapp 2>/dev/null || true
}

build_miniapp_local() {
  echo "📦 Сборка miniapp локально на сервере..."
  ensure_miniapp_writable
  (cd miniapp && npm ci)
  npm run build:miniapp
  sudo chown -R "${BUILD_USER}" dist-miniapp 2>/dev/null || true
}

build_miniapp_docker() {
  echo "📦 Сборка miniapp в Docker (Linux)..."
  ensure_miniapp_writable
  if docker run --rm \
    -u "${BUILD_USER}" \
    -v "${ROOT}:/workspace" \
    -w /workspace/miniapp \
    node:20-bookworm-slim \
    bash -c "npm ci && npm run build"; then
    sudo chown -R "${BUILD_USER}" dist-miniapp miniapp/node_modules 2>/dev/null || true
    return 0
  fi
  return 1
}

build_miniapp() {
  if docker_available; then
    if build_miniapp_docker; then
      return
    fi
    echo "⚠️  Docker-сборка не удалась — пробуем локально..."
  elif command -v docker >/dev/null 2>&1; then
    echo "⚠️  Docker установлен, но нет доступа к docker.sock — собираем локально..."
  fi

  build_miniapp_local
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
