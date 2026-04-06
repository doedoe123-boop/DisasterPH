"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Search } from "lucide-react";

export interface GeocodingResult {
  label: string;
  latitude: number;
  longitude: number;
}

interface LocationSearchProps {
  selected: GeocodingResult | null;
  onSelect: (result: GeocodingResult) => void;
}

const DEBOUNCE_MS = 400;

export function LocationSearch({ selected, onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        q,
        format: "json",
        countrycodes: "ph",
        limit: "6",
        addressdetails: "1",
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          signal: ctrl.signal,
          headers: { "User-Agent": "DisasterPH/1.0" },
        },
      );

      if (!res.ok) throw new Error("Geocoding failed");

      const data: Array<{
        display_name: string;
        lat: string;
        lon: string;
      }> = await res.json();

      setResults(
        data.map((item) => ({
          label: shortenLabel(item.display_name),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        })),
      );
      setShowDropdown(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(() => search(query), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <p className="mb-1 text-[9px] text-[var(--text-dim)]">Location</p>

      {/* Selected location display */}
      {selected && (
        <div className="mb-1.5 flex items-center gap-1.5 rounded-md border border-cyan-400/20 bg-cyan-400/8 px-2 py-1.5">
          <MapPin className="h-3 w-3 shrink-0 text-cyan-300" />
          <span className="flex-1 truncate text-[11px] text-cyan-200">
            {selected.label}
          </span>
          <button
            type="button"
            className="text-[9px] text-cyan-300/60 hover:text-cyan-200"
            onClick={() => {
              onSelect(null as unknown as GeocodingResult);
              setQuery("");
            }}
          >
            Change
          </button>
        </div>
      )}

      {/* Search input */}
      {!selected && (
        <>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/30" />
            <input
              className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-7 pr-7 text-xs text-white placeholder:text-white/30 focus:border-cyan-400/30 focus:outline-none"
              placeholder="Search any place in the Philippines…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
            />
            {loading && (
              <Loader2 className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-cyan-300/50" />
            )}
          </div>

          {/* Results dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-white/10 bg-[var(--bg-panel)] shadow-lg">
              {results.map((result, i) => (
                <button
                  key={`${result.latitude}-${result.longitude}-${i}`}
                  type="button"
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-white/80 transition first:rounded-t-md last:rounded-b-md hover:bg-white/5 hover:text-white"
                  onClick={() => {
                    onSelect(result);
                    setQuery("");
                    setShowDropdown(false);
                  }}
                >
                  <MapPin className="h-3 w-3 shrink-0 text-[var(--text-dim)]" />
                  <span className="truncate">{result.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* No results hint */}
          {showDropdown &&
            query.length >= 2 &&
            !loading &&
            results.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-white/10 bg-[var(--bg-panel)] px-2.5 py-2 text-center text-[10px] text-[var(--text-dim)]">
                No places found. Try a different search.
              </div>
            )}
        </>
      )}
    </div>
  );
}

/** Shorten Nominatim display_name to a readable label */
function shortenLabel(displayName: string): string {
  const parts = displayName.split(",").map((s) => s.trim());
  // Keep first 3 meaningful parts (e.g. "Barangay, City, Province")
  return parts.slice(0, 3).join(", ");
}
