import type { ExpressionSpecification, Map as MlMap } from "maplibre-gl";

/**
 * Base-map labels in English, focused on the Philippines.
 *
 * The OpenFreeMap styles label places in the local script next to the Latin
 * name (e.g. "广东省"). Every label that shows a name is switched to the
 * English name, falling back to the Latin-script name, then the local name.
 * Place labels (countries, cities, towns) outside a box around the
 * Philippines are hidden; sea and ocean names stay.
 */
const ENGLISH_NAME: ExpressionSpecification = ["coalesce", ["get", "name:en"], ["get", "name_en"], ["get", "name:latin"], ["get", "name"]];

/** Box around the Philippines and its waters (lon/lat), for label filtering. */
const PH_LABEL_AREA: GeoJSON.Polygon = {
  type: "Polygon",
  coordinates: [[[114, 3.5], [128.5, 3.5], [128.5, 21.8], [114, 21.8], [114, 3.5]]],
};

function usesName(value: unknown): boolean {
  return JSON.stringify(value ?? "").includes('"name');
}

export function applyBaseLabels(map: MlMap): void {
  const style = map.getStyle();
  for (const layer of style?.layers ?? []) {
    if (layer.type !== "symbol") continue;
    const textField = map.getLayoutProperty(layer.id, "text-field");
    if (!usesName(textField)) continue;
    try {
      map.setLayoutProperty(layer.id, "text-field", ENGLISH_NAME);
      if ("source-layer" in layer && layer["source-layer"] === "place") {
        const existing = map.getFilter(layer.id);
        const within = ["within", PH_LABEL_AREA];
        map.setFilter(layer.id, (existing ? ["all", existing, within] : within) as never);
      }
    } catch {
      // A layer the style changed shape on: leave it as the style draws it.
    }
  }
}
