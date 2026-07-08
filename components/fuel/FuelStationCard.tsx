interface FuelStationCardProps {
  station: FuelStation;
  onSelect?: (station: FuelStation) => void;
}

export function FuelStationCard({ station, onSelect }: FuelStationCardProps) {
  return (
    <div 
      className="bg-gray-900 rounded-lg p-4 border border-gray-800 cursor-pointer hover:border-blue-500 transition"
      onClick={() => onSelect?.(station)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{station.brand}</h3>
          <p className="text-sm text-gray-400">{station.name}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${station.open ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {station.open ? "Отворен" : "Затворен"}
        </span>
      </div>

      <div className="text-sm text-gray-300 mb-2">{station.address}</div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        {station.prices.diesel && (
          <div className="bg-gray-800 rounded p-2">
            <span className="text-gray-400">Дизел</span>
            <div className="font-medium">{station.prices.diesel.toFixed(2)} лв/л</div>
          </div>
        )}
        {station.prices.petrol95 && (
          <div className="bg-gray-800 rounded p-2">
            <span className="text-gray-400">Бензин 95</span>
            <div className="font-medium">{station.prices.petrol95.toFixed(2)} лв/л</div>
          </div>
        )}
        {station.prices.lpg && (
          <div className="bg-gray-800 rounded p-2">
            <span className="text-gray-400">Газ</span>
            <div className="font-medium">{station.prices.lpg.toFixed(2)} лв/л</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>{station.distance_km.toFixed(1)} км от маршрута</span>
        <div className="flex gap-1">
          {station.payment_methods.map((method) => (
            <span key={method} className="px-1.5 py-0.5 bg-gray-800 rounded">
              {method}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
