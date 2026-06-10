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

Сборка miniapp на VPS: скрипт использует **Docker** (`node:20-bookworm-slim`), чтобы установить Linux-зависимости Vite/Rolldown.  
Если ошибка `Cannot find native binding @rolldown/binding-linux-x64-gnu` — не собирайте на Mac-копии `node_modules`, только `./scripts/publish-miniapp.sh` на сервере.

Альтернатива — собрать на Mac и залить статику:

```bash
# Mac
npm run build:miniapp
rsync -avz dist-miniapp/ ubuntu@YOUR_SERVER:/tmp/dist-miniapp/
# Сервер
sudo mkdir -p /var/www/vkconf/dist-miniapp
sudo cp -a /tmp/dist-miniapp/. /var/www/vkconf/dist-miniapp/
sudo chown -R www-data:www-data /var/www/vkconf/dist-miniapp
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
- [ ] В панели MAX привязан URL `MINI_APP_URL`, кнопка в чате открывает **внутри MAX** (не браузер)

### Мини-приложение внутри MAX (не обычная ссылка)

1. **Панель MAX** → Чат-боты → ваш бот → **Чат-бот и мини-приложение** → URL: `https://vkconf.skypath.fun/` → Сохранить.  
   После этого в чате появится штатная кнопка запуска mini app.

2. **Кнопка в сообщениях бота** — тип `open_app` (не `link`):
   ```env
   MAX_BOT_USERNAME=id280106037423_bot
   ```

3. **Пересоберите образ бота** (обязательно, не только `restart`):
   ```bash
   git pull
   docker compose build bot
   docker compose up -d bot
   ```

4. Miniapp подключает `https://st.max.ru/js/max-web-app.js` (`window.WebApp`) — без этого MAX Bridge не работает.

### Белый / пустой экран в MAX (сайт в браузере открывается)

1. **Проверьте URL в панели MAX** — для бота `ДАЕР_тест` должен быть ровно `https://vkconf.skypath.fun/` (тот же домен, что в `.env` `MINI_APP_URL`).
2. **Пересоберите miniapp на сервере** (не с Mac-копии `node_modules`):
   ```bash
   cd /opt/vkconf && git pull && ./scripts/publish-miniapp.sh
   ```
3. **Диагностика в MAX** — временно укажите URL `https://vkconf.skypath.fun/diag.html`.  
   Должны появиться строки `WebApp: yes`, `user.id: …`, `/api/config →`.  
   Если `diag.html` работает, а `/` — нет: проблема в React-бандле (нужен legacy build из последнего коммита).
4. **Проверка с сервера:** `./scripts/verify-production.sh vkconf.skypath.fun`
5. В `index.html` **не вызывайте** `WebApp.ready()` до загрузки React — иначе MAX показывает белый WebView.

### «Не удалось открыть мини-приложение» в MAX

Чаще всего одна из причин:

1. **URL не привязан к этому боту** — в панели MAX откройте **того же бота**, с которым вы переписываетесь (не другой тестовый/прод), раздел **Чат-бот и мини-приложение** → `https://vkconf.skypath.fun/` → **Сохранить**.
2. **`MAX_BOT_USERNAME` в `.env` от другого бота** — после деплоя смотрите лог:  
   `docker compose logs bot | grep miniapp` — должно быть `@имя_вашего_бота`. Если warning про несовпадение — удалите или исправьте `MAX_BOT_USERNAME`.
3. **Старый образ бота** — `docker compose build bot && docker compose up -d bot`, затем `/start` заново.

Логи:

```bash
docker compose logs -f bot
docker compose logs -f admin
```

---

## Резервные копии (каждые 2 часа)

Контейнер `backup` в `docker-compose.yml` автоматически сохраняет:

- дамп PostgreSQL (`database.sql.gz`);
- архив загрузок (`uploads.tar.gz`).

Файлы лежат на сервере в `/opt/vkconf/backups/YYYYMMDD-HHMMSS/`.  
Старые копии удаляются через `BACKUP_RETENTION_DAYS` (по умолчанию 7 дней).

```bash
# Запуск / проверка
docker compose up -d backup
docker compose logs -f backup

# Ручной бэкап
./scripts/backup.sh
ls -la backups/

# Восстановление (осторожно — перезапишет БД)
./scripts/restore-backup.sh 20260610-120000
```

Настройки в `.env`:

| Переменная | По умолчанию | Описание |
|---|---|---|
| `BACKUP_INTERVAL_HOURS` | `2` | Интервал между копиями |
| `BACKUP_RETENTION_DAYS` | `7` | Сколько дней хранить |

Рекомендуется дополнительно копировать каталог `backups/` на другой диск или в облако (rsync, S3).

---

## Обновление релиза

```bash
cd /opt/vkconf
git pull
git log -1 --oneline   # убедитесь, что подтянулся нужный коммит

# Полный деплой: Docker (bot + admin API) + miniapp + веб-админка /panel/
./deploy.sh
```

**Важно:** расписание в браузере правится на **`https://vkconf.skypath.fun/panel/`** — это статика nginx, не Docker. Одного `docker compose restart` недостаточно: нужен `./scripts/publish-admin-panel.sh` (входит в `./deploy.sh` с версии после фикса расписания).

Только пересборка API без статики:

```bash
docker compose build bot admin && docker compose up -d bot admin
./scripts/publish-admin-panel.sh
```

После обновления — жёсткое обновление страницы в браузере: **Ctrl+Shift+R** (кэш JS).

Быстрое обновление (миграции + статика):

```bash
cd /opt/vkconf
chmod +x scripts/update-production.sh
./scripts/update-production.sh
```

### Нет переключателя треков / спикеров / чекбоксов в расписании

1. **Миграции не применены** — на хосте `npm run db:migrate` не сработает (нет `prisma` в PATH). Нужно:
   ```bash
   docker compose run --rm bot npx prisma migrate deploy
   ```
2. **Старая статика** — miniapp и `/panel/` лежат в nginx, не в Docker:
   ```bash
   ./scripts/publish-miniapp.sh
   ./scripts/publish-admin-panel.sh
   ```
3. В **Расписании** (`/panel/`) при редактировании сессии должны быть **чекбоксы спикеров**, поле **Трек**, в miniapp — блок «Выберите трек».
4. Сессии с треком «Технологический» / «Бизнес» нужно явно назначить в админке — иначе всё остаётся в «Общем треке».

Только миграции без пересборки:

```bash
docker compose run --rm bot npx prisma migrate deploy
docker compose restart bot admin
```

---

## Частые проблемы

| Симптом | Решение |
|---|---|
| `/health` и `/api/config` — HTML 404, `/` — **615 байт** | Активен **дефолтный** nginx, не vkconf. См. ниже |
| Бот не стартует | `docker compose logs bot` — проверьте `BOT_TOKEN`, `WEBHOOK_URL` |
| `Invalid environment variables` | `./scripts/check-env.sh`, длина `ADMIN_JWT_SECRET` ≥ 32 |
| Webhook 404 | nginx: `location /webhook` → порт 3000 |
| Miniapp не грузит API | nginx: `location /api/` → порт 3001 |
| `/` → HTTP 500 или цикл `index.html` в nginx error.log | `./scripts/publish-miniapp.sh`, затем `sudo ./scripts/install-nginx-vkconf.sh` |
| Seed падает | Повторный запуск безопасен; админ уже есть — можно игнорировать |

### HTML 404 на `/health` и дефолтная страница на `/`

Значит запросы **не попадают** в `nginx/vkconf.skypath.fun.conf` (часто включён `sites-enabled/default`).

```bash
cd /opt/vkconf
git pull
sudo ./scripts/install-nginx-vkconf.sh
./scripts/publish-miniapp.sh
./scripts/verify-production.sh
```

Ручная проверка:

```bash
ls -la /etc/nginx/sites-enabled/
sudo nginx -T | grep -E 'server_name|root '
curl -s http://127.0.0.1:3000/health
curl -s http://127.0.0.1:3001/api/config
```

---

## Переменные (кратко)

Обязательные в production: `BOT_TOKEN`, `DATABASE_URL`, `ADMIN_JWT_SECRET`, `ADMIN_CODE_WORD`, `WEBHOOK_URL`, `MINI_APP_URL`.

Рекомендуется: сменить `POSTGRES_PASSWORD`, задать `ADMIN_CORS_ORIGIN`.
