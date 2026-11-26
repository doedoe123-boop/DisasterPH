import type { Locale } from "@/lib/i18n";
import type { LayerKey } from "@/lib/quake-filters";

/**
 * The "i" text for each map layer: where the data comes from, how often it
 * changes, what it can't tell you, and what DisasterPH computes itself.
 * Kept in one place so it can become the public sources page later.
 * Filipino text: NEEDS NATIVE REVIEW (all of it).
 */
export interface LayerInfo {
  source: string;
  updates: string;
  limits: string;
  ours: string;
}

const EN: Record<LayerKey, LayerInfo> = {
  earthquake: {
    source: "PHIVOLCS Latest Earthquake Information. If PHIVOLCS can't be reached, the USGS catalogue fills in and is labelled USGS.",
    updates: "DisasterPH checks every 3 minutes. PHIVOLCS posts quakes within minutes and may revise magnitude and location later.",
    limits: "Magnitude 3.0 and up from the last 7 days only. Locations are preliminary. No tsunami status is shown.",
    ours: "The Info/Watch/Warning/Critical label (from magnitude), grouping of nearby quakes, fading by age, and the place-first title.",
  },
  volcano: {
    source: "PHIVOLCS volcano alert levels and daily volcano bulletins.",
    updates: "DisasterPH checks every 3 minutes. Bulletins are daily and carry a date, not a time. A bulletin older than 2 days is flagged.",
    limits: "Only volcanoes at Alert Level 1 or higher are shown. The danger-zone circle is drawn only when the bulletin gives a radius.",
    ours: "The Info/Watch/Warning/Critical label (from the alert level) and the colours. The alert level itself is official.",
  },
  typhoon: {
    source: "PAGASA Tropical Cyclone Bulletins.",
    updates: "DisasterPH checks every 3 minutes. PAGASA issues bulletins every 3 to 6 hours. A bulletin older than 9 hours is flagged.",
    limits: "Wind signals are listed by province as PAGASA writes them. DisasterPH does not show rainfall or flood warnings yet.",
    ours: "The Info/Watch/Warning/Critical label (from the highest signal) and matching provinces to regions. The signals are official.",
  },
  other: {
    source: "NASA EONET (Earth Observatory Natural Event Tracker): floods, landslides and storms seen by NASA.",
    updates: "DisasterPH checks every 3 minutes. NASA adds events when it observes them, often days later.",
    limits: "Not monitored for the Philippines: NASA lists few Philippine floods or landslides. Reference only, not a warning.",
    ours: "The Info/Watch/Warning/Critical label.",
  },
};

const FIL: Record<LayerKey, LayerInfo> = {
  earthquake: {
    source: "Latest Earthquake Information ng PHIVOLCS. Kapag hindi maabot ang PHIVOLCS, ang USGS ang pansamantalang gamit at may tatak na USGS.",
    updates: "Sinusuri ng DisasterPH bawat 3 minuto. Inilalabas ng PHIVOLCS ang lindol sa loob ng ilang minuto at maaaring baguhin ang magnitude at lokasyon.",
    limits: "Magnitude 3.0 pataas sa nakalipas na 7 araw lang. Paunang tantiya ang lokasyon. Walang ipinapakitang tsunami status.",
    ours: "Ang label na Info/Bantayan/Babala/Kritikal (mula sa magnitude), pagsasama ng magkakalapit na lindol, paglabo ayon sa edad, at ang pamagat na lugar muna.",
  },
  volcano: {
    source: "Alert level at araw-araw na volcano bulletin ng PHIVOLCS.",
    updates: "Sinusuri ng DisasterPH bawat 3 minuto. Araw-araw ang bulletin at may petsa, walang oras. May babala kapag lampas 2 araw na ang bulletin.",
    limits: "Ang mga bulkang nasa Alert Level 1 pataas lang ang ipinapakita. Iginuguhit lang ang danger zone kapag may radius sa bulletin.",
    ours: "Ang label na Info/Bantayan/Babala/Kritikal (mula sa alert level) at ang mga kulay. Opisyal ang alert level mismo.",
  },
  typhoon: {
    source: "Tropical Cyclone Bulletin ng PAGASA.",
    updates: "Sinusuri ng DisasterPH bawat 3 minuto. Naglalabas ang PAGASA ng bulletin bawat 3 hanggang 6 na oras. May babala kapag lampas 9 na oras na.",
    limits: "Nakalista ang wind signal ayon sa probinsya gaya ng sulat ng PAGASA. Wala pang rainfall o flood warning sa DisasterPH.",
    ours: "Ang label na Info/Bantayan/Babala/Kritikal (mula sa pinakamataas na signal) at pagtutugma ng probinsya sa rehiyon. Opisyal ang mga signal.",
  },
  other: {
    source: "NASA EONET: baha, pagguho ng lupa at bagyo na nakita ng NASA.",
    updates: "Sinusuri ng DisasterPH bawat 3 minuto. Idinadagdag ng NASA ang pangyayari kapag nakita nila, madalas pagkalipas ng ilang araw.",
    limits: "Hindi binabantayan para sa Pilipinas: kaunti lang ang baha o landslide sa Pilipinas na nasa listahan ng NASA. Sanggunian lang, hindi babala.",
    ours: "Ang label na Info/Bantayan/Babala/Kritikal.",
  },
};

export function layerInfo(key: LayerKey, locale: Locale): LayerInfo {
  return (locale === "fil" ? FIL : EN)[key];
}
