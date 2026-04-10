import type { Incident } from "@/types/incident";
import type { Locale } from "@/lib/i18n";

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function plainAlertInterpretation(
  incident: Incident,
  locale: Locale,
): string {
  const magnitude = numberValue(incident.metadata.magnitude);
  const depthKm = numberValue(incident.metadata.depth_km);
  const signalNumber = numberValue(incident.metadata.signal_number);
  const windSpeed = numberValue(incident.metadata.wind_speed_kph);
  const alertLevel = numberValue(incident.metadata.alert_level);

  if (locale === "fil") {
    if (incident.event_type === "typhoon") {
      if ((signalNumber ?? 0) >= 3 || incident.severity === "critical") {
        return "Asahan ang mapaminsalang hangin. Manatili sa loob, itali ang maluluwag na gamit, at lumikas kung inutusan.";
      }
      if ((signalNumber ?? 0) >= 1 || windSpeed != null) {
        return "May malakas na hangin at ulan. I-charge ang phones, ihanda ang go-bag, at iwasan ang pagbiyahe kung hindi kailangan.";
      }
      return "May namumuong panganib ng bagyo. Bantayan ang PAGASA updates at ihanda ang bahay at pamilya.";
    }

    if (incident.event_type === "earthquake") {
      if ((magnitude ?? 0) >= 6 || incident.severity === "critical") {
        return `Malakas na lindol${depthKm != null ? `, humigit-kumulang ${depthKm.toFixed(0)} km ang lalim` : ""}. Maghanda sa aftershocks, suriin ang pinsala, at lumayo sa sirang gusali.`;
      }
      if ((magnitude ?? 0) >= 4.5 || incident.severity === "warning") {
        return "Maaaring naramdaman ang pagyanig. Suriin ang bahay, lumayo sa salamin, at maging handa sa aftershocks.";
      }
      return "Naitalang lindol. Manatiling alerto at bantayan ang opisyal na abiso kung may aftershocks.";
    }

    if (incident.event_type === "flood") {
      if (incident.severity === "critical" || incident.severity === "warning") {
        return "May panganib ng mabilis na pagtaas ng tubig. Lumipat sa mataas na lugar at huwag tumawid sa baha.";
      }
      return "May posibleng pagbaha. Bantayan ang tubig sa paligid at ihanda ang mahahalagang gamit.";
    }

    if (incident.event_type === "volcano") {
      if ((alertLevel ?? 0) >= 3 || incident.severity === "critical") {
        return "Mataas ang banta mula sa bulkan. Sundin ang evacuation order at gumamit ng proteksyon laban sa abo.";
      }
      return "May aktibidad ang bulkan. Iwasan ang danger zone at bantayan ang PHIVOLCS advisories.";
    }

    if (incident.event_type === "landslide") {
      return "May panganib ng pagguho. Lumayo sa matarik na lugar, pader, at tabing-ilog lalo na kapag malakas ang ulan.";
    }

    return "May abisong pangkaligtasan. Bantayan ang opisyal na impormasyon at ihanda ang pamilya.";
  }

  if (incident.event_type === "typhoon") {
    if ((signalNumber ?? 0) >= 3 || incident.severity === "critical") {
      return "Expect destructive winds. Stay indoors, secure loose objects, and evacuate if local officials order it.";
    }
    if ((signalNumber ?? 0) >= 1 || windSpeed != null) {
      return "Expect strong rain and wind. Charge phones, prepare a go-bag, and avoid unnecessary travel.";
    }
    return "A typhoon-related threat is being monitored. Watch PAGASA updates and prepare your home and family.";
  }

  if (incident.event_type === "earthquake") {
    if ((magnitude ?? 0) >= 6 || incident.severity === "critical") {
      return `Strong earthquake recorded${depthKm != null ? ` around ${depthKm.toFixed(0)} km deep` : ""}. Prepare for aftershocks, check for damage, and stay away from damaged buildings.`;
    }
    if ((magnitude ?? 0) >= 4.5 || incident.severity === "warning") {
      return "Shaking may have been felt. Check your home, stay away from glass, and prepare for aftershocks.";
    }
    return "Earthquake activity was recorded. Stay alert and monitor official updates for aftershocks.";
  }

  if (incident.event_type === "flood") {
    if (incident.severity === "critical" || incident.severity === "warning") {
      return "Floodwater may rise quickly. Move to higher ground and do not cross flooded roads.";
    }
    return "Flooding is possible. Monitor nearby water levels and keep essentials ready.";
  }

  if (incident.event_type === "volcano") {
    if ((alertLevel ?? 0) >= 3 || incident.severity === "critical") {
      return "Volcanic risk is elevated. Follow evacuation orders and protect yourself from ashfall.";
    }
    return "Volcanic activity is being monitored. Avoid danger zones and follow PHIVOLCS advisories.";
  }

  if (incident.event_type === "landslide") {
    return "Landslide risk is present. Stay away from steep slopes, retaining walls, and riverbanks during heavy rain.";
  }

  return "A safety advisory is active. Monitor official information and prepare your household.";
}
