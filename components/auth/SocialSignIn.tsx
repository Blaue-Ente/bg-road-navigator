"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { SocialProviderId } from "@/lib/auth/config";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.37 12.72c.03 2.52 2.21 3.36 2.24 3.37-.02.06-.35 1.2-1.15 2.37-.69 1.01-1.41 2.02-2.54 2.04-1.11.02-1.47-.66-2.74-.66s-1.67.64-2.72.68c-1.09.04-1.92-1.09-2.62-2.1-1.43-2.06-2.52-5.82-1.05-8.36.73-1.26 2.03-2.06 3.44-2.08 1.07-.02 2.09.72 2.74.72.65 0 1.86-.89 3.14-.76.53.02 2.03.22 2.99 1.63-.08.05-1.79 1.04-1.77 3.15zM14.7 6.3c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.53.62-1 1.61-.87 2.56.93.07 1.87-.47 2.45-1.16z" />
    </svg>
  );
}

const LABELS: Record<SocialProviderId, string> = {
  google: "Продължи с Google",
  apple: "Продължи с Apple",
};

export function SocialSignIn({
  providers,
}: {
  providers: SocialProviderId[];
}) {
  const [pending, setPending] = useState<SocialProviderId | null>(null);
  const [error, setError] = useState("");

  if (providers.length === 0) return null;

  const start = async (provider: SocialProviderId) => {
    setPending(provider);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
      if (result.error) {
        setError("Входът с този акаунт не успя. Опитайте отново.");
        setPending(null);
      }
    } catch {
      setError("Входът с този акаунт не успя. Опитайте отново.");
      setPending(null);
    }
  };

  return (
    <div className="mb-5 space-y-3">
      {providers.map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={pending !== null}
          onClick={() => void start(provider)}
          className={
            provider === "google"
              ? "signin-google flex min-h-11 w-full items-center justify-center gap-3 rounded-md px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
              : "signin-apple flex min-h-11 w-full items-center justify-center gap-3 rounded-md px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          }
        >
          {provider === "google" ? <GoogleMark /> : <AppleMark />}
          {pending === provider ? "Пренасочване..." : LABELS[provider]}
        </button>
      ))}
      {error && <p className="text-sm text-[var(--waze-danger)]">{error}</p>}
      <div className="flex items-center gap-3 pt-1 text-xs text-[var(--waze-text-muted)]">
        <span className="h-px flex-1 bg-[var(--waze-border)]" />
        или с имейл
        <span className="h-px flex-1 bg-[var(--waze-border)]" />
      </div>
    </div>
  );
}
