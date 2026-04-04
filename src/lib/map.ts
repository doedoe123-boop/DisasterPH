export const PH_BOUNDS = {
  north: 21.5,
  south: 4.5,
  west: 116.5,
  east: 127.5,
};

export const MAP_VIEW_BOX = {
  width: 1000,
  height: 1600,
};

export function projectPhilippinesPoint(latitude: number, longitude: number) {
  const xRatio =
    (longitude - PH_BOUNDS.west) / (PH_BOUNDS.east - PH_BOUNDS.west);
  const yRatio =
    1 - (latitude - PH_BOUNDS.south) / (PH_BOUNDS.north - PH_BOUNDS.south);

  const x = xRatio * MAP_VIEW_BOX.width;
  const y = yRatio * MAP_VIEW_BOX.height;

  return {
    x: Math.max(42, Math.min(MAP_VIEW_BOX.width - 42, x)),
    y: Math.max(56, Math.min(MAP_VIEW_BOX.height - 56, y)),
  };
}
