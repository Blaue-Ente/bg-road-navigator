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
      return "bg-emerald-500/15 text-[var(--waze-ok)] ring-[var(--waze-ok)]/30";
    if (wait < 60)
      return "bg-yellow-500/15 text-[var(--waze-warning)] ring-[var(--waze-warning)]/30";
    if (wait < 120)
      return "bg-orange-500/15 text-[var(--waze-warning)] ring-[var(--waze-warning)]/30";
    return "bg-red-500/15 text-[var(--waze-danger)] ring-[var(--waze-danger)]/30";
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
