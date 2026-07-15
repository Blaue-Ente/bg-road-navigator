interface RecommendedGarageCardProps {
  name: string;
  address: string;
  phone: string;
  mapsLink: string;
  speaksBulgarian: boolean;
}

export function RecommendedGarageCard({
  name,
  address,
  phone,
  mapsLink,
  speaksBulgarian,
}: RecommendedGarageCardProps) {
  return (
    <div className="waze-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[var(--waze-text)]">{name}</h3>
          <p className="text-sm text-[var(--waze-text-secondary)]">{address}</p>
        </div>
        {speaksBulgarian && (
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
            BG
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="waze-btn-primary flex-1 py-2.5 text-center text-sm"
        >
          Обади се
        </a>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-secondary flex-1 py-2.5 text-center text-sm"
        >
          Карта
        </a>
      </div>
    </div>
  );
}
