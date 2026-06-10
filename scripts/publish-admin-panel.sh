#!/usr/bin/env bash
# Сборка admin-panel и публикация в /var/www/vkconf/panel
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/vkconf/panel}"

cd "$ROOT"

build_admin_panel() {
  if command -v docker >/dev/null 2>&1; then
    echo "📦 Сборка admin-panel в Docker (Linux)..."
    docker run --rm \
      -v "${ROOT}:/workspace" \
      -w /workspace/admin-panel \
      node:20-bookworm-slim \
      bash -c "rm -rf node_modules && npm ci && npm run build"
    return
  fi

  echo "📦 Сборка admin-panel локально..."
  if [ ! -d admin-panel/node_modules ]; then
    npm --prefix admin-panel install
  fi
  npm run build:admin-panel
}

build_admin_panel

if [ ! -f dist-adminpanel/index.html ]; then
  echo "❌ dist-adminpanel/index.html не найден после сборки"
  exit 1
fi

if ! grep -rq 'Публикация в мини-приложении' dist-adminpanel/assets 2>/dev/null; then
  echo "❌ В сборке admin-panel нет экрана публикации квиза — проверьте сборку"
  exit 1
fi

if grep -q 'max-web-app' dist-adminpanel/index.html 2>/dev/null; then
  echo "❌ В сборке admin-panel найден max-web-app — что-то не так"
  exit 1
fi

echo "📂 Публикация в ${WEB_ROOT}..."
sudo mkdir -p "${WEB_ROOT}"
sudo rm -rf "${WEB_ROOT:?}"/*
sudo cp -a dist-adminpanel/. "${WEB_ROOT}/"
sudo chown -R www-data:www-data "${WEB_ROOT}" 2>/dev/null || true
sudo find "${WEB_ROOT}" -type d -exec chmod 755 {} \; 2>/dev/null || true
sudo find "${WEB_ROOT}" -type f -exec chmod 644 {} \; 2>/dev/null || true

if grep -q 'max-web-app' "${WEB_ROOT}/index.html" 2>/dev/null; then
  echo "❌ На сервере в panel/index.html всё ещё miniapp"
  exit 1
fi

echo "✅ Админка: https://vkconf.skypath.fun/panel/"
echo "   Файлов: $(find "${WEB_ROOT}" -type f | wc -l)"
curl -s https://vkconf.skypath.fun/panel/ 2>/dev/null | head -3 || true
