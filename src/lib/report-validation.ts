import type { ReportCategory } from "@/types/incident";

/** Philippines bounding box (generous buffer for outlying islands) */
const PH_BOUNDS = {
  latMin: 4.2,
  latMax: 21.5,
  lngMin: 114.0,
  lngMax: 128.0,
};

const VALID_CATEGORIES: Set<string> = new Set<ReportCategory>([
  "blocked_road",
  "flooding",
  "landslide",
  "power_outage",
  "evacuation",
  "damage",
  "other",
]);

export function validateCategory(cat: unknown): cat is ReportCategory {
  return typeof cat === "string" && VALID_CATEGORIES.has(cat);
}

export function validateCoordinates(
  lat: unknown,
  lng: unknown,
):
  | { valid: true; lat: number; lng: number }
  | { valid: false; reason: string } {
  const latN = Number(lat);
  const lngN = Number(lng);

  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    return { valid: false, reason: "Coordinates must be valid numbers" };
  }

  if (
    latN < PH_BOUNDS.latMin ||
    latN > PH_BOUNDS.latMax ||
    lngN < PH_BOUNDS.lngMin ||
    lngN > PH_BOUNDS.lngMax
  ) {
    return {
      valid: false,
      reason: "Coordinates must be within the Philippines",
    };
  }

  return { valid: true, lat: latN, lng: lngN };
}

/**
 * Honeypot check — if the hidden field has any value, it's a bot.
 */
export function isHoneypotFilled(body: Record<string, unknown>): boolean {
  return typeof body.website === "string" && body.website.length > 0;
}

/**
 * Verify admin token for protected endpoints.
 * Uses server-only env var (not NEXT_PUBLIC_).
 */
export function isValidAdminToken(headerValue: string | null): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false; // No token configured = locked out
  return headerValue === token;
}
