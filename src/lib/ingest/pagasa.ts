import type {
  Incident,
  IncidentEventType,
  IncidentSeverity,
} from "@/types/incident";
import { estimateRegion } from "./regions";

/*
 * PAGASA does not publish a stable REST API.
 * We attempt known bulletin endpoints and parse what is available.
 * When the feed is unavailable the source-health tracker will reflect it.
 */

const PAGASA_FORECAST_URL =
  "https://pubfiles.pagasa.dost.gov.ph/pagasaweb/files/climate/tendayforecast/forecast.json";

const PAGASA_BULLETIN_URL = "https://www.pagasa.dost.gov.ph";

export async function fetchPagasaEvents(): Promise<Incident[]> {
  const incidents: Incident[] = [];

  // ── Try structured forecast endpoint ──
  try {
    const res = await fetch(PAGASA_FORECAST_URL, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data: unknown = await res.json();
      incidents.push(...parseForecast(data));
    }
  } catch {
    /* endpoint unreachable — handled by source-health */
  }

  // ── Try severe-weather bulletin page ──
  try {
    const res = await fetch(`${PAGASA_BULLETIN_URL}/weather`, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: "text/html",
        "User-Agent": "BantayPH/1.0 (disaster-monitoring)",
      },
    });
    if (res.ok) {
      const html = await res.text();
      incidents.push(...parseBulletinHtml(html));
    }
  } catch {
    /* endpoint unreachable */
  }

  return incidents;
}

/* ── Structured forecast ── */

function parseForecast(data: unknown): Incident[] {
  if (!data || typeof data !== "object") return [];
  const entries = Array.isArray(data)
    ? data
    : Object.values(data as Record<string, unknown>);
  const out: Incident[] = [];

  for (const raw of entries) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw as Record<string, unknown>;

    const title = String(e.title ?? e.name ?? "");
    const description = String(e.description ?? e.forecast ?? e.details ?? "");
    if (!title && !description) continue;

    const text = `${title} ${description}`;
    if (!/typhoon|storm|flood|heavy rain|warning|signal|landslide/i.test(text))
      continue;

    const lat = Number(e.latitude ?? e.lat ?? 14.5);
    const lon = Number(e.longitude ?? e.lon ?? 121.0);

    out.push({
      id: `PAGASA:${e.id ?? Date.now()}`,
      source: "PAGASA",
      external_id: String(e.id ?? `pagasa-${Date.now()}-${out.length}`),
      event_type: inferEventType(text),
      title: title || "PAGASA weather advisory",
      description: description || "Weather advisory from PAGASA.",
      latitude: lat,
      longitude: lon,
      severity: inferSeverity(text),
      region:
        typeof e.region === "string" ? e.region : estimateRegion(lat, lon),
      started_at: String(e.issued_at ?? e.date ?? new Date().toISOString()),
      updated_at: new Date().toISOString(),
      metadata: {
        data_source: "PAGASA",
        bulletin_type: String(e.type ?? "advisory"),
      },
    });
  }
  return out;
}

/* ── Bulletin HTML ── */

function parseBulletinHtml(html: string): Incident[] {
  const incidents: Incident[] = [];
  const signalPattern = /Signal\s+No\.\s*(\d+)/gi;
  const seen = new Set<number>();

  for (const match of html.matchAll(signalPattern)) {
    const num = parseInt(match[1], 10);
    if (isNaN(num) || seen.has(num)) continue;
    seen.add(num);

    const severity: IncidentSeverity =
      num >= 4
        ? "critical"
        : num >= 3
          ? "warning"
          : num >= 2
            ? "watch"
            : "advisory";

    incidents.push({
      id: `PAGASA:tcws-${num}`,
      source: "PAGASA",
      external_id: `tcws-signal-${num}`,
      event_type: "typhoon",
      title: `Tropical Cyclone Wind Signal #${num}`,
      description: `PAGASA has raised Tropical Cyclone Wind Signal #${num} over affected areas.`,
      latitude: 14.5,
      longitude: 121.0,
      severity,
      region: "Philippines",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        signal_number: num,
        data_source: "PAGASA",
        bulletin_type: "tropical-cyclone-wind-signal",
      },
    });
  }
  return incidents;
}

/* ── Helpers ── */

function inferEventType(text: string): IncidentEventType {
  const t = text.toLowerCase();
  if (/typhoon|cyclone|storm|signal/.test(t)) return "typhoon";
  if (/flood|rain/.test(t)) return "flood";
  if (/landslide|slope/.test(t)) return "landslide";
  if (/volcano|eruption/.test(t)) return "volcano";
  if (/earthquake|quake/.test(t)) return "earthquake";
  return "flood";
}

function inferSeverity(text: string): IncidentSeverity {
  const t = text.toLowerCase();
  if (/signal\s*#?[45]|extreme/i.test(t)) return "critical";
  if (/warning|signal\s*#?3|heavy/i.test(t)) return "warning";
  if (/watch|signal\s*#?2/i.test(t)) return "watch";
  return "advisory";
}
