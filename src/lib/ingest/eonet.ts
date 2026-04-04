import type {
  Incident,
  IncidentEventType,
  IncidentSeverity,
} from "@/types/incident";
import { estimateRegion, PH_BOUNDS } from "./regions";

/*
 * NASA EONET v3 — supplementary reference source only.
 * EONET events are filtered to the Philippine bounding box and marked
 * as "reference-only" in metadata so the UI can surface the appropriate
 * confidence disclaimer.
 */

const EONET_API = "https://eonet.gsfc.nasa.gov/api/v3/events";

const CATEGORY_MAP: Record<string, IncidentEventType> = {
  severeStorms: "typhoon",
  floods: "flood",
  earthquakes: "earthquake",
  volcanoes: "volcano",
  landslides: "landslide",
  wildfires: "wildfire",
};

function isInPhilippines(lon: number, lat: number): boolean {
  return (
    lat >= PH_BOUNDS.minLat &&
    lat <= PH_BOUNDS.maxLat &&
    lon >= PH_BOUNDS.minLon &&
    lon <= PH_BOUNDS.maxLon
  );
}

export async function fetchEonetEvents(): Promise<Incident[]> {
  const res = await fetch(`${EONET_API}?status=open&limit=50`, {
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`EONET API returned ${res.status}`);

  const data = await res.json();
  const events: unknown[] = data.events ?? [];
  const incidents: Incident[] = [];

  for (const raw of events) {
    if (!raw || typeof raw !== "object") continue;
    const event = raw as Record<string, unknown>;

    const geometry = event.geometry as
      | Array<Record<string, unknown>>
      | undefined;
    if (!geometry?.length) continue;

    const latest = geometry[geometry.length - 1];
    const coordArr = latest.coordinates as number[] | undefined;
    if (!coordArr || coordArr.length < 2) continue;
    const [lon, lat] = coordArr;

    if (!isInPhilippines(lon, lat)) continue;

    const categories = event.categories as
      | Array<Record<string, string>>
      | undefined;
    const categoryId = categories?.[0]?.id ?? "unknown";
    const eventType: IncidentEventType = CATEGORY_MAP[categoryId] ?? "flood";
    const severity = deriveSeverity(categoryId, latest);

    const firstGeo = geometry[0];
    const firstCoords = firstGeo?.coordinates as number[] | undefined;

    incidents.push({
      id: String(event.id),
      source: "EONET",
      external_id: String(event.id),
      event_type: eventType,
      title: String(event.title ?? "Unnamed EONET event"),
      description:
        typeof event.description === "string" && event.description
          ? event.description
          : `Reference event from NASA EONET (${categories?.[0]?.title ?? categoryId}). For situational awareness only — not an official Philippine advisory.`,
      latitude: lat,
      longitude: lon,
      severity,
      region: estimateRegion(lat, lon),
      started_at:
        typeof firstGeo?.date === "string"
          ? firstGeo.date
          : new Date().toISOString(),
      updated_at:
        typeof latest.date === "string"
          ? latest.date
          : new Date().toISOString(),
      metadata: {
        eonet_link: typeof event.link === "string" ? event.link : "",
        category: categoryId,
        magnitude_value: (latest.magnitudeValue as number) ?? null,
        magnitude_unit: (latest.magnitudeUnit as string) ?? null,
        confidence: "reference-only",
        note: "EONET data is supplementary. Refer to PAGASA/PHIVOLCS for official advisories.",
      },
    });
  }

  return incidents;
}

/* ── Helpers ── */

function deriveSeverity(
  category: string,
  geo: Record<string, unknown>,
): IncidentSeverity {
  const mag = geo.magnitudeValue as number | null;
  if (mag == null) return "watch";

  if (category === "earthquakes") {
    if (mag >= 6.5) return "critical";
    if (mag >= 5.0) return "warning";
    if (mag >= 4.0) return "watch";
    return "advisory";
  }
  if (category === "severeStorms") {
    if (mag >= 100) return "critical";
    if (mag >= 64) return "warning";
    if (mag >= 34) return "watch";
    return "advisory";
  }
  return "watch";
}
