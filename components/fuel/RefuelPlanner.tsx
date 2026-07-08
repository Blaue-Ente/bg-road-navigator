interface RefuelPlannerProps {
  vehicleType: "car" | "ev" | "truck" | "motorcycle";
  fuelType: "diesel" | "petrol95" | "petrol98" | "lpg" | "electric";
  currentLevel: number; // 0-100
  tankCapacity: number; // liters for fuel, kWh for EV
  vehicleRange: number; // km
  stations: FuelStation[]; // from useFuelStations
  evStations: EVStation[]; // from useEVStations
}

export function RefuelPlanner({ vehicleType, fuelType, currentLevel, tankCapacity, vehicleRange, stations, evStations }: RefuelPlannerProps) {
  const rangeRemaining = vehicleRange * (currentLevel / 100);
  const distanceToEmpty = Math.max(0, rangeRemaining);

  // Simple logic: suggest refuel when below 20%
  const needsRefuel = currentLevel <= 20;

  if (!needsRefuel) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-green-400">Достатъчно гориво за още {distanceToEmpty.toFixed(0)} км</p>
      </div>
    );
  }

  // Find closest station that sells needed fuel type
  let bestStation = null;
  let minDistance = Infinity;

  if (vehicleType === "ev") {
    bestStation = evStations.reduce((closest, station) => {
      const d = Math.hypot(station.coords.lng, station.coords.lat); // Simplified
      return d < closest.distance ? { station, distance: d } : closest;
    }, { station: null, distance: Infinity }).station;
  } else {
    const fuelPriceKey = {
      diesel: "diesel",
      petrol95: "petrol95",
      petrol98: "petrol98",
      lpg: "lpg"
    }[fuelType] as keyof typeof FuelStation["prices"];

    bestStation = stations.reduce((closest, station) => {
      const price = station.prices[fuelPriceKey];
      if (price !== null && station.distance_km < closest.distance) {
        return { station, distance: station.distance_km };
      }
      return closest;
    }, { station: null, distance: Infinity }).station;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="font-semibold mb-2 text-red-400">Препоръка за зареждане/пълнене</h3>
      <p className="mb-2">Текущо ниво: {currentLevel}%</p>
      <p className="mb-2">Оставащо разстояние: {distanceToEmpty.toFixed(0)} км</p>
      {bestStation ? (
        <>
          <p className="mb-2">Най-близо/{fuelType === "electric" ? "зарядка" : "заправка"}: {bestStation.name}</p>
          <p className="mb-2">Разстояние: {bestStation.distance_km.toFixed(1)} км</p>
          {fuelType !== "electric" && (
            <p className="mb-2">Цена: {bestStation.prices[fuelPriceKey as keyof typeof bestStation.prices]?.toFixed(2)} лв/л</p>
          )}
          {fuelType === "electric" && (
            <p className="mb-2">Цена: {bestStation.price_kwh?.toFixed(2)} лв/kWh</p>
          )}
          <button className="w-full bg-blue-600/20 text-blue-400 rounded py-2 hover:bg-blue-600/30 transition">
            Навигирай до станция
          </button>
        </>
      ) : (
        <p className="text-red-400">Не са намерени станции с подходящо гориво в близост.</p>
      )}
    </div>
  );
}