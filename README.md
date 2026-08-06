# BG Road Navigator

Пътен помощник за българи, пътуващи **в цяла Европа** — от и за България. Маршрути, граници, трафик, гориво, EV зарядни, време, почивки и съвети за дълги пътувания (30+ часа).

## Функции

- **Карта** — MapLibre GL с маршрут, трафик и общностни маркери (без API ключ)
- **Маршрут** — реални пътни разстояния (OSRM) между 45+ града и 18 коридора, или до произволен адрес, хотел и пътна точка в Европа
- **Граници** — България + европейски транзитни пунктове; live опашки (Nakordoni)
- **Гориво / EV** — бензиностанции и зарядни точки
- **Време** — прогноза по маршрута (Open-Meteo, без ключ)
- **Почивки** — зони за почивка и нощувка по коридорите
- **Съвети** — препоръки за дълги пътувания (граници, винетки, почивки)
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

Отворете [http://localhost:3000](http://localhost:3000) или [http://localhost:3000/setup](http://localhost:3000/setup).

Приложението работи и **без API ключове** (карта, маршрут, оценки за граници, винетки, евристичен план).  
Кодът е в режим **keys-only**: остава да попълните `.env.local` и веднъж Supabase SQL.

### Keys-only checklist

1. `cp .env.example .env.local` и попълнете ключовете (виж таблицата по-долу)
2. Supabase проект → URL + anon key
3. В SQL Editor: съдържанието на `supabase/apply_all.sql` (веднъж)
4. Supabase Auth → Redirect URLs: `http://localhost:3000` и публичният URL
5. Рестарт на `npm run dev` → проверка: [`/api/config/status`](http://localhost:3000/api/config/status)

| Променлива | Услуга | Нужна? |
|------------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Акаунти, любими, общност | За auth/writes |
| `NAKORDONI_API_KEY` | Live гранични опашки ([nakordoni.eu](https://nakordoni.eu/en/developers)) | Препоръчително (безплатно) |
| `WINDY_WEBCAMS_API_KEY` | Webcam изображения ([Windy](https://api.windy.com/webcams)) | По избор |
| `TOMTOM_API_KEY` | Трафик + бензиностанции | По избор |
| `OPENCHARGE_API_KEY` | EV зарядни | По избор |
| `NVIDIA_API_KEY` | AI план (иначе евристика) | По избор |
| `NEXT_PUBLIC_APP_URL` | Публичен URL / Auth redirects | Препоръчително при deploy |
| `NEXT_PUBLIC_MAP_STYLE_URL` | Custom MapLibre style | По избор |
| `OSRM_API_URL` | Собствен OSRM | По избор |
| `GEOCODING_API_URL` | Собствен geocoder | По избор |

**Времето** използва [Open-Meteo](https://open-meteo.com) — **без API ключ**.

Статус без секрети: `GET /api/config/status` · health: `GET /api/health` · UI: `/setup`

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
| `NEXT_PUBLIC_APP_URL` | Препоръчително | Публичният URL, напр. `https://bg-navigator.up.railway.app` (Auth redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | За акаунти | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | За акаунти | Supabase anon key |
| `NAKORDONI_API_KEY` | Препоръчително | Безплатен ключ от [nakordoni.eu/developers](https://nakordoni.eu/en/developers) |
| `WINDY_WEBCAMS_API_KEY` | Не | Windy webcams |
| `TOMTOM_API_KEY` | Не | Трафик + гориво |
| `OPENCHARGE_API_KEY` | Не | EV станции |
| `NVIDIA_API_KEY` | Не | AI trip planner |

След Supabase ключовете приложете `supabase/apply_all.sql` веднъж в SQL Editor.

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
- Health check: `GET /api/health` (или `/`)
- След deploy: отворете `/setup` и `/api/config/status`
- За custom домейн: Railway → Settings → Custom Domain → CNAME към Railway
