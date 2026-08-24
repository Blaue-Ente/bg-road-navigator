"use client";

import { useEffect, useRef, useState } from "react";
import type { RoutePoint } from "@/types/route.types";
import { formatPlaceInputValue } from "@/lib/utils/place-label";

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
  const [query, setQuery] = useState(() => formatPlaceInputValue(value));
  const [results, setResults] = useState<RoutePoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [boundPlaceId, setBoundPlaceId] = useState(value?.id ?? null);
  const requestVersion = useRef(0);
  const selectFirstWhenReady = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  if (value?.id !== boundPlaceId) {
    setBoundPlaceId(value?.id ?? null);
    setQuery(formatPlaceInputValue(value));
    setResults([]);
    setMessage(null);
    setOpen(false);
  }

  const selectedText = formatPlaceInputValue(value);
  const trimmedQuery = query.trim();
  const queryMatchesSelection =
    trimmedQuery.length < 3 ||
    trimmedQuery === selectedText ||
    trimmedQuery === value?.label;

  useEffect(() => {
    if (queryMatchesSelection) {
      selectFirstWhenReady.current = false;
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
          setMessage(
            "Няма такъв адрес в Европа. Опитайте улица, номер и град."
          );
          selectFirstWhenReady.current = false;
          return;
        }
        if (selectFirstWhenReady.current && data.places[0]) {
          selectFirstWhenReady.current = false;
          onSelectRef.current(data.places[0]);
          setQuery(formatPlaceInputValue(data.places[0]));
          setResults([]);
          setMessage(null);
          setOpen(false);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (version === requestVersion.current) {
          setResults([]);
          setMessage("Търсенето не е достъпно в момента.");
          selectFirstWhenReady.current = false;
        }
      } finally {
        if (version === requestVersion.current) setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [queryMatchesSelection, trimmedQuery]);

  const choosePlace = (place: RoutePoint) => {
    onSelectRef.current(place);
    setQuery(formatPlaceInputValue(place));
    setResults([]);
    setMessage(null);
    setOpen(false);
    selectFirstWhenReady.current = false;
  };

  const pickFirstResult = () => {
    if (results[0]) {
      choosePlace(results[0]);
      return;
    }
    if (trimmedQuery.length >= 3) {
      selectFirstWhenReady.current = true;
      setOpen(true);
    }
  };

  const visibleResults = queryMatchesSelection ? [] : results;
  const visibleMessage = queryMatchesSelection ? null : message;

  return (
    <div className="relative" ref={rootRef}>
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
          if (visibleResults.length > 0 || visibleMessage) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            pickFirstResult();
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (next instanceof Node && rootRef.current?.contains(next)) return;
          if (visibleResults.length === 1) {
            choosePlace(visibleResults[0]!);
            return;
          }
          window.setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        autoComplete="off"
        inputMode="search"
        className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 pr-10 text-[var(--waze-text)] outline-none placeholder:text-[var(--waze-text-muted)] focus:border-[var(--waze-accent)]"
      />
      {isSearching && (
        <span className="absolute right-3 top-9 text-xs text-[var(--waze-accent)]">
          Търсене…
        </span>
      )}

      {open && (visibleResults.length > 0 || visibleMessage) && (
        <div className="absolute inset-x-0 z-30 mt-2 overflow-hidden rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] shadow-2xl">
          {visibleResults.map((place) => (
            <button
              key={place.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
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
          {visibleMessage && (
            <p className="px-3 py-3 text-sm text-[var(--waze-text-secondary)]">
              {visibleMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
