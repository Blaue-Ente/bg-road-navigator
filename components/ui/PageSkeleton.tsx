export function PageSkeleton({ label = "Зареждане" }: { label?: string }) {
  return (
    <div
      className="waze-page"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded-xl bg-[var(--waze-surface-elevated)]" />
        <div className="h-4 w-1/2 animate-pulse rounded-xl bg-[var(--waze-surface)]" />
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--waze-surface)]" />
        <div className="h-32 animate-pulse rounded-2xl bg-[var(--waze-surface)]" />
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="waze-page text-center">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="waze-btn-secondary mt-3 px-4 py-2 text-sm"
        >
          Опитай пак
        </button>
      )}
    </div>
  );
}
