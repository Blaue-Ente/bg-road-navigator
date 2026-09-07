"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bgnav-operator";

function readOperatorFlag(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_OPERATOR_MODE === "true") return true;

  const params = new URLSearchParams(window.location.search);
  if (params.get("operator") === "1") {
    window.localStorage.setItem(STORAGE_KEY, "1");
  }
  if (params.get("operator") === "0") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

/** Operator/dev mode for the keys checklist. Regular users never see it. */
export function useOperatorMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readOperatorFlag());
  }, []);

  const enable = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setEnabled(true);
  }, []);

  return { enabled, enable };
}
