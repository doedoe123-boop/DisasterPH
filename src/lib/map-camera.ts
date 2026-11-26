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

/** Width kept free on the right for the event popover when it sits beside a
 *  danger zone (popover max width 340 px plus a gap). */
export const POPOVER_SIDE_ROOM = 360;

/** True when the map is wide enough to show a danger zone with the popover
 *  beside it rather than over it. */
export function popoverFitsBesideZone(width: number, leftInset = 0): boolean {
  const p = mapPadding(width, 600, leftInset);
  return width - p.left - p.right - POPOVER_SIDE_ROOM >= 260;
}

/** Phones: the map's Home / location / My places buttons sit in one row at
 *  the top left (3 × 44 px + gaps, from 12 px): fits keep that width clear. */
export const PHONE_BUTTON_ROW_RIGHT = 164;

/**
 * Padding for fitting something to look at (a volcano danger zone, saved
 * places, the device's location): the clear map area, the phone button row
 * and, when the popover sits beside a zone, room on the right for it. (A
 * zone's label sits just inside the top of its circle.)
 */
export function zonePadding(
  width: number,
  height: number,
  leftInset = 0,
  bottomInset = 0,
  topInset = 0,
  besidePopover = false,
): Padding {
  const p = mapPadding(width, height, leftInset, bottomInset, topInset);
  // Phones: the bottom sheet leaves little map, so trim the side margins
  // (the circle is centred; the zoom buttons stay clear of it).
  const small = width < 640;
  return {
    top: p.top,
    bottom: small ? Math.max(4, p.bottom - 24) : p.bottom,
    left: small ? Math.max(p.left, PHONE_BUTTON_ROW_RIGHT) : p.left,
    right: p.right + (besidePopover ? POPOVER_SIDE_ROOM : 0),
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
