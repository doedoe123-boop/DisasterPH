export type ArchiveHazardType =
  | "earthquake"
  | "typhoon"
  | "flood"
  | "volcano"
  | "landslide"
  | "tsunami"
  | "drought"
  | "other";

export type ArchiveSeverityLabel =
  | "catastrophic"
  | "major"
  | "significant"
  | "moderate";

export interface ArchiveTimelineEntry {
  date: string;
  title: string;
  description: string;
}

export interface ArchiveSource {
  name: string;
  url: string;
}

export interface ArchiveMetric {
  label: string;
  value: string;
  icon: string;
  color?: string;
  note?: string;
}

export interface ArchiveEvent {
  id: string;
  slug: string;
  title: string;
  hazardType: ArchiveHazardType;
  severityLabel: ArchiveSeverityLabel;
  peakIntensity: string;
  startDate: string;
  endDate: string | null;
  affectedRegions: string[];
  deathToll: number | null;
  displacedCount: number | null;
  damagePhpBillion: number | null;
  magnitude: number | null;
  summary: string;
  timelineEvents: ArchiveTimelineEntry[];
  officialSources: ArchiveSource[];
  lessonsLearned: string[];
  latitude: number;
  longitude: number;
  isFeatured: boolean;
}
