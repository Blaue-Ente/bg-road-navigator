interface RestAreaCardProps {
  name: string;
  location: string;
  facilities: string[]; // toilet, shower, restaurant, fuel, parking
  distanceKm: number;
  coords: { lng: number; lat: number };
}

export function RestAreaCard({ name, location, facilities, distanceKm, coords }: RestAreaCardProps) {
  const facilityIcons: Record<string, string> = {
    toilet: "🚻",
    shower: "🚿",
    restaurant: "🍽️",
    fuel: "⛽",
    parking: "🅿️",
    wifi: "📶",
    ev_charging: "🔌"
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-gray-400">{location}</p>
        </div>
        <span className="text-sm text-blue-400 bg-blue-600/20 px-2 py-1 rounded">
          {distanceKm.toFixed(1)} км
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mb-3">
        {facilities.map((facility) => (
          <span key={facility} className="flex items-center gap-1 text-sm text-gray-300">
            {facilityIcons[facility] || "•"} {facility}
          </span>
        ))}
      </div>

      <a
        href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2 px-3 bg-gray-700 text-white rounded text-center hover:bg-gray-600 transition block"
      >
        Отвори в Google Maps
      </a>
    </div>
  );
}