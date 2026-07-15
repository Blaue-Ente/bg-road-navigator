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

## Деплой

Оптимизирано за Vercel — свържете GitHub repo и задайте environment variables.
