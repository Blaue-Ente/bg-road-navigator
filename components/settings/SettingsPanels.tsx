"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { LocationSettings } from "@/components/location/LocationSettings";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WazeCard } from "@/components/ui/WazeCard";
import { signOut } from "@/lib/auth/sign-out";
import { existingSubscription } from "@/lib/push/client";
import { LOCAL_DATA_KEYS, useSettingsStore } from "@/lib/stores/settings.store";
import { useThemeStore } from "@/lib/stores/theme.store";
import { useUserStore } from "@/lib/stores/user.store";

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-[var(--waze-text)]">{children}</h2>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-sm leading-relaxed text-[var(--waze-text-secondary)]">{children}</p>
  );
}

function Toggle(props: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="mt-3 flex items-start gap-3 text-sm text-[var(--waze-text)]">
      <input
        type="checkbox"
        className="mt-0.5 h-5 w-5 accent-[var(--waze-accent)]"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      <span>
        {props.label}
        {props.hint && (
          <span className="mt-0.5 block text-xs text-[var(--waze-text-muted)]">{props.hint}</span>
        )}
      </span>
    </label>
  );
}

const buttonClass =
  "inline-flex min-h-11 items-center rounded-xl border border-[var(--waze-border)] px-4 text-sm font-medium text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)] disabled:opacity-50";

export function AppearanceCard() {
  const m = useMessages();
  const scheme = useThemeStore((state) => state.scheme);
  return (
    <WazeCard>
      <Heading>{m.settings.appearance}</Heading>
      <Hint>{m.settings.appearanceHint}</Hint>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="w-48 rounded-2xl border border-[var(--waze-border)]">
          <ThemeToggle />
        </div>
        <span className="text-sm text-[var(--waze-text-secondary)]">
          {scheme === "dark" ? m.settings.themeDark : m.settings.themeLight}
        </span>
        <LocaleSwitcher />
      </div>
    </WazeCard>
  );
}

/** Compares typed text with the confirm word, ignoring case and accents. */
function sameWord(typed: string, word: string): boolean {
  const fold = (value: string) =>
    value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\u0131/g, "i");
  return fold(typed) === fold(word);
}

function subscribeNone() {
  return () => undefined;
}

export function NotificationsCard() {
  const m = useMessages();
  const supported = useSyncExternalStore(
    subscribeNone,
    () => typeof Notification !== "undefined" && "serviceWorker" in navigator,
    () => true
  );
  const [state, setState] = useState<"idle" | "busy" | "off" | "none" | "failed">("idle");

  const turnOff = async () => {
    setState("busy");
    try {
      const sub = await existingSubscription();
      if (!sub) {
        setState("none");
        return;
      }
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => undefined);
      setState("off");
    } catch {
      setState("failed");
    }
  };

  return (
    <WazeCard>
      <Heading>{m.settings.notifications}</Heading>
      <Hint>{m.settings.notificationsHint}</Hint>
      {supported ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className={buttonClass} disabled={state === "busy"} onClick={() => void turnOff()}>
            {m.settings.pushOff}
          </button>
          {state === "off" && <span className="text-sm text-[var(--waze-text-secondary)]">{m.settings.pushIsOff}</span>}
          {state === "none" && <span className="text-sm text-[var(--waze-text-secondary)]">{m.settings.pushNone}</span>}
          {state === "failed" && <span className="text-sm text-[var(--waze-danger)]">{m.settings.pushFailed}</span>}
        </div>
      ) : (
        <Hint>{m.settings.pushUnsupported}</Hint>
      )}
    </WazeCard>
  );
}

export function PrivacyCard() {
  const m = useMessages();
  const historyRecording = useSettingsStore((state) => state.historyRecording);
  const setHistoryRecording = useSettingsStore((state) => state.setHistoryRecording);
  const borderWatch = useSettingsStore((state) => state.borderWatch);
  const setBorderWatch = useSettingsStore((state) => state.setBorderWatch);
  const signedIn = useUserStore((state) => Boolean(state.session?.user));
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const clearHistory = async () => {
    if (!window.confirm(m.settings.clearHistoryConfirm)) return;
    try {
      const response = await fetch("/api/history", { method: "DELETE" });
      if (response.ok) await queryClient.invalidateQueries({ queryKey: ["route-history"] });
      setMessage(response.ok ? m.settings.historyCleared : m.settings.actionFailed);
    } catch {
      setMessage(m.settings.actionFailed);
    }
  };

  const clearDevice = () => {
    if (!window.confirm(m.settings.clearDeviceConfirm)) return;
    try {
      for (const key of LOCAL_DATA_KEYS) localStorage.removeItem(key);
      sessionStorage.clear();
    } catch {
      /* storage may be blocked */
    }
    window.location.replace(window.location.origin);
  };

  return (
    <WazeCard>
      <Heading>{m.settings.privacy}</Heading>
      <Hint>{m.settings.noTrail}</Hint>
      <Toggle
        checked={historyRecording}
        onChange={setHistoryRecording}
        label={m.settings.historyRecording}
        hint={m.settings.historyRecordingHint}
      />
      <Toggle
        checked={borderWatch}
        onChange={setBorderWatch}
        label={m.settings.borderWatch}
        hint={m.settings.borderWatchHint}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        {signedIn && (
          <button type="button" className={buttonClass} onClick={() => void clearHistory()}>
            {m.settings.clearHistory}
          </button>
        )}
        <button type="button" className={buttonClass} onClick={clearDevice}>
          {m.settings.clearDevice}
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">{message}</p>}
    </WazeCard>
  );
}

export function RetentionCard() {
  const m = useMessages();
  const rows = [
    [m.settings.keepProfile, m.settings.keepProfileHow],
    [m.settings.keepHistory, m.settings.keepHistoryHow],
    [m.settings.keepSignals, m.settings.keepSignalsHow],
    [m.settings.keepBorder, m.settings.keepBorderHow],
    [m.settings.keepPush, m.settings.keepPushHow],
    [m.settings.keepLocation, m.settings.keepLocationHow],
  ] as const;
  return (
    <WazeCard>
      <Heading>{m.settings.retention}</Heading>
      <dl className="mt-3 space-y-3 text-sm">
        {rows.map(([what, how]) => (
          <div key={what}>
            <dt className="font-medium text-[var(--waze-text)]">{what}</dt>
            <dd className="text-[var(--waze-text-secondary)]">{how}</dd>
          </div>
        ))}
      </dl>
    </WazeCard>
  );
}

export function AccountCard() {
  const m = useMessages();
  const router = useRouter();
  const session = useUserStore((state) => state.session);
  const [deletePosts, setDeletePosts] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!session?.user) {
    return (
      <WazeCard>
        <Heading>{m.settings.account}</Heading>
        <Hint>{m.settings.signedOutHint}</Hint>
        <Link href="/profile" className="mt-3 inline-flex text-sm font-medium text-[var(--waze-accent-text)] hover:underline">
          {m.settings.signIn}
        </Link>
      </WazeCard>
    );
  }

  const remove = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, delete_posts: deletePosts }),
      });
      if (!response.ok) throw new Error("failed");
      await signOut();
      router.replace("/");
    } catch {
      setMessage(m.settings.actionFailed);
      setBusy(false);
    }
  };

  return (
    <WazeCard>
      <Heading>{m.settings.account}</Heading>
      <Hint>{m.settings.exportHint}</Hint>
      <a href="/api/account" download className={`${buttonClass} mt-3`}>
        {m.settings.exportData}
      </a>
      <hr className="my-4 border-[var(--waze-border)]" />
      <h3 className="text-sm font-semibold text-[var(--waze-danger)]">{m.settings.deleteTitle}</h3>
      <Hint>{m.settings.deleteHint}</Hint>
      <Toggle checked={deletePosts} onChange={setDeletePosts} label={m.settings.deletePosts} hint={m.settings.deletePostsHint} />
      <label className="mt-3 block text-sm text-[var(--waze-text)]">
        {m.settings.deleteType}
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          className="mt-1 block w-48 rounded-lg border border-[var(--waze-border)] bg-transparent px-2 py-2"
          autoComplete="off"
        />
      </label>
      <button
        type="button"
        disabled={busy || !sameWord(typed, m.settings.deleteWord)}
        onClick={() => void remove()}
        className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[var(--waze-danger)] px-4 text-sm font-semibold text-white disabled:opacity-40"
      >
        {m.settings.deleteButton}
      </button>
      {message && <p className="mt-2 text-sm text-[var(--waze-danger)]">{message}</p>}
    </WazeCard>
  );
}

export function LocationCard() {
  return <LocationSettings />;
}
