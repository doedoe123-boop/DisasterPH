import type { ArchiveHazardType, ArchiveSeverityLabel } from "@/types/archive";

export const HAZARD_COLORS: Record<ArchiveHazardType, string> = {
  earthquake: "text-red-400 bg-red-500/10 border-red-500/30",
  typhoon: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  flood: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  volcano: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  landslide: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  tsunami: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  drought: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  other: "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

export const HAZARD_MARKER_COLOR: Record<ArchiveHazardType, string> = {
  earthquake: "#EF4444",
  typhoon: "#60A5FA",
  flood: "#22D3EE",
  volcano: "#F97316",
  landslide: "#EAB308",
  tsunami: "#A78BFA",
  drought: "#F59E0B",
  other: "#94A3B8",
};

export const SEVERITY_CONFIG: Record<
  ArchiveSeverityLabel,
  { label: string; color: string; dot: string }
> = {
  catastrophic: {
    label: "Catastrophic",
    color: "text-red-400 border-red-500/40 bg-red-500/10",
    dot: "bg-red-500",
  },
  major: {
    label: "Major",
    color: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    dot: "bg-orange-500",
  },
  significant: {
    label: "Significant",
    color: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
    dot: "bg-yellow-400",
  },
  moderate: {
    label: "Moderate",
    color: "text-blue-400 border-blue-500/40 bg-blue-500/10",
    dot: "bg-blue-400",
  },
};

export const SOURCE_CREDIBILITY: Record<string, string> = {
  PHIVOLCS: "Confirmed",
  PAGASA: "Confirmed",
  NDRRMC: "Official",
  USGS: "Confirmed",
  UN: "Verified",
};

export const HAZARD_TYPES: Array<{
  label: string;
  value: ArchiveHazardType | "all";
}> = [
  { label: "All", value: "all" },
  { label: "Earthquake", value: "earthquake" },
  { label: "Typhoon", value: "typhoon" },
  { label: "Flood", value: "flood" },
  { label: "Volcano", value: "volcano" },
  { label: "Landslide", value: "landslide" },
  { label: "Tsunami", value: "tsunami" },
  { label: "Other", value: "other" },
];

export const YEAR_FILTERS = [
  "all",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2013",
] as const;

export function formatArchiveDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatArchiveDateLong(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function computeDuration(
  startDate: string,
  endDate: string | null,
): string {
  if (!endDate) return "Ongoing";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return `${days} days`;
}
