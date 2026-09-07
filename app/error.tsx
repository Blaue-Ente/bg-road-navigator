"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--waze-bg)] p-6 text-center text-[var(--waze-text)]">
      <h1 className="text-xl font-semibold">Нещо се обърка</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--waze-text-secondary)]">
        Опитайте да презаредите страницата. Картата и спешните номера остават
        достъпни.
      </p>
      <button
        type="button"
        onClick={reset}
        className="waze-btn-primary mt-4 px-5 py-2.5 text-sm"
      >
        Опитай пак
      </button>
    </div>
  );
}
