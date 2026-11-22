/**
 * Column projections for community_reports. All access goes through server
 * routes using the service role (see supabase/003_lock_down_community_reports.sql),
 * so these lists are the only thing deciding what leaves the database.
 */

/** Fields safe to show anyone. Excludes reporter identity and moderation notes. */
export const PUBLIC_REPORT_COLUMNS =
  "id, category, title, description, latitude, longitude, location_label, status, created_at, updated_at";

/** Full row for authenticated moderators. */
export const MODERATION_REPORT_COLUMNS =
  "id, category, title, description, latitude, longitude, location_label, status, reporter_name, moderated_at, moderated_by, moderation_reason, created_at, updated_at";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
