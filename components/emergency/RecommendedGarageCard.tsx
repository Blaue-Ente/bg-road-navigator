interface RecommendedGarageCardProps {
  name: string;
  address: string;
  phone: string;
  mapsLink: string;
  speaksBulgarian: boolean;
}

export function RecommendedGarageCard({ name, address, phone, mapsLink, speaksBulgarian }: RecommendedGarageCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-gray-400">{address}</p>
        </div>
        {speaksBulgarian && (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
            Говорят български
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="flex-1 py-2 px-3 bg-blue-600/20 text-blue-400 rounded text-center hover:bg-blue-600/30 transition"
        >
          📞 Обади се
        </a>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-3 bg-gray-700 text-white rounded text-center hover:bg-gray-600 transition"
        >
          🗺️ Карта
        </a>
      </div>
    </div>
  );
}