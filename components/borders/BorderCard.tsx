import type { BorderStatus } from "@/types/border.types";

interface BorderCardProps {
  border: BorderStatus;
  onComment?: () => void;
}

export function BorderCard({ border, onComment }: BorderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "green": return "bg-green-500/20 border-green-500";
      case "yellow": return "bg-yellow-500/20 border-yellow-500";
      case "orange": return "bg-orange-500/20 border-orange-500";
      case "red": return "bg-red-500/20 border-red-500";
      default: return "bg-gray-500/20 border-gray-500";
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor(border.status)}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg">{border.name_bg}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          border.status === "green" ? "text-green-400" :
          border.status === "yellow" ? "text-yellow-400" :
          border.status === "orange" ? "text-orange-400" : "text-red-400"
        }`}>
          {border.status === "green" ? "< 30 мин" :
           border.status === "yellow" ? "30-60 мин" :
           border.status === "orange" ? "60-120 мин" : "> 120 мин"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-xl font-bold">{border.wait_time_cars}</div>
          <div className="text-xs text-gray-400">Машини</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{border.wait_time_trucks}</div>
          <div className="text-xs text-gray-400">Камиони</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{border.wait_time_buses}</div>
          <div className="text-xs text-gray-400">Автобуси</div>
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-3">
        Работи: {border.working_hours}
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onComment}
          className="flex-1 py-1.5 px-3 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30 transition"
        >
          Добави коментар
        </button>
      </div>
    </div>
  );
}