"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { ServicesStatusPanel } from "@/components/setup/ServicesStatusPanel";
import { UserServicesPanel } from "@/components/setup/UserServicesPanel";
import { useOperatorMode } from "@/lib/hooks/useOperatorMode";

const STEPS = [
  {
    title: "1. Копирай шаблона за среда",
    body: "Копирайте примера за среда в локален файл и оставете празни редовете, които още нямате.",
  },
  {
    title: "2. Акаунти и общност",
    body: "Създайте проект в Supabase и поставете публичния адрес и анонимния ключ.",
  },
  {
    title: "3. Приложете SQL веднъж",
    body: "В SQL редактора поставете еднократния скрипт от папката supabase. Нужно е за профили, любими и общност.",
  },
  {
    title: "4. Адрес за вход",
    body: "В настройките за вход добавете локалния адрес и публичния адрес на сайта.",
  },
  {
    title: "5. Препоръчани безплатни услуги",
    body: "Ключ за живи гранични опашки и по желание ключ за уеб камери.",
  },
  {
    title: "6. По избор",
    body: "Трафик и бензиностанции, зарядни станции, AI план за пътуване.",
  },
  {
    title: "7. Проверка",
    body: "Рестартирайте сървъра за разработка и отворете служебния статус JSON.",
  },
];

export default function SetupPage() {
  const { enabled } = useOperatorMode();

  if (!enabled) {
    return (
      <div className="waze-page">
        <div className="mx-auto max-w-2xl space-y-4">
          <PageHeader
            title="Услуги"
            subtitle="Какво работи в приложението в момента — без технически подробности"
          />
          <UserServicesPanel />
          <p className="text-center text-xs text-[var(--waze-text-muted)]">
            Карта, маршрут и съвети са достъпни без допълнителна настройка.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title="Настройка"
          subtitle="Служебен екран за оператори — ключове и еднократен SQL"
        />

        <WazeCard className="border-[var(--waze-accent)]/20 bg-[var(--waze-accent-muted)]">
          <p className="text-sm text-[var(--waze-text)]">
            Без ключове приложението пак работи: карта, маршрут, оценки за
            граници, винетки и автоматичен план. Ключовете отключват живи данни,
            акаунти и общност.
          </p>
        </WazeCard>

        <WazeCard>
          <h2 className="mb-3 text-sm font-semibold text-[var(--waze-text)]">
            Кои ключове да подсигурите
          </h2>
          <ul className="space-y-2 text-sm text-[var(--waze-text-secondary)]">
            <li>
              <strong className="text-[var(--waze-text)]">
                За публичен сайт:
              </strong>{" "}
              публичен адрес, Supabase и ключ за живи гранични опашки.
            </li>
            <li>
              <strong className="text-[var(--waze-text)]">Препоръчани:</strong>{" "}
              трафик и бензиностанции, зарядни станции, уеб камери.
            </li>
            <li>
              <strong className="text-[var(--waze-text)]">По избор:</strong> AI
              план, собствен маршрутизатор или стил на картата.
            </li>
            <li>
              <strong className="text-[var(--waze-text)]">Без ключ:</strong>{" "}
              карта, публично маршрутизиране, геокодиране, време, курс и близки
              болници.
            </li>
          </ul>
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
            Полезни връзки
          </h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="/vignettes"
                className="text-[var(--waze-accent)] hover:underline"
              >
                Винетки
              </Link>
              {" · "}
              <Link
                href="/borders"
                className="text-[var(--waze-accent)] hover:underline"
              >
                Граници
              </Link>
              {" · "}
              <Link
                href="/profile"
                className="text-[var(--waze-accent)] hover:underline"
              >
                Профил
              </Link>
            </li>
          </ul>
        </WazeCard>
      </div>
    </div>
  );
}
