import { useMapStore } from '@/store/mapStore';
import { zoneColors, cameraColors, personColors } from '@/lib/map/colorPalette';

const MM_W = 160;
const MM_H = 100;
const GRID = 1000;

function gridToMM(x: number, y: number) {
  return { mx: (x / GRID) * MM_W, my: (y / GRID) * MM_H };
}

export function MinimapOverlay() {
  const zones    = useMapStore(s => s.zones);
  const cameras  = useMapStore(s => s.cameras);
  const persons  = useMapStore(s => s.persons);
  const viewport = useMapStore(s => s.viewport);

  // Viewport rectangle in grid coords
  const vW = (MM_W / viewport.scale) * (GRID / MM_W);
  const vH = (MM_H / viewport.scale) * (GRID / MM_H);
  const vX = -viewport.x / viewport.scale;
  const vY = -viewport.y / viewport.scale;

  return (
    <div
      className="absolute bottom-16 left-4 z-10 rounded-xl overflow-hidden border border-white/12 bg-[#0a0f1c]/90 backdrop-blur-sm shadow-xl"
      style={{ width: MM_W, height: MM_H }}
    >
      <svg width={MM_W} height={MM_H} className="absolute inset-0">
        {/* Zones */}
        {zones.map(z => {
          if (z.LayoutX == null || z.LayoutY == null) return null;
          const topLeft = gridToMM(z.LayoutX, z.LayoutY);
          const col = zoneColors[z.ZoneType];
          return (
            <rect
              key={z.Id}
              x={topLeft.mx}
              y={topLeft.my}
              width={((z.LayoutW ?? 150) / GRID) * MM_W}
              height={((z.LayoutH ?? 110) / GRID) * MM_H}
              rx={2}
              fill={`${col.fill}55`}
              stroke={col.stroke}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Cameras */}
        {cameras.map(c => {
          if (c.LayoutX == null || c.LayoutY == null) return null;
          const { mx, my } = gridToMM(c.LayoutX, c.LayoutY);
          return (
            <circle
              key={c.Id}
              cx={mx} cy={my} r={2}
              fill={cameraColors.online}
            />
          );
        })}

        {/* Persons */}
        {Array.from(persons.values()).map(p => {
          const { mx, my } = gridToMM(p.position.x, p.position.y);
          return (
            <circle
              key={p.id}
              cx={mx} cy={my} r={1.5}
              fill={personColors[p.status]}
            />
          );
        })}

        {/* Viewport rect */}
        <rect
          x={(vX / GRID) * MM_W}
          y={(vY / GRID) * MM_H}
          width={(vW / GRID) * MM_W}
          height={(vH / GRID) * MM_H}
          fill="none"
          stroke="rgba(34,211,238,0.5)"
          strokeWidth={1}
        />
      </svg>

      <div className="absolute top-1 left-1.5 text-[9px] text-slate-600 font-mono select-none">
        MINI
      </div>
    </div>
  );
}
