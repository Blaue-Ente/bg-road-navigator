interface BorderWaitBadgeProps {
  waitMinutes: number;
  label: string;
}

export function BorderWaitBadge({ waitMinutes, label }: BorderWaitBadgeProps) {
  const getColor = (wait: number) => {
    if (wait < 30) return "bg-green-500 text-white";
    if (wait < 60) return "bg-yellow-500 text-black";
    if (wait < 120) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${getColor(waitMinutes)}`}>
      <span className="text-sm font-medium">{label}:</span>
      <span className="font-bold">{waitMinutes} мин</span>
    </div>
  );
}