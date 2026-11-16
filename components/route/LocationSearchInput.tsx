"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoutePoint } from "@/types/route.types";
import { searchCuratedCities } from "@/lib/constants/european-cities";
import { useMapStore } from "@/lib/stores/map.store";
import { CountryFlag } from "@/components/ui/CountryFlag";

interface LocationSearchInputProps {
  id: string;
  label: string;
  value: RoutePoint | null;
  onSelect: (place: RoutePoint) => void;
  onQueryChange: (query: string) => void;
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
  const seenCoord = new Set<string>();
  const seenLabel = new Set<string>();
  const merged: RoutePoint[] = [];
  for (const place of [...curated, ...remote]) {
    const coordKey = `${place.coords.lat.toFixed(3)},${place.coords.lng.toFixed(3)}`;
    const labelKey = `${place.label.toLocaleLowerCase("bg")}|${place.countryCode ?? ""}`;
    if (seenCoord.has(coordKey) || seenLabel.has(labelKey)) continue;
    seenCoord.add(coordKey);
    seenLabel.add(labelKey);
    merged.push(place);
  }
  return merged.slice(0, 8);
}

export function LocationSearchInput({
  id,
  label,
  value,
  onSelect,
  onQueryChange,
  placeholder,
}: LocationSearchInputProps) {
  const m = useMessages();
  const [query, setQuery] = useState(value?.label ?? "");
  const listId = `${id}-suggestions`;

  useEffect(() => {
    const next = value?.label ?? "";
    // Sync corridor/replan picks into the field without remounting the input.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external value drives the label
    setQuery(next);
    onQueryChange(next);
  }, [value?.id, value?.label, onQueryChange]);
  const [remoteResults, setRemoteResults] = useState<RoutePoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const requestVersion = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const blurCloseTimer = useRef<number | null>(null);

  const trimmedQuery = query.trim();
  const mapView = useMapStore((state) => state.view);
  const biasLat = mapView.center[1];
  const biasLon = mapView.center[0];
  const biasZoom = mapView.zoom;
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
        const lang = document.documentElement.lang || "bg";
        const params = new URLSearchParams({
          q: trimmedQuery,
          lat: biasLat.toFixed(5),
          lon: biasLon.toFixed(5),
          zoom: String(Math.round(biasZoom)),
          lang,
        });
        const response = await fetch(`/api/places/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Place search failed");

        const data = (await response.json()) as PlacesResponse;
        if (version !== requestVersion.current) return;

        setRemoteResults(data.places);
        setOpen(true);
        if (data.places.length === 0 && curated.length === 0) {
          setMessage(m.route.msg01e74cd654);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        if (version === requestVersion.current && curated.length === 0) {
          setRemoteResults([]);
          setMessage(m.route.msg32a9fa2a05);
        }
      } finally {
        if (version === requestVersion.current) setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    showSuggestions,
    trimmedQuery,
    curated.length,
    biasLat,
    biasLon,
    biasZoom,
  ]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const rect = listRef.current.getBoundingClientRect();
    setOpenUpward(rect.bottom > window.innerHeight - 8);
  }, [open, results.length, message]);

  const choosePlace = (place: RoutePoint) => {
    onSelect(place);
    setQuery(place.label);
    onQueryChange(place.label);
    setRemoteResults([]);
    setMessage(null);
    setOpen(false);
  };

  const scheduleClose = () => {
    if (blurCloseTimer.current) window.clearTimeout(blurCloseTimer.current);
    blurCloseTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  const cancelClose = () => {
    if (blurCloseTimer.current) window.clearTimeout(blurCloseTimer.current);
  };

  return (
    <div className="relative" ref={rootRef}>
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
            onQueryChange(next);
            setRemoteResults([]);
            setMessage(null);
            setOpen(next.trim().length >= 1);
          }}
          onFocus={() => {
            cancelClose();
            if (results.length > 0 || message) setOpen(true);
          }}
          onBlur={() => scheduleClose()}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && showSuggestions}
          aria-controls={listId}
          aria-autocomplete="list"
          className={`focus-ring min-h-11 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] py-3 pr-10 text-sm text-[var(--waze-text)] placeholder:text-[var(--waze-text-muted)] focus:border-[var(--waze-accent)] ${
            value?.countryCode && query === value.label ? "pl-10" : "px-3"
          }`}
        />
      </div>
      {isSearching && (
        <span className="absolute right-3 top-9 text-xs text-[var(--waze-accent-text)]">{m.emergencyPage.msg463a0f99c5}</span>
      )}

      {open && showSuggestions && (results.length > 0 || message) && (
        <div
          id={listId}
          ref={listRef}
          role="listbox"
          className={`absolute inset-x-0 z-30 overflow-hidden rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] shadow-2xl ${
            openUpward ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choosePlace(place)}
              className="flex min-h-11 w-full items-start gap-3 border-b border-[var(--waze-border)] px-3 py-3 text-left text-sm last:border-b-0 hover:bg-[var(--waze-surface-elevated)]"
            >
              <CountryFlag
                code={place.countryCode}
                className="mt-0.5 h-4 w-[1.35rem]"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-[var(--waze-text)]">
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