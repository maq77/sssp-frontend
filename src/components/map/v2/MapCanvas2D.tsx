import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useMapStore } from '@/store/mapStore';
import { clampScale, fitViewport } from '@/lib/map/coordTransform';
import { ZonesLayer } from './layers/ZonesLayer';
import { CamerasLayer } from './layers/CamerasLayer';
import { AdjacencyLayer } from './layers/AdjacencyLayer';
import { PersonsLayer } from './layers/PersonsLayer';
import { IncidentsLayer } from './layers/IncidentsLayer';
import type { MapZoneDto, MapCameraDto, MapEdgeDto } from '@/types';

interface Props {
  zones: MapZoneDto[];
  cameras: MapCameraDto[];
  edges: MapEdgeDto[];
  width: number;
  height: number;
}

export function MapCanvas2D({ zones, cameras, edges, width, height }: Props) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const viewport = useMapStore(s => s.viewport);
  const setViewport = useMapStore(s => s.setViewport);
  const [isDragging, setIsDragging] = useState(false);

  // Fit on first mount
  useEffect(() => {
    if (width > 0 && height > 0) {
      setViewport(fitViewport(width, height));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const oldScale = viewport.scale;
    const newScale = clampScale(e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy);

    const mouseGridX = (pointer.x - viewport.x) / oldScale;
    const mouseGridY = (pointer.y - viewport.y) / oldScale;

    setViewport({
      scale: newScale,
      x: pointer.x - mouseGridX * newScale,
      y: pointer.y - mouseGridY * newScale,
    });
  }, [viewport, setViewport]);

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    setViewport({ x: e.target.x(), y: e.target.y() });
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Click on empty stage to clear selection.
    if (e.target === e.target.getStage()) {
      useMapStore.getState().selectCamera(null);
      useMapStore.getState().selectZone(null);
      useMapStore.getState().selectPerson(null);
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={viewport.x}
      y={viewport.y}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      draggable
      onWheel={handleWheel}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', background: '#0a0f1c' }}
    >
      {/* Drawn back-to-front */}
      <Layer>
        <AdjacencyLayer cameras={cameras} edges={edges} scale={viewport.scale} />
      </Layer>
      <Layer>
        <ZonesLayer zones={zones} scale={viewport.scale} />
      </Layer>
      <Layer>
        <CamerasLayer cameras={cameras} scale={viewport.scale} />
      </Layer>
      <Layer listening={false}>
        <IncidentsLayer cameras={cameras} zones={zones} scale={viewport.scale} />
      </Layer>
      <Layer>
        <PersonsLayer cameras={cameras} zones={zones} scale={viewport.scale} />
      </Layer>
    </Stage>
  );
}
