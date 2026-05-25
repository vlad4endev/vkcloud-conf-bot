# Деплой VK Cloud Conf 2026 Bot

Пошаговая инструкция: от локальной сборки до production на VPS.

## Архитектура

| Компонент | Порт | Назначение |
|---|---|---|
| `postgres` | 5432 (внутри Docker) | База данных |
| `bot` | 3000 | MAX webhook, планировщик уведомлений |
| `admin` | 3001 | Admin API + Mini App API (`/api`) |
| `nginx` + `dist-miniapp` | 443 | HTTPS: miniapp, `/api`, `/webhook` на **одном домене** |

## Требования к серверу

- Ubuntu 22.04+ / Debian 12+ (или аналог)
- Docker 24+ и Docker Compose 2+
- 2 GB RAM, 20 GB диск
- Домен с **HTTPS** (обязательно для MAX webhook)
- Открытые порты: 80, 443 (nginx), 3000/3001 — только localhost за nginx

---

## Шаг 1. Локальная подготовка (на вашем Mac)

```bash
cd "/path/to/VK CONF"
npm ci
(cd miniapp && npm ci)
chmod +x scripts/predeploy.sh scripts/check-env.sh deploy.sh
./scripts/predeploy.sh
```

Проверьте, что появились каталоги `dist/` и `dist-miniapp/` без ошибок.

---

## Шаг 2. Подготовка сервера

```bash
# SSH на сервер
ssh user@your-server

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# перелогиньтесь

# Каталог проекта
sudo mkdir -p /opt/vkconf
sudo chown $USER:$USER /opt/vkconf
cd /opt/vkconf
```

Скопируйте проект на сервер (`git clone`, `rsync` или `scp`):

```bash
rsync -avz --exclude node_modules --exclude .env ./ user@server:/opt/vkconf/
```

На сервере установите зависимости **не обязательно** — всё собирается в Docker. Нужны только файлы проекта и `.env`.

---

## Шаг 3. Переменные окружения

```bash
cp .env.example .env
nano .env   # или vim
./scripts/check-env.sh
```

| Переменная | Пример | Описание |
|---|---|---|
| `BOT_TOKEN` | из [business.max.ru](https://business.max.ru) | Токен бота MAX |
| `ADMIN_JWT_SECRET` | 32+ случайных символов | Секрет JWT админки |
| `ADMIN_CODE_WORD` | ваше слово | Код входа в админку |
| `WEBHOOK_URL` | `https://vkconf.skypath.fun` | **Без** `/webhook` — путь добавится автоматически |
| `MINI_APP_URL` | `https://vkconf.skypath.fun/` | URL мини-приложения в MAX (корень того же домена) |
| `ADMIN_CORS_ORIGIN` | `https://vkconf.skypath.fun` | CORS админки (тот же домен) |

Один домен на всё — скрипт:

```bash
./scripts/setup-domain-env.sh vkconf.skypath.fun
```
| `POSTGRES_PASSWORD` | сильный пароль | Пароль БД (смените дефолт!) |

`DATABASE_URL` в Docker подставляется из `docker-compose.yml` — для контейнеров оставьте значение из `.env.example`.

Сгенерировать секрет:

```bash
openssl rand -base64 48
```

---

## Шаг 4. SSL и nginx (один домен `vkconf.skypath.fun`)

DNS: **A-запись** `vkconf.skypath.fun` → IP сервера.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp nginx/vkconf.skypath.fun.conf /etc/nginx/sites-available/vkconf
sudo ln -sf /etc/nginx/sites-available/vkconf /etc/nginx/sites-enabled/
sudo certbot --nginx -d vkconf.skypath.fun
```

Статика miniapp (после `npm run build:miniapp` на сервере или после rsync `dist-miniapp`):

```bash
chmod +x scripts/publish-miniapp.sh
./scripts/publish-miniapp.sh
sudo nginx -t && sudo systemctl reload nginx
```

Проверка маршрутов:

| URL | Ожидание |
|-----|----------|
| `https://vkconf.skypath.fun/` | HTML miniapp |
| `https://vkconf.skypath.fun/api/config` | JSON |
| `https://vkconf.skypath.fun/health` | `{"status":"ok"}` |
| `https://vkconf.skypath.fun/webhook` | POST от MAX (через nginx → bot) |

---

## Шаг 5. Деплой Docker

```bash
cd /opt/vkconf
chmod +x deploy.sh scripts/check-env.sh
./deploy.sh
```

Скрипт:

1. Проверяет `.env`
2. Собирает образы `bot` и `admin`
3. Поднимает PostgreSQL
4. Применяет миграции Prisma
5. Заполняет начальные данные (seed)
6. Запускает `bot` и `admin`

---

## Шаг 6. Webhook MAX

При `NODE_ENV=production` и заполненном `WEBHOOK_URL` бот **сам** регистрирует webhook при старте.

Итоговый URL: `{WEBHOOK_URL}/webhook` → nginx проксирует на `localhost:3000`.

Ручная проверка:

```bash
curl -s https://YOUR_DOMAIN/webhook -o /dev/null -w "%{http_code}\n"  # через nginx → bot
curl -s http://127.0.0.1:3000/health
curl -s http://127.0.0.1:3001/health
```

---

## Шаг 7. Проверка после деплоя

- [ ] `docker compose ps` — все сервисы `healthy` / `running`
- [ ] Бот отвечает на `/start` в MAX
- [ ] `GET https://YOUR_DOMAIN/api/config` — JSON конфигурации
- [ ] `GET http://127.0.0.1:3001/admin/users` — **401** без токена (норма)
- [ ] Мини-приложение открывается по `MINI_APP_URL`

Логи:

```bash
docker compose logs -f bot
docker compose logs -f admin
```

---

## Обновление релиза

```bash
git pull   # или rsync новой версии
./scripts/predeploy.sh   # локально, если меняли miniapp
# залить dist-miniapp на сервер
./deploy.sh
```

Только миграции без пересборки:

```bash
docker compose run --rm bot npx prisma migrate deploy
docker compose restart bot admin
```

---

## Частые проблемы

| Симптом | Решение |
|---|---|
| Бот не стартует | `docker compose logs bot` — проверьте `BOT_TOKEN`, `WEBHOOK_URL` |
| `Invalid environment variables` | `./scripts/check-env.sh`, длина `ADMIN_JWT_SECRET` ≥ 32 |
| Webhook 404 | nginx: `location /webhook` → порт 3000 |
| Miniapp не грузит API | nginx: `location /api/` → порт 3001 |
| Seed падает | Повторный запуск безопасен; админ уже есть — можно игнорировать |

---

## Переменные (кратко)

Обязательные в production: `BOT_TOKEN`, `DATABASE_URL`, `ADMIN_JWT_SECRET`, `ADMIN_CODE_WORD`, `WEBHOOK_URL`, `MINI_APP_URL`.

Рекомендуется: сменить `POSTGRES_PASSWORD`, задать `ADMIN_CORS_ORIGIN`.
