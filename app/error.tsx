"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const m = useMessages();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--waze-bg)] p-6 text-center text-[var(--waze-text)]">
      <h1 className="text-xl font-semibold">{m.misc.msg2e63176344}</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--waze-text-secondary)]">
        {m.misc.errorReloadHint}
      </p>
      <button
        type="button"
        onClick={reset}
        className="waze-btn-primary mt-4 px-5 py-2.5 text-sm"
      >
        {m.misc.retry}
      </button>
    </div>
  );
}
