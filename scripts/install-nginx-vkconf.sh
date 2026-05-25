#!/bin/bash
# Включает сайт vkconf.skypath.fun и отключает дефолтный nginx (частая причина 404).
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE_NAME="vkconf"
DOMAIN="vkconf.skypath.fun"
AVAILABLE="/etc/nginx/sites-available/${SITE_NAME}"
ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}"
DEFAULT="/etc/nginx/sites-enabled/default"

if [ "$(id -u)" -ne 0 ]; then
  echo "Запустите с sudo: sudo ./scripts/install-nginx-vkconf.sh"
  exit 1
fi

if [ ! -f "${ROOT}/nginx/vkconf.skypath.fun.conf" ]; then
  echo "❌ Не найден ${ROOT}/nginx/vkconf.skypath.fun.conf"
  exit 1
fi

echo "📄 Копируем конфиг nginx..."
cp "${ROOT}/nginx/vkconf.skypath.fun.conf" "${AVAILABLE}"
ln -sf "${AVAILABLE}" "${ENABLED}"

if [ -e "${DEFAULT}" ]; then
  echo "🗑️  Отключаем дефолтный сайт nginx (default)..."
  rm -f "${DEFAULT}"
fi

if ! [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  echo "⚠️  SSL-сертификат для ${DOMAIN} не найден."
  echo "    Выполните: certbot --nginx -d ${DOMAIN}"
  echo "    (после этого снова запустите этот скрипт)"
fi

echo "🔍 Проверка конфигурации..."
nginx -t

echo "🔄 Перезагрузка nginx..."
systemctl reload nginx

echo ""
echo "✅ Сайт ${DOMAIN} включён."
echo "   Дальше: ./scripts/publish-miniapp.sh"
echo "   Проверка: curl -s https://${DOMAIN}/health"
