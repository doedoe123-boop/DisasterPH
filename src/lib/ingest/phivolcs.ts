import type { Incident, IncidentSeverity } from "@/types/incident";
import { PH_BOUNDS, regionMetadata } from "./regions";

/*
 * Philippine earthquake data via the USGS FDSN API.
 * The USGS catalogue includes PHIVOLCS-reported events in the Philippine
 * region.  We attribute these as "PHIVOLCS" because PHIVOLCS is the
 * authoritative Philippine seismic agency and co-publishes through USGS.
 */

const USGS_API = "https://earthquake.usgs.gov/fdsnws/event/1/query";

export async function fetchPhivolcsEvents(): Promise<Incident[]> {
  const params = new URLSearchParams({
    format: "geojson",
    minlatitude: String(PH_BOUNDS.minLat),
    maxlatitude: String(PH_BOUNDS.maxLat),
    minlongitude: String(PH_BOUNDS.minLon),
    maxlongitude: String(PH_BOUNDS.maxLon),
    minmagnitude: "3",
    orderby: "time",
    limit: "30",
  });

  const res = await fetch(`${USGS_API}?${params}`, {
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`USGS/PHIVOLCS API returned ${res.status}`);

  const data = await res.json();
  const features: unknown[] = data.features ?? [];
  const incidents: Incident[] = [];

  for (const raw of features) {
    if (!raw || typeof raw !== "object") continue;
    const feature = raw as Record<string, unknown>;
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const geom = (feature.geometry ?? {}) as Record<string, unknown>;
    const coords = (geom.coordinates ?? [0, 0, 0]) as number[];
    const [lon, lat, depthKm] = coords;

    const mag = Number(props.mag ?? 0);
    const severity = magToSeverity(mag);
    const place = String(props.place ?? "Philippines");
    const time = props.time
      ? new Date(props.time as number).toISOString()
      : new Date().toISOString();
    const where = regionMetadata(lat, lon);
    const updated = props.updated
      ? new Date(props.updated as number).toISOString()
      : time;

    incidents.push({
      id: `PHIVOLCS:${feature.id ?? props.code}`,
      source: "PHIVOLCS",
      external_id: String(feature.id ?? props.code ?? ""),
      event_type: "earthquake",
      title: `Magnitude ${mag.toFixed(1)} earthquake — ${place}`,
      description: buildDescription(mag, depthKm, place, props),
      latitude: lat,
      longitude: lon,
      severity,
      region: where.region,
      started_at: time,
      updated_at: updated,
      metadata: {
        magnitude: mag,
        depth_km: depthKm,
        felt_reports: (props.felt as number) ?? null,
        // USGS `tsunami` flag: 1 marks a large event in an oceanic region.
        // It does NOT say whether a tsunami occurred or a warning was issued,
        // so it is stored as-is and never shown as a tsunami status.
        usgs_tsunami_flag:
          props.tsunami === 1 ? true : props.tsunami === 0 ? false : null,
        mmi: (props.mmi as number) ?? null,
        alert_level: (props.alert as string) ?? null,
        usgs_url: (props.url as string) ?? null,
        data_source: "USGS/PHIVOLCS",
        // The source's own epicenter description, kept verbatim.
        source_place: place,
        ...where.metadata,
      },
    });
  }

  return incidents;
}

/* ── Helpers ── */

function magToSeverity(mag: number): IncidentSeverity {
  if (mag >= 6.5) return "critical";
  if (mag >= 5.0) return "warning";
  if (mag >= 4.0) return "watch";
  return "advisory";
}

function buildDescription(
  mag: number,
  depthKm: number,
  place: string,
  props: Record<string, unknown>,
): string {
  const parts = [
    `A magnitude ${mag.toFixed(1)} earthquake was recorded ${place} at a depth of ${depthKm.toFixed(0)} km.`,
  ];
  const felt = props.felt as number | null;
  if (felt && felt > 0) {
    parts.push(`${felt} felt report${felt > 1 ? "s" : ""} received.`);
  }
  // No tsunami statement either way: this feed carries no tsunami advisory.
  // Official tsunami information comes from PHIVOLCS.
  if (props.tsunami === 1) {
    parts.push(
      "USGS flags this as a large event in an oceanic region. Check PHIVOLCS for official tsunami information.",
    );
  }
  return parts.join(" ");
}
