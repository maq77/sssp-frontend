import { Line } from 'react-konva';
import { cameraPosition, cameraIsPlaced } from '@/lib/map/layoutGeometry';
import type { MapCameraDto, MapEdgeDto } from '@/types';

interface Props {
  cameras: MapCameraDto[];
  edges: MapEdgeDto[];
  scale: number;
}

export function AdjacencyLayer({ cameras, edges, scale }: Props) {
  const camMap = new Map(cameras.map(c => [c.Id, c]));

  return (
    <>
      {edges.map(edge => {
        const from = camMap.get(edge.FromCameraId);
        const to   = camMap.get(edge.ToCameraId);
        if (!from || !to || !cameraIsPlaced(from) || !cameraIsPlaced(to)) return null;
        const fp = cameraPosition(from);
        const tp = cameraPosition(to);

        return (
          <Line
            key={`${edge.FromCameraId}-${edge.ToCameraId}`}
            points={[fp.x, fp.y, tp.x, tp.y]}
            stroke="#1e3a5f"
            strokeWidth={1.5 / scale}
            dash={[6 / scale, 3 / scale]}
            opacity={0.65}
            listening={false}
          />
        );
      })}
    </>
  );
}
