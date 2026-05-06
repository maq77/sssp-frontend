import { MapShell } from '@/components/map/v2/MapShell';

export function MapPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Security Map</h1>
          <p className="text-sm text-muted-foreground">
            Zones, camera topology, tracked persons, incidents, and live video in one real-time view.
          </p>
        </div>
      </div>

      <MapShell />
    </div>
  );
}

export default MapPage;
