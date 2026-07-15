"use client";

import { RestAreaCard } from "@/components/hotels/RestAreaCard";

const REST_AREAS = [
  {
    name: "Мотел Тракия",
    location: "АМ Тракия, км 120",
    distanceKm: 45,
    facilities: ["parking", "toilet", "restaurant", "wifi"],
    coords: { lng: 24.2, lat: 42.3 },
  },
  {
    name: "Почивна станция Хемус",
    location: "АМ Хемус, км 85",
    distanceKm: 78,
    facilities: ["parking", "toilet", "restaurant"],
    coords: { lng: 23.8, lat: 42.8 },
  },
  {
    name: "Motel E-80",
    location: "Е-80, близо до Сливница",
    distanceKm: 22,
    facilities: ["parking", "toilet", "shower", "restaurant", "fuel"],
    coords: { lng: 23.0, lat: 42.7 },
  },
];

export default function HotelsPage() {
  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-blue-400">
          Почивки и хотели
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          Места за почивка по магистралите към България
        </p>

        <div className="space-y-4">
          {REST_AREAS.map((area) => (
            <RestAreaCard key={area.name} {...area} />
          ))}
        </div>
      </div>
    </div>
  );
}
