import type { EmergencyData } from "@/lib/constants/emergency-numbers";

interface CountryEmergencyCardProps {
  country: EmergencyData;
}

export function CountryEmergencyCard({ country }: CountryEmergencyCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{country.flag}</span>
        <h3 className="font-semibold text-lg">{country.country_bg}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-800 p-2 rounded">
          <span className="text-gray-400 block">Полиция</span>
          <span className="font-medium">{country.police || "112"}</span>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <span className="text-gray-400 block">Скора помощ</span>
          <span className="font-medium">{country.ambulance || "112"}</span>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <span className="text-gray-400 block">Пожар</span>
          <span className="font-medium">{country.fire || "112"}</span>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <span className="text-gray-400 block">Пътна помощ</span>
          <span className="font-medium">{country.roadside_assistance || "112"}</span>
        </div>
      </div>

      {country.notes_bg && (
        <div className="mt-3 text-xs text-gray-400 p-2 bg-gray-800 rounded">
          {country.notes_bg}
        </div>
      )}
    </div>
  );
}