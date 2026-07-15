interface RestAreaCardProps {
  name: string;
  location: string;
  facilities: string[];
  distanceKm: number;
  coords: { lng: number; lat: number };
}

export function RestAreaCard({
  name,
  location,
  facilities,
  distanceKm,
  coords,
}: RestAreaCardProps) {
  const facilityIcons: Record<string, string> = {
    toilet: "🚻",
    shower: "🚿",
    restaurant: "🍽️",
    fuel: "⛽",
    parking: "🅿️",
    wifi: "📶",
    ev_charging: "🔌",
  };

  return (
    <div className="waze-panel p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--waze-text)]">{name}</h3>
          <p className="text-sm text-[var(--waze-text-secondary)]">{location}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--waze-accent-muted)] px-2.5 py-1 text-xs font-medium text-[var(--waze-accent)]">
          {distanceKm > 0 ? `${distanceKm.toFixed(1)} км` : "по маршрута"}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {facilities.map((facility) => (
          <span
            key={facility}
            className="rounded-full bg-[var(--waze-surface-elevated)] px-2 py-0.5 text-xs text-[var(--waze-text-secondary)]"
          >
            {facilityIcons[facility] || "•"} {facility}
          </span>
        ))}
      </div>

      <a
        href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="waze-btn-secondary block w-full py-2.5 text-center text-sm"
      >
        Отвори в Maps
      </a>
    </div>
  );
}
