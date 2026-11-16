# Акаунти и общност

Един акаунт: Better Auth върху Neon Postgres (`DATABASE_URL`). Профил, любими места, запазени маршрути и сигнали на картата пишат в същата база. Имейл и парола остават. Google и Apple се включват само когато ключовете им са зададени.

Не пускайте миграцията срещу чужда база. Командите по-долу са за вашия Neon проект.

## Променливи

Задайте ги в `.env.local` и във Vercel → Settings → Environment Variables. Рестартирайте след промяна.

| Променлива                    | Задължителна         | Пример                                           |
| ----------------------------- | -------------------- | ------------------------------------------------ |
| `DATABASE_URL`                | да                   | `postgresql://user:pass@host/db?sslmode=require` |
| `BETTER_AUTH_SECRET`          | да, в production     | дълъг произволен низ, поне 32 знака              |
| `BETTER_AUTH_URL`             | да, в production     | `https://bg-road-navigator.vercel.app`           |
| `NEXT_PUBLIC_APP_URL`         | да, за публичен сайт | същият публичен адрес                            |
| `GOOGLE_CLIENT_ID`            | не                   | от Google Cloud                                  |
| `GOOGLE_CLIENT_SECRET`        | не                   | от Google Cloud                                  |
| `APPLE_CLIENT_ID`             | не                   | Services ID                                      |
| `APPLE_CLIENT_SECRET`         | не                   | JWT, валиден до 6 месеца                         |
| `APPLE_APP_BUNDLE_IDENTIFIER` | не                   | Bundle ID на приложението                        |

Локално `BETTER_AUTH_URL` и `NEXT_PUBLIC_APP_URL` могат да са `http://localhost:3000`.

На Vercel preview оставете `BETTER_AUTH_URL` празно. Тогава адресът за вход е `https://` плюс `VERCEL_URL` на този preview, а не продукционният домейн.

Останалите ключове от `.env.example` (`NAKORDONI_API_KEY`, `TOMTOM_API_KEY`, `OPENCHARGE_API_KEY`, `WINDY_WEBCAMS_API_KEY`, `NVIDIA_API_KEY`, `OCI_GEO_BASE_URL`, `OCI_GEO_API_KEY`, `CRON_SECRET`, `OSRM_API_URL`, `GEOCODING_API_URL`, `NEXT_PUBLIC_MAP_STYLE_URL`, `NEXT_PUBLIC_OPERATOR_MODE`) не са част от акаунта. `OCI_GEO_API_KEY` се праща само от сървъра като `X-API-Key` и не се слага в `NEXT_PUBLIC_*`. Един `CRON_SECRET` пази и двата Hobby крона в `vercel.json`: `GET /api/cron/warm-geo` в 08:00 UTC (на Pro може `*/10 * * * *`; без тайна маршрутът е отворен и не връща OCI ключа) и `GET /api/cron/nakordoni` в 05:20 UTC (на Pro може `*/15 * * * *`; в продукция без тайна отговаря с 401). Vercel праща `Authorization: Bearer`.

Генериране на тайна:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Миграция в Neon

1. Отворете Neon → SQL Editor за проекта, чийто connection string е `DATABASE_URL`.
2. Поставете целия файл `drizzle/0001_better_auth_and_community.sql`.
3. Изпълнете го веднъж.
4. След него изпълнете и `drizzle/0002_trip_planner_cache.sql`. Той пази споделения кеш на Nakordoni и заявките към POI за плана на пътуването.
5. След него изпълнете `drizzle/0003_planner_places.sql`. Той добавя предпочитанията в профила, националните средни цени, докладите за цена, флаговете за места и любимите маршрути и места. Не се прилага автоматично.
6. След това `drizzle/0004_nakordoni_rate.sql` — глобално ограничаване на честотата към Nakordoni (една таблица `nakordoni_rate`).

Същото през `psql`, без да записвате паролата в git:

```bash
psql "$DATABASE_URL" -f drizzle/0001_better_auth_and_community.sql
psql "$DATABASE_URL" -f drizzle/0002_trip_planner_cache.sql
psql "$DATABASE_URL" -f drizzle/0003_planner_places.sql
psql "$DATABASE_URL" -f drizzle/0004_nakordoni_rate.sql
```

Първият файл създава таблиците на Better Auth (`user`, `session`, `account`, `verification`) и `profiles`, `saved_places`, `saved_routes`, `community_pins`, `pin_comments`, `community_pin_votes`, `community_pin_reports`. Вторият създава `nakordoni_cache`, `nakordoni_budget` и `osm_query_cache`.

## План на пътуването и Nakordoni

`POST /api/plan` чете само кеша. Не вика Nakordoni за всеки потребител. Лицензът е за двата пазара на пункта, не само за произход 12: `NAKORDONI_LICENSED_MARKETS` (по подразбиране `12,5,15,19`, без Сърбия 13 и Турция 14). Калотина, Капитан Андреево, Лесово и Малко Търново остават на типичното чакане, а при зададен `TOMTOM_API_KEY` планът добавя `traffic_delay_min`. Отговор 401, 403 или 404 се помни 24 часа и не се повтаря на всеки тик. `errors_by_status` в JSON на крона брои грешките по статус.

Кронът е `GET /api/cron/nakordoni` в `vercel.json`, разписание `20 5 * * *` (веднъж дневно, 05:20 UTC). Това е таванът на Hobby: по-чест израз като `*/15 * * * *` спира деплоя с грешка, че акаунтът е ограничен до един път на ден. На Pro сменете израза на `*/15 * * * *`. Самият job не пълни квотата на всеки тик: опашките се подновяват най-много на 6 часа, прогнозата и border v4 на 12 часа, day-stats на 20 часа, директорията на 25 дни. Мекият таван на крона е 80 тежки и 400 евтини заявки на ден, под лимита 200 / 1000. При 2 заявки в секунда има пауза от 600 ms.

В продукция задайте същия `CRON_SECRET`. Проверката е общата `authorizeCron` (Bearer или `x-cron-secret`). Без тайната продукционният адрес отговаря с 401 и не харчи квота. `GET /api/cron/warm-geo` ползва същата тайна, но остава отворен, ако тя липсва, защото само подгрява Valhalla, Photon и POI `/health`. `GET /api/cron/fuel-bulletin` е на `30 6 * * *` и в продукция без тайна също отговаря с 401: тегли седмичния бюлетин на Европейската комисия (цени с данъци, Euro-super 95 и дизел) и го пази в `fuel_national_averages`. Няма Fuelo и няма изтрити цени.

Цени: Австрия е E-Control (без ключ). Германия е Tankerkönig и иска `TANKERKOENIG_API_KEY`; без него цената остава неизвестна. BG, RS, HU, RO и TR нямат доставчик и връщат `price unknown`. EV станциите идват от Open Charge Map, когато `OPENCHARGE_API_KEY` е зададен, но цената на кВтч не се измисля.

## Google

1. Отворете [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials).
2. Изберете или създайте проект.
3. APIs & Services → OAuth consent screen. Тип External. Име на приложението: BG Road Navigator. Попълнете support email и запазете.
4. Credentials → Create credentials → OAuth client ID. Тип: Web application.
5. Authorized JavaScript origins:
   - `https://bg-road-navigator.vercel.app`
   - `http://localhost:3000`
6. Authorized redirect URIs:
   - `https://bg-road-navigator.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
7. Копирайте Client ID в `GOOGLE_CLIENT_ID` и Client secret в `GOOGLE_CLIENT_SECRET`.

Бутонът „Продължи с Google“ се показва само когато и двете променливи са попълнени.

## Apple

Sign in with Apple изисква платен Apple Developer Program (99 USD на година). Без него няма Services ID и ключ.

1. Влезте в [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list).
2. Identifiers → App IDs → регистрирайте App ID с включено Sign in with Apple. Bundle ID, например `app.bgroadnavigator`. Това е `APPLE_APP_BUNDLE_IDENTIFIER`, ако го ползвате.
3. Identifiers → Services IDs → регистрирайте Services ID, например `app.bgroadnavigator.web`. Това е `APPLE_CLIENT_ID`.
4. Отворете Services ID → Sign in with Apple → Configure.
   - Primary App ID: App ID от стъпка 2.
   - Domains: `bg-road-navigator.vercel.app`
   - Return URLs:
     - `https://bg-road-navigator.vercel.app/api/auth/callback/apple`
     - `http://localhost:3000/api/auth/callback/apple`
   - Apple приема return URL с `https`. За локален тест ползвайте тунел с https или само продукционния адрес, ако конзолата откаже `http://localhost`.
5. Keys → създайте ключ с включено Sign in with Apple, вързан към App ID. Свалете файла `.p8` веднъж. Запишете Key ID и Team ID.
6. Клиентската тайна е JWT, подписан с `.p8`, с живот най-много 6 месеца. След изтичане издайте нов и го сложете в `APPLE_CLIENT_SECRET`.

```bash
node --input-type=module <<'EOF'
import { SignJWT, importPKCS8 } from "jose";
import { readFileSync } from "node:fs";

const key = await importPKCS8(readFileSync("AuthKey_KEYID.p8", "utf8"), "ES256");
const jwt = await new SignJWT({})
  .setProtectedHeader({ alg: "ES256", kid: "KEY_ID" })
  .setIssuer("TEAM_ID")
  .setIssuedAt()
  .setExpirationTime("180d")
  .setAudience("https://appleid.apple.com")
  .setSubject("APPLE_CLIENT_ID")
  .sign(key);
console.log(jwt);
EOF
```

Заменете `KEY_ID`, `TEAM_ID`, `APPLE_CLIENT_ID` и пътя до `.p8`. `jose` е вече в зависимостите на Better Auth.

Бутонът „Продължи с Apple“ се показва само когато `APPLE_CLIENT_ID` и `APPLE_CLIENT_SECRET` са попълнени.

Същият имейл през Google или Apple и през имейл/парола става един потребител.

## Проверка

```bash
npm run dev
```

Отворете `/register`, създайте акаунт и `/profile`. `GET /api/health` връща `database_configured`, `database_reachable` (`select 1` с кратък таймаут) и `auth_tables_ready` (има ли `user`, `session`, `account` и `verification`). Самата миграция не се пуска от приложението.
