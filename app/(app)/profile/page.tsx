"use client";

import { useUserStore } from "@/lib/stores/user.store";

export default function ProfilePage() {
  const userStore = useUserStore();
  const userSession = userStore.session;
  const profile = userStore.profile;
  const authenticated = userSession !== null;

  if (!authenticated) {
    return (
      <div className="text-center p-8">
        <p>Моля влезте за да видите профил.</p>
        <a href="/login" className="mt-4 inline-block text-blue-400">
          Влез
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-400">Профил</h1>
          <button
            onClick={() => {
              // Logout logic
              userStore.clearUser();
              window.location.href = "/";
            }}
            className="text-sm text-gray-400 hover:text-red-400"
          >
            Изход
          </button>
        </div>

        {/* Profile info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <p className="text-lg mb-2">
            Потребител: <span className="text-blue-400 font-medium">{profile?.username || userSession?.user.email}</span>
          </p>
          
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <span className="text-gray-400">Транспорт:</span>
              <span className="ml-2">{profile?.vehicle_type === "car" ? "Автомобил" : 
                profile?.vehicle_type === "ev" ? "Електромобили" : 
                profile?.vehicle_type === "truck" ? "Камион" : "Мотоциклет"}</span>
            </div>
            <div>
              <span className="text-gray-400">Гориво:</span>
              <span className="ml-2">{profile?.fuel_type === "diesel" ? "Дизел" :
                profile?.fuel_type === "petrol" ? "Бензин" :
                profile?.fuel_type === "lpg" ? "Газ" : "Електрическо"}</span>
            </div>
          </div>
          
          {profile?.tank_capacity_liters && (
            <div className="mt-3 text-sm">
              <span className="text-gray-400">Резервоар:</span>
              <span className="ml-2">{profile.tank_capacity_liters} л</span>
            </div>
          )}
          
          {profile?.ev_range_km && (
            <div className="mt-3 text-sm">
              <span className="text-gray-400">Обхват:</span>
              <span className="ml-2">{profile.ev_range_km} км</span>
            </div>
          )}
        </div>

        {/* Saved Routes Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-400">Запазени маршрути</h2>
          <div className="space-y-3">
            {/* Placeholder - actual saved routes from Supabase */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400">Няма запазени маршрути</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}