/**
 * Camera rules for the map. The national view is flat, north-up and fits the
 * whole country inside the part of the map that panels do not cover. The
 * camera moves only when the resident asks for it (pan, zoom, selecting an
 * event, Reset map view) — never because the feed refreshed.
 */

export interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Room kept clear for the map's own controls (top-right buttons, zoom
 *  control at bottom-right, attribution at bottom-left). */
const BASE: Padding = { top: 56, bottom: 56, left: 48, right: 64 };

/**
 * Padding for the visible map area. `leftInset` is the width of a panel that
 * floats over the left of the map (the focus-mode incident card). It is only
 * applied when the map is wide enough for it to leave a usable area.
 */
export function mapPadding(width: number, height: number, leftInset = 0, bottomInset = 0, topInset = 0): Padding {
  const left = leftInset > 0 && width - leftInset >= 480 ? BASE.left + leftInset : BASE.left;
  // Small screens: shrink the margins so the country is not tiny.
  const scale = width < 640 || height < 420 ? 0.5 : 1;
  // `bottomInset`: a panel over the bottom of the map (the phone list panel),
  // kept clear only when enough map remains above it.
  const bottomExtra = bottomInset > 0 && height - bottomInset >= 150 ? bottomInset : 0;
  // `topInset`: controls over the top of the map (the time chips row).
  const top = Math.max(Math.round(BASE.top * scale), topInset > 0 && height - topInset - bottomExtra >= 120 ? topInset + 8 : 0);
  return {
    top,
    bottom: Math.round(BASE.bottom * scale) + bottomExtra,
    left: left === BASE.left ? Math.round(BASE.left * scale) : left,
    right: Math.round(BASE.right * scale),
  };
}

/** True when a screen point lies inside the padded (unobstructed) area. */
export function isInView(
  point: { x: number; y: number },
  width: number,
  height: number,
  padding: Padding,
): boolean {
  return (
    point.x >= padding.left &&
    point.x <= width - padding.right &&
    point.y >= padding.top &&
    point.y <= height - padding.bottom
  );
}

/** Zoom used when bringing a selected event into view: close enough to find
 *  it, far enough that a nearby stretch of coast stays visible for offshore
 *  events. Never zooms out from where the resident already is. */
export const FOCUS_MIN_ZOOM = 6;

export function focusZoom(current: number): number {
  return Math.max(current, FOCUS_MIN_ZOOM);
}
