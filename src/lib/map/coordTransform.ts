// Coordinate system: abstract 0-1000 grid to screen pixels.
// viewport: { x, y, scale } where x/y are offsets in screen pixels

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Point {
  x: number;
  y: number;
}

export const GRID_SIZE = 1000;
export const MIN_SCALE = 0.15;
export const MAX_SCALE = 6;

export function gridToScreen(gx: number, gy: number, vp: Viewport): Point {
  return {
    x: gx * vp.scale + vp.x,
    y: gy * vp.scale + vp.y,
  };
}

export function screenToGrid(sx: number, sy: number, vp: Viewport): Point {
  return {
    x: (sx - vp.x) / vp.scale,
    y: (sy - vp.y) / vp.scale,
  };
}

export function gridLengthToScreen(gl: number, scale: number): number {
  return gl * scale;
}

export function fitViewport(
  containerW: number,
  containerH: number,
  padding = 60
): Viewport {
  const scale = Math.min(
    (containerW - padding * 2) / GRID_SIZE,
    (containerH - padding * 2) / GRID_SIZE,
    1
  );
  return {
    x: (containerW - GRID_SIZE * scale) / 2,
    y: (containerH - GRID_SIZE * scale) / 2,
    scale,
  };
}

export function clampScale(scale: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

// Convert grid coords to Three.js world coords (Y to Z, scale: 1 grid unit = 0.1m).
export function gridToWorld(gx: number, gy: number): { x: number; z: number } {
  return { x: (gx - GRID_SIZE / 2) * 0.1, z: (gy - GRID_SIZE / 2) * 0.1 };
}
