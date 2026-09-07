"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoutePoint } from "@/types/route.types";
import { searchCuratedCities } from "@/lib/constants/european-cities";
import { CountryFlag } from "@/components/ui/CountryFlag";

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

function cityToPoint(
  city: ReturnType<typeof searchCuratedCities>[number]
): RoutePoint {
  return {
    id: city.id,
    label: city.label,
    subtitle: city.country,
    coords: city.coords,
    source: "curated",
    countryCode: city.countryCode,
  };
}

function mergePlaces(
  curated: RoutePoint[],
  remote: RoutePoint[]
): RoutePoint[] {
  const seen = new Set<string>();
  const merged: RoutePoint[] = [];
  for (const place of [...curated, ...remote]) {
    const key = `${place.coords.lat.toFixed(3)},${place.coords.lng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(place);
  }
  return merged.slice(0, 8);
}

export function LocationSearchInput({
  id,
  label,
  value,
  onSelect,
  placeholder,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [remoteResults, setRemoteResults] = useState<RoutePoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const requestVersion = useRef(0);

  const trimmedQuery = query.trim();
  const showSuggestions =
    trimmedQuery.length >= 1 && trimmedQuery !== value?.label;

  const curated = useMemo(
    () =>
      showSuggestions ? searchCuratedCities(trimmedQuery).map(cityToPoint) : [],
    [showSuggestions, trimmedQuery]
  );

  const results = useMemo(
    () => mergePlaces(curated, remoteResults),
    [curated, remoteResults]
  );

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    if (trimmedQuery.length < 3) {
      return;
    }

    const version = ++requestVersion.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/places/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Place search failed");

        const data = (await response.json()) as PlacesResponse;
        if (version !== requestVersion.current) return;

        setRemoteResults(data.places);
        setOpen(true);
        if (data.places.length === 0 && curated.length === 0) {
          setMessage("Не е намерено място в Европа. Опитайте адрес или град.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        if (version === requestVersion.current && curated.length === 0) {
          setRemoteResults([]);
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
  }, [showSuggestions, trimmedQuery, curated.length]);

  const choosePlace = (place: RoutePoint) => {
    onSelect(place);
    setQuery(place.label);
    setRemoteResults([]);
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
      <div className="relative">
        {value?.countryCode && query === value.label && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <CountryFlag code={value.countryCode} />
          </span>
        )}
        <input
          id={id}
          value={query}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setRemoteResults([]);
            setMessage(null);
            setOpen(next.trim().length >= 1);
          }}
          onFocus={() => {
            if (results.length > 0 || message) setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] py-3 pr-10 text-[var(--waze-text)] outline-none placeholder:text-[var(--waze-text-muted)] focus:border-[var(--waze-accent)] ${
            value?.countryCode && query === value.label ? "pl-10" : "px-3"
          }`}
        />
      </div>
      {isSearching && (
        <span className="absolute right-3 top-9 text-xs text-[var(--waze-accent)]">
          Търсене…
        </span>
      )}

      {open && showSuggestions && (results.length > 0 || message) && (
        <div className="absolute inset-x-0 z-30 mt-2 overflow-hidden rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] shadow-2xl">
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => choosePlace(place)}
              className="flex w-full items-start gap-3 border-b border-[var(--waze-border)] px-3 py-3 text-left last:border-b-0 hover:bg-[var(--waze-surface-elevated)]"
            >
              <CountryFlag
                code={place.countryCode}
                className="mt-0.5 h-4 w-[1.35rem]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[var(--waze-text)]">
                  {place.label}
                </span>
                {place.subtitle && (
                  <span className="mt-0.5 block truncate text-xs text-[var(--waze-text-secondary)]">
                    {place.subtitle}
                  </span>
                )}
              </span>
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
