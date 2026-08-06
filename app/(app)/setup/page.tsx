"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { ServicesStatusPanel } from "@/components/setup/ServicesStatusPanel";
import { useServiceStatus } from "@/lib/hooks/useServiceStatus";

const STEPS = [
  {
    title: "1. Копирай env шаблона",
    body: "cp .env.example .env.local — оставете празни редовете, които още нямате. Празен NEXT_PUBLIC_* се третира като липсващ.",
  },
  {
    title: "2. Supabase (акаунти + общност)",
    body: "Създайте проект → вземете Project URL и anon key → сложете NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  },
  {
    title: "3. Приложете SQL веднъж",
    body: "В Supabase → SQL Editor поставете съдържанието на supabase/apply_all.sql (или миграциите 001→008 по ред; няма 003). Задължително за профили/любими/пинове.",
  },
  {
    title: "4. Auth redirect",
    body: "Supabase → Authentication → URL Configuration: добавете локалния http://localhost:3000 и публичния NEXT_PUBLIC_APP_URL.",
  },
  {
    title: "5. Препоръчани безплатни ключове",
    body: "NAKORDONI_API_KEY (live граници) и по желание WINDY_WEBCAMS_API_KEY.",
  },
  {
    title: "6. По избор (платени/freemium)",
    body: "TOMTOM_API_KEY (трафик + гориво), OPENCHARGE_API_KEY (EV), NVIDIA_API_KEY (AI план).",
  },
  {
    title: "7. Проверка",
    body: "Рестартирайте npm run dev и отворете /api/config/status — трябва да видите configured: true за добавените услуги.",
  },
];

export default function SetupPage() {
  const { data } = useServiceStatus();

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title="Настройка"
          subtitle="Кодът е готов — остава да въведете ключове и веднъж SQL за Supabase"
        />

        <WazeCard className="border-[var(--waze-accent)]/20 bg-[var(--waze-accent-muted)]">
          <p className="text-sm text-[var(--waze-text)]">
            Без ключове приложението пак работи (карта, маршрут, оценки за
            граници, винетки, евристичен план). Ключовете отключват live данни,
            акаунти и общност.
          </p>
          {data?.summary.ready_for_keys_only && (
            <p className="mt-2 text-xs font-medium text-[var(--waze-accent)]">
              ready_for_keys_only: true
            </p>
          )}
        </WazeCard>

        <ServicesStatusPanel />

        <WazeCard>
          <h2 className="mb-3 text-sm font-semibold text-[var(--waze-text)]">
            Стъпки (веднъж)
          </h2>
          <ol className="space-y-3">
            {STEPS.map((step) => (
              <li key={step.title}>
                <p className="text-sm font-medium text-[var(--waze-text)]">
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--waze-text-secondary)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </WazeCard>

        <WazeCard>
          <h2 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
            Полезни линкове
          </h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a
                href="/api/config/status"
                className="text-[var(--waze-accent)] hover:underline"
              >
                /api/config/status
              </a>{" "}
              <span className="text-[var(--waze-text-muted)]">
                — JSON без секрети
              </span>
            </li>
            <li>
              <a
                href="/api/health"
                className="text-[var(--waze-accent)] hover:underline"
              >
                /api/health
              </a>
            </li>
            <li>
              <Link href="/vignettes" className="text-[var(--waze-accent)] hover:underline">
                Винетки
              </Link>
              {" · "}
              <Link href="/borders" className="text-[var(--waze-accent)] hover:underline">
                Граници
              </Link>
              {" · "}
              <Link href="/profile" className="text-[var(--waze-accent)] hover:underline">
                Профил
              </Link>
            </li>
          </ul>
        </WazeCard>
      </div>
    </div>
  );
}
