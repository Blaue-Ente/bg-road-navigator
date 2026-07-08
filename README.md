# BG Road Navigator
A comprehensive travel assistant for Bulgarians driving from anywhere in Europe to anywhere in Bulgaria.

## Features
- Real-time traffic and border crossing information
- Fuel and EV charging station finder
- Weather forecasts along the route
- Emergency numbers for all European countries
- Community report system for road hazards
- Progressive Web App (PWA) with offline support

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Maps:** Mapbox GL JS
- **Database:** Supabase
- **State:** Zustand + React Query
- **PWA:** next-pwa

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Development
pnpm dev

# Build
pnpm build

# Test
pnpm test
```

## Environment Variables

Required:
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

Optional:
- `TOMTOM_API_KEY` - TomTom traffic API
- `OPENWEATHER_API_KEY` - OpenWeatherMap API
- `OPENCHARGE_API_KEY` - OpenChargeMap API

## Deployment
This project is optimized for Vercel deployment. Simply connect your GitHub repository to Vercel.