import type { MapZoneDto, MapCameraDto } from '@/types';

export function zoneCenter(z: MapZoneDto): { x: number; y: number } {
  const x = (z.LayoutX ?? 500) + (z.LayoutW ?? 100) / 2;
  const y = (z.LayoutY ?? 500) + (z.LayoutH ?? 100) / 2;
  return { x, y };
}

export function cameraPosition(c: MapCameraDto): { x: number; y: number } {
  return { x: c.LayoutX ?? 500, y: c.LayoutY ?? 500 };
}

export function cameraIsPlaced(c: MapCameraDto): boolean {
  return c.LayoutX != null && c.LayoutY != null;
}

export function zoneIsPlaced(z: MapZoneDto): boolean {
  return z.LayoutX != null && z.LayoutY != null && z.LayoutW != null && z.LayoutH != null;
}

// Find the zone that owns a given camera ID
export function findCameraZone(
  cameraId: number,
  cameras: MapCameraDto[],
  zones: MapZoneDto[]
): MapZoneDto | undefined {
  const cam = cameras.find(c => c.Id === cameraId);
  if (!cam?.ZoneId) return undefined;
  return zones.find(z => z.Id === cam.ZoneId);
}

// Get position for a person based on their camera
export function getPersonPosition(
  cameraId: string | null | undefined,
  cameras: MapCameraDto[],
  zones: MapZoneDto[]
): { x: number; y: number } {
  if (!cameraId) return { x: 500, y: 500 };
  const camIdNum = parseInt(cameraId, 10);
  const cam = cameras.find(c => c.Id === camIdNum);
  if (!cam) return { x: 500, y: 500 };
  if (cameraIsPlaced(cam)) return { x: cam.LayoutX!, y: cam.LayoutY! };
  if (cam.ZoneId) {
    const zone = zones.find(z => z.Id === cam.ZoneId);
    if (zone && zoneIsPlaced(zone)) return zoneCenter(zone);
  }
  return { x: 500, y: 500 };
}
