import type { MapZoneDto, MapCameraDto, MapEdgeDto } from '@/types';

const GRID = 1000;
const ZONE_W = 150;
const ZONE_H = 110;
const ITERATIONS = 200;
const REPULSION = 80000;
const DAMPING = 0.85;

interface Node { id: number; x: number; y: number; vx: number; vy: number }

function hash(ids: number[]): string {
  return ids.slice().sort((a, b) => a - b).join(',');
}

function runForce(nodes: Node[]): void {
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist2 = dx * dx + dy * dy + 0.01;
        const f = REPULSION / dist2;
        nodes[i].vx += (dx / Math.sqrt(dist2)) * f;
        nodes[i].vy += (dy / Math.sqrt(dist2)) * f;
        nodes[j].vx -= (dx / Math.sqrt(dist2)) * f;
        nodes[j].vy -= (dy / Math.sqrt(dist2)) * f;
      }
    }
    // apply velocity
    nodes.forEach(n => {
      n.vx *= DAMPING; n.vy *= DAMPING;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(ZONE_W / 2, Math.min(GRID - ZONE_W / 2, n.x));
      n.y = Math.max(ZONE_H / 2, Math.min(GRID - ZONE_H / 2, n.y));
    });
  }
}

export function computeAutoLayout(
  zones: MapZoneDto[],
  cameras: MapCameraDto[],
  _edges: MapEdgeDto[]
): { zones: MapZoneDto[]; cameras: MapCameraDto[] } {
  const unplacedZones = zones.filter(z => z.LayoutX == null);
  if (unplacedZones.length === 0) return { zones, cameras };

  const key = `map-layout-${hash(unplacedZones.map(z => z.Id))}`;
  const cached = sessionStorage.getItem(key);

  let nodes: Node[];
  if (cached) {
    nodes = JSON.parse(cached) as Node[];
  } else {
    nodes = unplacedZones.map((z, i) => ({
      id: z.Id,
      x: (GRID / (unplacedZones.length + 1)) * (i + 1),
      y: GRID / 2 + (Math.random() - 0.5) * 200,
      vx: 0, vy: 0,
    }));
    runForce(nodes);
    sessionStorage.setItem(key, JSON.stringify(nodes));
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const patchedZones = zones.map(z => {
    const n = nodeMap.get(z.Id);
    if (!n) return z;
    return { ...z, LayoutX: n.x - ZONE_W / 2, LayoutY: n.y - ZONE_H / 2, LayoutW: ZONE_W, LayoutH: ZONE_H };
  });

  // Place unpositioned cameras at their zone center + spiral jitter
  const zoneCounters = new Map<number, number>();
  const patchedCameras = cameras.map(c => {
    if (c.LayoutX != null) return c;
    const zone = patchedZones.find(z => z.Id === c.ZoneId);
    if (!zone || zone.LayoutX == null) return c;
    const count = zoneCounters.get(zone.Id) ?? 0;
    zoneCounters.set(zone.Id, count + 1);
    const angle = count * (Math.PI * 2 / 6);
    const r = 25 + count * 12;
    const cx = (zone.LayoutX ?? 0) + (zone.LayoutW ?? ZONE_W) / 2 + Math.cos(angle) * r;
    const cy = (zone.LayoutY ?? 0) + (zone.LayoutH ?? ZONE_H) / 2 + Math.sin(angle) * r;
    return { ...c, LayoutX: cx, LayoutY: cy };
  });

  return { zones: patchedZones, cameras: patchedCameras };
}
