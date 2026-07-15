"use client";

import { useEffect, useRef, useState } from "react";
import type { RoutePoint } from "@/types/route.types";

interface LocationSearchInputProps {
  id: string;
  label: string;
  value: RoutePoint | null;
  onSelect: (place: RoutePoint) => void;
  placeholder: string;
}

interface PlacesResponse {
  places: RoutePoint[];
}

export function LocationSearchInput({
  id,
  label,
  value,
  onSelect,
  placeholder,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<RoutePoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value?.id, value?.label]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3 || trimmedQuery === value?.label) {
      setResults([]);
      setMessage(null);
      return;
    }

    const version = ++requestVersion.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setMessage(null);

      try {
        const response = await fetch(
          `/api/places/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Place search failed");

        const data = (await response.json()) as PlacesResponse;
        if (version !== requestVersion.current) return;

        setResults(data.places);
        setOpen(true);
        if (data.places.length === 0) {
          setMessage("Не е намерено място в Европа. Опитайте адрес или град.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (version === requestVersion.current) {
          setResults([]);
          setMessage("Търсенето не е достъпно в момента.");
        }
      } finally {
        if (version === requestVersion.current) setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, value?.label]);

  const choosePlace = (place: RoutePoint) => {
    onSelect(place);
    setQuery(place.label);
    setResults([]);
    setMessage(null);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-[var(--waze-text-secondary)]"
      >
        {label}
      </label>
      <input
        id={id}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (results.length > 0 || message) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 pr-10 text-[var(--waze-text)] outline-none placeholder:text-[var(--waze-text-muted)] focus:border-[var(--waze-accent)]"
      />
      {isSearching && (
        <span className="absolute right-3 top-9 text-xs text-[var(--waze-accent)]">
          Търсене…
        </span>
      )}

      {open && (results.length > 0 || message) && (
        <div className="absolute inset-x-0 z-30 mt-2 overflow-hidden rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] shadow-2xl">
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => choosePlace(place)}
              className="block w-full border-b border-[var(--waze-border)] px-3 py-3 text-left last:border-b-0 hover:bg-[var(--waze-surface-elevated)]"
            >
              <span className="block text-sm font-medium text-[var(--waze-text)]">
                {place.label}
              </span>
              {place.subtitle && (
                <span className="mt-0.5 block truncate text-xs text-[var(--waze-text-secondary)]">
                  {place.subtitle}
                </span>
              )}
            </button>
          ))}
          {message && (
            <p className="px-3 py-3 text-sm text-[var(--waze-text-secondary)]">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
