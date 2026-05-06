import { Group, Circle, Text } from 'react-konva';
import { useMapStore } from '@/store/mapStore';
import { severityColors } from '@/lib/map/colorPalette';
import { zoneCenter } from '@/lib/map/layoutGeometry';
import { IncidentStatus } from '@/types';
import type { MapCameraDto, MapZoneDto } from '@/types';

interface Props {
  cameras: MapCameraDto[];
  zones: MapZoneDto[];
  scale: number;
}

const INCIDENT_ICON = '!';

export function IncidentsLayer({ cameras, zones, scale }: Props) {
  const incidents = useMapStore(s => s.incidents);
  const activeIncidents = [...incidents.values()].filter(
    i => i.status !== IncidentStatus.Closed && i.status !== IncidentStatus.Resolved
  );

  const r = Math.max(8, 11 / scale);
  const fontSize = Math.max(8, 10 / scale);

  return (
    <>
      {activeIncidents.map(incident => {
        let x = 500, y = 500;

        if (incident.cameraId) {
          const cam = cameras.find(c => c.Id === incident.cameraId);
          if (cam?.LayoutX != null) { x = cam.LayoutX + 12; y = cam.LayoutY! - 12; }
        } else if (incident.zoneId) {
          const zone = zones.find(z => z.Id === incident.zoneId);
          if (zone?.LayoutX != null) {
            const c = zoneCenter(zone);
            x = c.x + (zone.LayoutW ?? 150) / 4;
            y = c.y - (zone.LayoutH ?? 110) / 4;
          }
        } else {
          return null;
        }

        const color = severityColors[incident.severity];

        return (
          <Group key={incident.id} x={x} y={y}>
            <Circle radius={r} fill={color} opacity={0.85} />
            <Text
              text={INCIDENT_ICON}
              x={-r * 0.55}
              y={-r * 0.6}
              fontSize={r * 1.1}
              fill="#0a0f1c"
            />
            <Text
              text={incident.title.length > 20 ? incident.title.slice(0, 20) + '...' : incident.title}
              x={r + 3 / scale}
              y={-fontSize / 2}
              fontSize={fontSize}
              fill={color}
              fontFamily="Inter, system-ui"
              shadowColor="#0a0f1c"
              shadowBlur={2}
            />
          </Group>
        );
      })}
    </>
  );
}
