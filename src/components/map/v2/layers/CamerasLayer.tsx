import { Group, Circle, Wedge, Text } from 'react-konva';
import { useMapStore } from '@/store/mapStore';
import { cameraColors } from '@/lib/map/colorPalette';
import { cameraIsPlaced } from '@/lib/map/layoutGeometry';
import type { MapCameraDto } from '@/types';

interface Props {
  cameras: MapCameraDto[];
  scale: number;
}

export function CamerasLayer({ cameras, scale }: Props) {
  const selectedCameraId = useMapStore(s => s.selectedCameraId);
  const cameraRuntime = useMapStore(s => s.cameraRuntime);
  const incidents = useMapStore(s => s.incidents);
  const selectCamera = useMapStore(s => s.selectCamera);
  const setHovered = useMapStore(s => s.setHovered);
  const setLiveFeedCamera = useMapStore(s => s.setLiveFeedCamera);

  const r = Math.max(5, 8 / scale);
  const labelSize = Math.max(8, 10 / scale);

  return (
    <>
      {cameras.map(cam => {
        if (!cameraIsPlaced(cam)) return null;
        const x = cam.LayoutX!;
        const y = cam.LayoutY!;
        const rt = cameraRuntime.get(cam.Id);
        const hasIncident = [...incidents.values()].some(i => i.cameraId === cam.Id);
        const isOnline = rt?.isOnline ?? cam.IsActive;
        const color = hasIncident ? cameraColors.incident
          : isOnline ? cameraColors.online
          : cameraColors.offline;
        const isSelected = selectedCameraId === cam.Id;

        // FOV cone
        const heading = cam.FovHeadingDeg ?? 0;
        const fovAngle = cam.FovAngleDeg ?? 60;
        const fovRange = cam.FovRangeUnits ?? 80;

        return (
          <Group
            key={cam.Id}
            x={x}
            y={y}
            onClick={() => { selectCamera(cam.Id); setLiveFeedCamera(cam.Id); }}
            onMouseEnter={() => { setHovered({ type: 'camera', id: cam.Id }); setLiveFeedCamera(cam.Id); }}
            onMouseLeave={() => setHovered(null)}
          >
            {/* FOV cone */}
            <Wedge
              radius={fovRange / scale}
              angle={fovAngle}
              rotation={heading - fovAngle / 2 - 90}
              fill={color}
              opacity={0.08}
              listening={false}
            />
            {/* Selection ring */}
            {isSelected && (
              <Circle radius={r + 4 / scale} fill="transparent" stroke="#22d3ee" strokeWidth={1.5 / scale} />
            )}
            {/* Body */}
            <Circle radius={r} fill={color} opacity={0.9} />
            {/* Inner dot */}
            <Circle radius={r * 0.4} fill="#0a0f1c" />
            {/* Label */}
            <Text
              text={cam.Name}
              x={r + 4 / scale}
              y={-labelSize / 2}
              fontSize={labelSize}
              fill="#94a3b8"
              fontFamily="Inter, system-ui"
            />
          </Group>
        );
      })}
    </>
  );
}
