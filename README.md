# БГ Навигатор

Пътен помощник за българи в Европа — от и за България. Маршрути, граници, гориво, почивки и съвети за дълги пътувания.

## Функции

- **Карта** — MapLibre GL със слоеве, клъстери и светла/тъмна тема (без API ключ)
- **Маршрут** — реални пътни разстояния (OSRM), алтернативи, списък с маневри; жива навигация през Google/Apple Maps
- **Граници** — България + европейски транзитни пунктове; live опашки (Nakordoni)
- **Гориво / EV** — бензиностанции, зарядни точки и оценка на разход
- **Време** — текущи условия по маршрута (Open-Meteo, без ключ)
- **Почивки** — зони за почивка и нощувка по коридорите
- **Съвети** — препоръки за дълги пътувания (граници, винетки, почивки)
- **Спешно** — телефони за помощ + близки болници/сервизи (OSM)
- **Общност** — споделяне на пътна информация
- **PWA** — инсталируемо; shell cache за карта и спешни номера

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

| Променлива                                                   | Услуга                                                                    | Приоритет                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                        | Публичен URL / Auth redirects                                             | **Must** при публичен сайт            |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Акаунти, любими, общност                                                  | **Must** за вход и запис              |
| `NAKORDONI_API_KEY`                                          | Live гранични опашки ([nakordoni.eu](https://nakordoni.eu/en/developers)) | **Must** за публичен сайт (безплатно) |
| `TOMTOM_API_KEY`                                             | Трафик + бензиностанции                                                   | Should                                |
| `OPENCHARGE_API_KEY`                                         | EV зарядни                                                                | Should                                |
| `WINDY_WEBCAMS_API_KEY`                                      | Webcam изображения ([Windy](https://api.windy.com/webcams))               | Should                                |
| `NVIDIA_API_KEY`                                             | AI план (иначе евристика)                                                 | Optional                              |
| `NEXT_PUBLIC_MAP_STYLE_URL`                                  | Custom MapLibre style                                                     | Optional                              |
| `OSRM_API_URL`                                               | Собствен OSRM                                                             | Optional                              |
| `GEOCODING_API_URL`                                          | Собствен geocoder                                                         | Optional                              |

**Без ключ:** MapLibre/Carto, публичен OSRM, Nominatim, Open-Meteo, Frankfurter FX, Overpass (болници/сервизи).

Не поставяйте реални секрети в git. Попълнете ги в `.env.local` / Vercel / Railway.

**Времето** използва [Open-Meteo](https://open-meteo.com) — **без API ключ**.

Статус без секрети: `GET /api/config/status` · health: `GET /api/health` · UI: `/setup`

## Скриптове

```bash
npm run dev     # разработка
npm run build   # production build
npm run start   # production сървър
npm run lint    # ESLint
npm test        # Vitest
npm run format  # Prettier check
```

## Деплой на Railway

Проектът е конфигуриран за [Railway](https://railway.app). Файлът `railway.toml` задава build и health check.

### 1. Създай проект

1. Влез в [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → избери `bg-road-navigator`
3. Railway автоматично засича Next.js и пуска `npm run build` + `npm run start`

### 2. Environment variables

В **Project → Variables** добави (копирай от `.env.example`):

| Променлива                      | Задължителна   | Описание                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | Препоръчително | Публичният URL, напр. `https://bg-navigator.up.railway.app` (Auth redirects)    |
| `NEXT_PUBLIC_SUPABASE_URL`      | За акаунти     | Supabase project URL                                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | За акаунти     | Supabase anon key                                                               |
| `NAKORDONI_API_KEY`             | Препоръчително | Безплатен ключ от [nakordoni.eu/developers](https://nakordoni.eu/en/developers) |
| `WINDY_WEBCAMS_API_KEY`         | Не             | Windy webcams                                                                   |
| `TOMTOM_API_KEY`                | Не             | Трафик + гориво                                                                 |
| `OPENCHARGE_API_KEY`            | Не             | EV станции                                                                      |
| `NVIDIA_API_KEY`                | Не             | AI trip planner                                                                 |

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
