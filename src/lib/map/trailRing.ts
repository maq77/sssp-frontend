import type { MapPersonTrailPoint } from '@/types';

const TRAIL_CAP = 8;

export function pushTrail(
  trail: MapPersonTrailPoint[],
  x: number,
  y: number
): MapPersonTrailPoint[] {
  const next = [...trail, { x, y, t: performance.now() }];
  return next.length > TRAIL_CAP ? next.slice(next.length - TRAIL_CAP) : next;
}
