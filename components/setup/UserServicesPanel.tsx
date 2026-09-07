"use client";

import { useServiceStatus } from "@/lib/hooks/useServiceStatus";
import { WazeCard } from "@/components/ui/WazeCard";
import type { ServiceId } from "@/lib/config/service-status";

interface UserServiceCopy {
  id: ServiceId;
  title: string;
  whenOn: string;
  whenOff: string;
}

const USER_SERVICES: UserServiceCopy[] = [
  {
    id: "supabase",
    title: "Профил и запазени данни",
    whenOn: "Вход, любими и запазени маршрути се пазят в облака",
    whenOff: "Можете да разглеждате свободно; записите не се пазят след изход",
  },
  {
    id: "nakordoni",
    title: "Опашки на границите",
    whenOn: "Показваме живи времена на изчакване",
    whenOff: "Показваме оценка по обичайните часове",
  },
  {
    id: "windy",
    title: "Камери на границите",
    whenOn: "Вградени кадри, където има камера",
    whenOff: "Отваряме външна страница, когато няма вграден поток",
  },
  {
    id: "tomtom",
    title: "Трафик и бензиностанции",
    whenOn: "Станции и трафик по маршрута",
    whenOff: "Показваме оценка на разхода без жива карта на станциите",
  },
  {
    id: "opencharge",
    title: "Зарядни станции",
    whenOn: "Зарядни точки по маршрута",
    whenOff: "EV точки ще се появят, когато услугата е свързана",
  },
];

export function UserServicesPanel() {
  const { data, isLoading, isError, refetch } = useServiceStatus();

  if (isLoading) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-muted)]">
          Проверка на услугите…
        </p>
      </WazeCard>
    );
  }

  if (isError || !data) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-secondary)]">
          Състоянието на услугите не може да се зареди.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm text-[var(--waze-accent)] underline"
        >
          Опитай пак
        </button>
      </WazeCard>
    );
  }

  const byId = new Map(data.services.map((service) => [service.id, service]));

  return (
    <WazeCard>
      <h2 className="text-sm font-semibold text-[var(--waze-text)]">
        Състояние на услугите
      </h2>
      <p className="mt-1 mb-3 text-xs text-[var(--waze-text-muted)]">
        Карта, маршрут и съвети работят винаги. По-долу е какво е свързано в
        момента.
      </p>
      <ul className="space-y-1.5">
        {USER_SERVICES.map((item) => {
          const configured = byId.get(item.id)?.configured ?? false;
          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--waze-text)]">
                  {item.title}
                </p>
                <p className="text-[11px] text-[var(--waze-text-muted)]">
                  {configured ? item.whenOn : item.whenOff}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  configured
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-[var(--waze-surface)] text-[var(--waze-text-muted)]"
                }`}
              >
                {configured ? "активно" : "ограничено"}
              </span>
            </li>
          );
        })}
      </ul>
    </WazeCard>
  );
}
