interface EVChargerCardProps {
  station: EVStation;
  onSelect?: (station: EVStation) => void;
}

export function EVChargerCard({ station, onSelect }: EVChargerCardProps) {
  return (
    <div 
      className="bg-gray-900 rounded-lg p-4 border border-gray-800 cursor-pointer hover:border-blue-500 transition"
      onClick={() => onSelect?.(station)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{station.name}</h3>
          <p className="text-sm text-gray-400">{station.operator}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${station.available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {station.available ? "Свободен" : "Зает"}
        </span>
      </div>

      <div className="text-sm text-gray-300 mb-2">{station.address}</div>

      <div className="flex flex-wrap gap-2 mb-2">
        {station.connector_types.map((type) => (
          <span key={type} className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
            {type}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-gray-800 rounded p-2">
          <span className="text-gray-400">Мощност</span>
          <div className="font-medium">{station.power_kw} kW</div>
        </div>
        {station.price_kwh && (
          <div className="bg-gray-800 rounded p-2">
            <span className="text-gray-400">Цена</span>
            <div className="font-medium">{station.price_kwh.toFixed(2)} лв/kWh</div>
          </div>
        )}
        <div className="bg-gray-800 rounded p-2">
          <span className="text-gray-400">Разстояние</span>
          <div className="font-medium">{station.distance_km.toFixed(1)} км</div>
        </div>
      </div>
    </div>
  );
}