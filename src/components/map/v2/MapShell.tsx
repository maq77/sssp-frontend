import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { RefObject } from 'react';
import { useMapLayout } from '@/hooks/map/useMapLayout';
import { useMapRealtime } from '@/hooks/map/useMapRealtime';
import { useMapHotkeys } from '@/hooks/map/useMapHotkeys';
import { useActivePersonsBootstrap } from '@/hooks/map/useActivePersonsBootstrap';
import { useMapStore } from '@/store/mapStore';
import { computeAutoLayout } from '@/lib/map/autoLayoutFallback';
import { fitViewport } from '@/lib/map/coordTransform';
import { MapCanvas2D } from './MapCanvas2D';
import { MapCanvas3D } from './MapCanvas3D';
import { MapToolbar } from './MapToolbar';
import { LoadingSkeleton } from './overlays/LoadingSkeleton';
import { LegendOverlay } from './overlays/LegendOverlay';
import { KeyboardHints } from './overlays/KeyboardHints';
import { MinimapOverlay } from './overlays/MinimapOverlay';
import { PersonsPanel } from './panels/PersonsPanel';
import { IncidentsTickerPanel } from './panels/IncidentsTickerPanel';
import { FilterPanel } from './panels/FilterPanel';
import { CameraDetailPopover } from './panels/CameraDetailPopover';
import { ZoneDetailPopover } from './panels/ZoneDetailPopover';
import { LiveFeedDock } from './feed/LiveFeedDock';

export function MapShell() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const size = useElementSize(containerRef);
  const layoutQuery = useMapLayout();
  const setTopology = useMapStore(s => s.setTopology);
  const setViewport = useMapStore(s => s.setViewport);
  const viewMode = useMapStore(s => s.viewMode);
  const zones = useMapStore(s => s.zones);
  const cameras = useMapStore(s => s.cameras);
  const filters = useMapStore(s => s.filters);
  const panelsOpen = useMapStore(s => s.panelsOpen);
  const cameraRuntime = useMapStore(s => s.cameraRuntime);

  useMapRealtime();
  useMapHotkeys(containerRef);
  useActivePersonsBootstrap(zones.length > 0 || cameras.length > 0);

  useEffect(() => {
    if (!layoutQuery.data) return;
    const auto = computeAutoLayout(
      layoutQuery.data.Zones,
      layoutQuery.data.Cameras,
      layoutQuery.data.Edges
    );
    setTopology({ ...layoutQuery.data, Zones: auto.zones, Cameras: auto.cameras });
  }, [layoutQuery.data, setTopology]);

  const fitView = useCallback(() => {
    if (size.width <= 0 || size.height <= 0) return;
    setViewport(fitViewport(size.width, size.height));
  }, [setViewport, size.height, size.width]);

  const filteredZones = useMemo(() => {
    return zones.filter(zone => {
      if (filters.floorId && zone.FloorId !== filters.floorId) return false;
      if (filters.zoneTypes.size > 0 && !filters.zoneTypes.has(zone.ZoneType)) return false;
      return true;
    });
  }, [filters.floorId, filters.zoneTypes, zones]);

  const filteredCameras = useMemo(() => {
    const visibleZoneIds = new Set(filteredZones.map(zone => zone.Id));
    return cameras.filter(camera => {
      if (camera.ZoneId && !visibleZoneIds.has(camera.ZoneId)) return false;
      if (!filters.hideOfflineCameras) return true;
      return cameraRuntime.get(camera.Id)?.isOnline ?? camera.IsActive;
    });
  }, [cameraRuntime, cameras, filteredZones, filters.hideOfflineCameras]);

  const edges = layoutQuery.data?.Edges ?? [];
  const hasMapData = filteredZones.length > 0 || filteredCameras.length > 0;

  return (
    <section className="h-[calc(100vh-8.5rem)] min-h-[640px] overflow-hidden rounded-lg border border-border bg-[#090f1a] shadow-2xl">
      <div
        ref={containerRef}
        tabIndex={0}
        className="relative h-full w-full overflow-hidden outline-none"
      >
        {layoutQuery.isLoading && <LoadingSkeleton />}

        {layoutQuery.isError && (
          <MapError onRetry={() => void layoutQuery.refetch()} />
        )}

        {!layoutQuery.isLoading && !layoutQuery.isError && !hasMapData && (
          <EmptyMapState />
        )}

        {!layoutQuery.isLoading && !layoutQuery.isError && hasMapData && size.width > 0 && size.height > 0 && (
          <>
            <AnimatePresence mode="wait">
              {viewMode === '2d' ? (
                <motion.div
                  key="map-2d"
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                >
                  <MapCanvas2D
                    zones={filteredZones}
                    cameras={filteredCameras}
                    edges={edges}
                    width={size.width}
                    height={size.height}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="map-3d"
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.015 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.35 }}
                >
                  <MapCanvas3D
                    zones={filteredZones}
                    cameras={filteredCameras}
                    edges={edges}
                    width={size.width}
                    height={size.height}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <MapToolbar onFitView={fitView} />
            <LegendOverlay />
            <KeyboardHints />
            {panelsOpen.minimap && <MinimapOverlay />}
            <IncidentsTickerPanel />
            <PersonsPanel />
            <FilterPanel />
            <CameraDetailPopover cameras={filteredCameras} />
            <ZoneDetailPopover zones={filteredZones} cameras={filteredCameras} />
            <LiveFeedDock />
          </>
        )}
      </div>
    </section>
  );
}

function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      setSize({
        width: Math.round(node.clientWidth),
        height: Math.round(node.clientHeight),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

function MapError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#090f1a]">
      <div className="w-[min(420px,calc(100%-2rem))] rounded-lg border border-red-500/25 bg-red-950/20 p-5 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
        <h2 className="text-base font-semibold text-white">Map layout could not load</h2>
        <p className="mt-1 text-sm text-slate-400">
          The map service did not return zones or cameras. Check the API and try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

function EmptyMapState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#090f1a]">
      <div className="w-[min(420px,calc(100%-2rem))] rounded-lg border border-white/10 bg-white/[0.03] p-5 text-center">
        <h2 className="text-base font-semibold text-white">No map topology yet</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add zones and cameras, then the interactive topology will appear here automatically.
        </p>
      </div>
    </div>
  );
}
