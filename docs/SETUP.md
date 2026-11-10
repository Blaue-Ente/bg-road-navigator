# Акаунти и общност

Един акаунт: Better Auth върху Neon Postgres (`DATABASE_URL`). Профил, любими места, запазени маршрути и сигнали на картата пишат в същата база. Supabase вече не пази тези данни.

Не пускайте миграцията срещу чужда база. Командите по-долу са за вашия Neon проект.

## Променливи

Задайте ги в `.env.local` и във Vercel → Settings → Environment Variables. Рестартирайте след промяна.

| Променлива | Задължителна | Пример |
| --- | --- | --- |
| `DATABASE_URL` | да | `postgresql://user:pass@host/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | да, в production | дълъг произволен низ, поне 32 знака |
| `BETTER_AUTH_URL` | да, в production | `https://bg-road-navigator.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | да | същият публичен адрес |

Локално `BETTER_AUTH_URL` и `NEXT_PUBLIC_APP_URL` могат да са `http://localhost:3000`.

Генериране на тайна:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Миграция в Neon

1. Отворете Neon → SQL Editor за проекта, чийто connection string е `DATABASE_URL`.
2. Поставете целия файл `drizzle/0001_better_auth_and_community.sql`.
3. Изпълнете го веднъж.

Същото през `psql`, без да записвате паролата в git:

```bash
psql "$DATABASE_URL" -f drizzle/0001_better_auth_and_community.sql
```

Файлът създава таблиците на Better Auth (`user`, `session`, `account`, `verification`) и `profiles`, `saved_places`, `saved_routes`, `community_pins`, `pin_comments`, `community_pin_votes`, `community_pin_reports`.

## Проверка

```bash
npm run dev
```

Отворете `/register`, създайте акаунт и `/profile`. `GET /api/health` връща `database_configured: true`, когато `DATABASE_URL` е зададен. Самата миграция не се пуска от приложението.
