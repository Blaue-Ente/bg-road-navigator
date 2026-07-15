# BG Road Navigator

Пътен помощник за българи, пътуващи **в цяла Европа** — от и за България. Маршрути, граници, трафик, гориво, EV зарядни, време, почивки и съвети за дълги пътувания (30+ часа).

## Функции

- **Карта** — MapLibre GL с маршрут, трафик и общностни маркери (без API ключ)
- **Маршрут** — реални пътни разстояния (OSRM) между 45+ града и 18 коридора
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

Отворете [http://localhost:3000](http://localhost:3000).

Приложението работи и **без API ключове** (с демо/оценъчни данни). За пълна функционалност:

| Променлива | Услуга |
|------------|--------|
| `NEXT_PUBLIC_MAP_STYLE_URL` | По избор — custom MapLibre style URL |
| `NAKORDONI_API_KEY` | **Безплатен** — live опашки + камери на границите ([nakordoni.eu](https://nakordoni.eu/en/developers)) |
| `WINDY_WEBCAMS_API_KEY` | По избор — вградени webcam изображения ([Windy](https://api.windy.com/webcams)) |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Регистрация и профил |
| `OSRM_API_URL` | Не | Собствен OSRM сървър (по подразбиране: публичен demo) |
| `TOMTOM_API_KEY` | Реален трафик |

**Времето** използва [Open-Meteo](https://open-meteo.com) — **без API ключ**, open-source.

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
| `NAKORDONI_API_KEY` | Препоръчително | Безплатен ключ от [nakordoni.eu/developers](https://nakordoni.eu/en/developers) — live гранични опашки |
| `WINDY_WEBCAMS_API_KEY` | Не | Безплатен Windy ключ за вградени webcam изображения |
| `NEXT_PUBLIC_SUPABASE_URL` | Не | Supabase auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Не | Supabase anon key |
| `TOMTOM_API_KEY` | Не | Реален трафик |

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
