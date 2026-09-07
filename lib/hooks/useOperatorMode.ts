"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "bgnav-operator";
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function applyUrlOverride() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("operator") === "1") {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } else if (params.get("operator") === "0") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  applyUrlOverride();
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot() {
  if (process.env.NEXT_PUBLIC_OPERATOR_MODE === "true") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return process.env.NEXT_PUBLIC_OPERATOR_MODE === "true";
}

/** Operator/dev mode for the keys checklist. Regular users never see it. */
export function useOperatorMode() {
  const enabled = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const enable = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    notify();
  }, []);

  return { enabled, enable };
}
