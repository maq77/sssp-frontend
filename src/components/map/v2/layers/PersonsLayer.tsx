import { useEffect, useRef } from 'react';
import { Group, Circle, Line, Text } from 'react-konva';
import type Konva from 'konva';
import { useMapStore } from '@/store/mapStore';
import { personColors } from '@/lib/map/colorPalette';
import type { MapCameraDto, MapZoneDto } from '@/types';

interface Props {
  cameras: MapCameraDto[];
  zones: MapZoneDto[];
  scale: number;
}

const LERP_SPEED = 0.07;

export function PersonsLayer({ scale }: Props) {
  const persons = useMapStore(s => s.persons);
  const selectedPersonId = useMapStore(s => s.selectedPersonId);
  const selectPerson = useMapStore(s => s.selectPerson);
  const setHovered = useMapStore(s => s.setHovered);
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());
  const rafRef = useRef<number>(0);

  // rAF tween loop moves nodes toward targetPosition without React re-renders.
  useEffect(() => {
    const tick = () => {
      persons.forEach((person, id) => {
        const node = nodeRefs.current.get(id);
        if (!node) return;
        const cx = node.x();
        const cy = node.y();
        const dx = person.targetPosition.x - cx;
        const dy = person.targetPosition.y - cy;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          node.x(cx + dx * LERP_SPEED);
          node.y(cy + dy * LERP_SPEED);
          node.getLayer()?.batchDraw();
        }
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [persons]);

  const r = Math.max(6, 9 / scale);
  const labelSize = Math.max(9, 11 / scale);

  return (
    <>
      {[...persons.entries()].map(([id, person]) => {
        const color = personColors[person.status];
        const isSelected = selectedPersonId === id;

        return (
          <Group
            key={id}
            ref={node => {
              if (node) {
                nodeRefs.current.set(id, node);
                // Initialise position on mount
                node.x(person.position.x);
                node.y(person.position.y);
              } else {
                nodeRefs.current.delete(id);
              }
            }}
            onClick={() => selectPerson(id)}
            onMouseEnter={() => setHovered({ type: 'person', id })}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Trail */}
            {person.trail.length > 1 && (
              <Line
                points={person.trail.flatMap(p => [
                  p.x - person.position.x,
                  p.y - person.position.y,
                ])}
                stroke={color}
                strokeWidth={1.5 / scale}
                opacity={0.35}
                listening={false}
              />
            )}

            {/* Pulse ring for watchlist/unauthorized */}
            {(person.status === 'watchlist' || person.status === 'unauthorized') && (
              <Circle radius={r * 1.8} fill={color} opacity={0.18} listening={false} />
            )}

            {/* Selection ring */}
            {isSelected && (
              <Circle radius={r + 5 / scale} fill="transparent" stroke="#22d3ee" strokeWidth={1.5 / scale} />
            )}

            {/* Dot */}
            <Circle radius={r} fill={color} opacity={0.95} />
            <Circle radius={r * 0.38} fill="#0a0f1c" />

            {/* Name label */}
            <Text
              text={person.displayName}
              x={r + 4 / scale}
              y={-labelSize / 2}
              fontSize={labelSize}
              fill={color}
              fontFamily="Inter, system-ui"
              fontStyle="600"
              shadowColor="#0a0f1c"
              shadowBlur={3}
              shadowOpacity={0.9}
            />
          </Group>
        );
      })}
    </>
  );
}
