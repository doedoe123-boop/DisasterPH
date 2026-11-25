import { DisasterPHCommand } from "@/components/disasterph/disasterph-command";
import { buildIncidentsPayload } from "@/lib/incidents-payload";

/**
 * Rendered on the server with the current alerts, so the status summary and
 * the event list arrive as text in the first response. The map (MapLibre)
 * loads afterwards in the browser, with a placeholder meanwhile.
 */
export default async function Home() {
  const initial = await buildIncidentsPayload();
  return <DisasterPHCommand initial={initial} />;
}
