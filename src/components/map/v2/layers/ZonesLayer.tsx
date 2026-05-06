import { Group, Rect, Text } from 'react-konva';
import { useMapStore } from '@/store/mapStore';
import { zoneColors } from '@/lib/map/colorPalette';
import type { MapZoneDto } from '@/types';

interface Props {
  zones: MapZoneDto[];
  scale: number;
}

export function ZonesLayer({ zones, scale }: Props) {
  const selectedZoneId = useMapStore(s => s.selectedZoneId);
  const selectZone = useMapStore(s => s.selectZone);
  const setHovered = useMapStore(s => s.setHovered);

  return (
    <>
      {zones.map(zone => {
        if (zone.LayoutX == null || zone.LayoutY == null) return null;
        const x = zone.LayoutX;
        const y = zone.LayoutY;
        const w = zone.LayoutW ?? 150;
        const h = zone.LayoutH ?? 110;
        const colors = zoneColors[zone.ZoneType];
        const isSelected = selectedZoneId === zone.Id;
        const labelSize = Math.max(9, Math.min(14, 12 / scale));

        return (
          <Group
            key={zone.Id}
            x={x}
            y={y}
            onClick={() => selectZone(zone.Id)}
            onMouseEnter={() => setHovered({ type: 'zone', id: zone.Id })}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Fill */}
            <Rect
              width={w}
              height={h}
              fill={colors.fill}
              opacity={colors.fillAlpha}
              cornerRadius={6}
            />
            {/* Border */}
            <Rect
              width={w}
              height={h}
              stroke={isSelected ? '#22d3ee' : colors.stroke}
              strokeWidth={isSelected ? 2.5 / scale : 1.5 / scale}
              cornerRadius={6}
              fill="transparent"
            />
            {/* Zone name */}
            <Text
              text={zone.Name}
              x={8}
              y={8}
              fontSize={labelSize}
              fill={colors.stroke}
              fontFamily="Inter, system-ui"
              fontStyle="600"
              width={w - 16}
              ellipsis
            />
            {/* Camera count badge */}
            {zone.CameraCount > 0 && (
              <Text
                text={`${zone.CameraCount} cam${zone.CameraCount > 1 ? 's' : ''}`}
                x={8}
                y={h - 18}
                fontSize={Math.max(8, 10 / scale)}
                fill="#94a3b8"
                fontFamily="Inter, system-ui"
              />
            )}
          </Group>
        );
      })}
    </>
  );
}
