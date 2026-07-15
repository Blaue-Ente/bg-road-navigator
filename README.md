# BG Road Navigator

Пътен помощник за българи, пътуващи от Европа до България — граници, трафик, гориво, време и спешни номера.

## Функции

- **Карта** — MapLibre GL с маршрут, трафик и общностни маркери (без API ключ)
- **Маршрут** — планиране на пътуване между градове
- **Граници** — време за изчакване на 12 гранични пункта
- **Гориво / EV** — бензиностанции и зарядни точки
- **Време** — прогноза по маршрута и планински проходи
- **Спешно** — телефони за помощ в 20+ държави
- **Общност** — споделяне на пътна информация
- **PWA** — инсталируемо мобилно приложение

## Технологии

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- MapLibre GL JS ([open-source](https://github.com/maplibre))
- Supabase (auth, по избор)
- Zustand + TanStack React Query

## Стартиране

```bash
npm install
cp .env.example .env.local
npm run dev
```

Отворете [http://localhost:3000](http://localhost:3000).

Приложението работи и **без API ключове** (с демо данни). За пълна функционалност добавете:

| Променлива | Услуга |
|------------|--------|
| `NEXT_PUBLIC_MAP_STYLE_URL` | По избор — custom MapLibre style URL (по подразбиране: Carto Dark Matter) |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Регистрация и профил |
| `TOMTOM_API_KEY` | Реален трафик |
| `OPENWEATHER_API_KEY` | Реална прогноза |
| `OPENCHARGE_API_KEY` | EV зарядни станции |

## Скриптове

```bash
npm run dev    # разработка
npm run build  # production build
npm run start  # production сървър
npm run lint   # ESLint
```

## Деплой на Railway

Проектът е конфигуриран за [Railway](https://railway.app). Файлът `railway.toml` задава build и health check.

### 1. Създай проект

1. Влез в [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → избери `bg-road-navigator`
3. Railway автоматично засича Next.js и пуска `npm run build` + `npm run start`

### 2. Environment variables

В **Project → Variables** добави (копирай от `.env.example`):

| Променлива | Задължителна | Описание |
|------------|--------------|----------|
| `NEXT_PUBLIC_APP_URL` | Да | Публичният URL на услугата, напр. `https://bg-navigator.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Не | Supabase auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Не | Supabase anon key |
| `TOMTOM_API_KEY` | Не | Реален трафик |
| `OPENWEATHER_API_KEY` | Не | Реална прогноза |
| `OPENCHARGE_API_KEY` | Не | EV станции |

Railway задава `PORT` автоматично — не го променяй.

### 3. Публичен домейн

1. **Settings → Networking → Generate Domain**
2. Обнови `NEXT_PUBLIC_APP_URL` с новия Railway URL
3. Ако ползваш Supabase auth, добави същия URL в **Supabase → Authentication → Redirect URLs**

### 4. Локален тест на production build

```bash
npm run build
PORT=3000 npm run start
```

### Бележки

- Картата (MapLibre) работи без API ключ
- Health check: `GET /` (зададен в `railway.toml`)
- За custom домейн: Railway → Settings → Custom Domain → CNAME към Railway
