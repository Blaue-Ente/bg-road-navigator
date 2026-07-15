interface BorderWaitBadgeProps {
  waitMinutes: number;
  label?: string;
  compact?: boolean;
}

export function BorderWaitBadge({
  waitMinutes,
  label,
  compact,
}: BorderWaitBadgeProps) {
  const getStyles = (wait: number) => {
    if (wait < 30)
      return "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30";
    if (wait < 60)
      return "bg-yellow-500/20 text-yellow-200 ring-yellow-500/30";
    if (wait < 120)
      return "bg-orange-500/20 text-orange-200 ring-orange-500/30";
    return "bg-red-500/20 text-red-300 ring-red-500/30";
  };

  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${getStyles(waitMinutes)}`}
      >
        {waitMinutes} мин
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${getStyles(waitMinutes)}`}
    >
      {label && <span className="font-medium opacity-80">{label}</span>}
      <span>{waitMinutes} мин</span>
    </div>
  );
}
