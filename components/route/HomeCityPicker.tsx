"use client";

import { getBulgarianHomeCities } from "@/lib/constants/european-cities";
import { useHomeStore } from "@/lib/stores/home.store";

export function HomeCityPicker() {
  const homeCityId = useHomeStore((s) => s.homeCityId);
  const setHomeCityId = useHomeStore((s) => s.setHomeCityId);
  const cities = getBulgarianHomeCities();

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-[var(--waze-text-secondary)]">
        Вкъщи за мен е
      </p>
      <div className="flex flex-wrap gap-2">
        {cities.map((city) => (
          <button
            key={city.id}
            type="button"
            onClick={() => setHomeCityId(city.id)}
            className={`waze-chip ${
              homeCityId === city.id ? "waze-chip-active" : ""
            }`}
          >
            {city.label}
          </button>
        ))}
      </div>
    </div>
  );
}
