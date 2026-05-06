import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { pushTrail } from '@/lib/map/trailRing';
import { getPersonPosition } from '@/lib/map/layoutGeometry';
import { IncidentSeverity, IncidentStatus, IncidentType } from '@/types';
import type {
  MapLayoutDto,
  MapZoneDto,
  MapCameraDto,
  MapPerson,
  MapCameraRuntime,
  MapIncident,
  MapFilters,
  MapViewMode,
  PersonStatus,
  FaceRecognizedPayload,
  CameraTrackingPayload,
  CrossCameraReIdPayload,
  CameraStatusPayload,
  IncidentResponse,
  WatchlistDetectedPayload,
  PersonExpiredPayload,
  ZoneIntrusionPayload,
  ActivePersonDto,
  ZoneType,
} from '@/types';

export interface Viewport { x: number; y: number; scale: number }

interface PanelState { persons: boolean; incidents: boolean; filters: boolean; minimap: boolean }

interface MapState {
  // ── topology (from TanStack Query, mirrored here for convenience) ──
  zones: MapZoneDto[];
  cameras: MapCameraDto[];

  // ── view ──
  viewMode: MapViewMode;
  viewport: Viewport;
  selectedFloorId: string | null;

  // ── selection ──
  selectedCameraId: number | null;
  selectedZoneId: number | null;
  selectedPersonId: string | null;
  followedPersonId: string | null;
  hoveredEntity: { type: 'zone' | 'camera' | 'person'; id: string | number } | null;

  // ── panels / ui ──
  panelsOpen: PanelState;
  liveFeedCameraId: number | null;

  // ── live data ──
  persons: Map<string, MapPerson>;
  cameraRuntime: Map<number, MapCameraRuntime>;
  incidents: Map<number, MapIncident>;
  filters: MapFilters;

  // ── actions ──
  setTopology(layout: MapLayoutDto): void;
  setViewMode(m: MapViewMode): void;
  setViewport(v: Partial<Viewport>): void;
  selectCamera(id: number | null): void;
  selectZone(id: number | null): void;
  selectPerson(id: string | null): void;
  followPerson(id: string | null): void;
  setHovered(h: MapState['hoveredEntity']): void;
  togglePanel(p: keyof PanelState): void;
  setLiveFeedCamera(id: number | null): void;
  setFloor(id: string | null): void;

  // ── realtime ingestion ──
  ingestFaceRecognized(p: FaceRecognizedPayload): void;
  ingestCameraTracking(p: CameraTrackingPayload): void;
  ingestCrossCameraReId(p: CrossCameraReIdPayload): void;
  ingestCameraStatus(p: CameraStatusPayload): void;
  ingestIncident(i: IncidentResponse): void;
  ingestWatchlist(p: WatchlistDetectedPayload): void;
  ingestZoneIntrusion(p: ZoneIntrusionPayload): void;
  ingestPersonExpired(p: PersonExpiredPayload): void;
  hydrateActivePersons(snapshot: ActivePersonDto[]): void;
  prunePersons(idleMs: number): void;
  setFilter<K extends keyof MapFilters>(k: K, v: MapFilters[K]): void;
}

function defaultFilters(): MapFilters {
  return {
    zoneTypes: new Set<ZoneType>(),
    personStatuses: new Set<PersonStatus>(),
    minSeverity: 1 as IncidentSeverity,
    hideOfflineCameras: false,
    floorId: null,
  };
}

function buildPerson(
  id: string,
  partial: Partial<MapPerson> & Pick<MapPerson, 'displayName' | 'status'>
): MapPerson {
  return {
    id,
    userId: null,
    faceProfileId: null,
    currentCameraId: null,
    currentZoneId: null,
    position: { x: 500, y: 500 },
    targetPosition: { x: 500, y: 500 },
    trail: [],
    avgSimilarity: 0,
    isWatchlist: false,
    firstSeenUtc: new Date().toISOString(),
    lastSeenUtc: new Date().toISOString(),
    lastEventAt: performance.now(),
    ...partial,
  };
}

function resolvePosition(
  cameraId: string | null | undefined,
  cameras: MapCameraDto[],
  zones: MapZoneDto[]
): { x: number; y: number } {
  return getPersonPosition(cameraId, cameras, zones);
}

function resolveZoneId(
  cameraId: string | null | undefined,
  cameras: MapCameraDto[]
): number | null {
  if (!cameraId) return null;
  const camIdNum = parseInt(cameraId, 10);
  if (!Number.isFinite(camIdNum)) return null;
  return cameras.find(c => c.Id === camIdNum)?.ZoneId ?? null;
}

export const useMapStore = create<MapState>()(
  subscribeWithSelector((set, get) => ({
    zones: [],
    cameras: [],
    viewMode: '2d',
    viewport: { x: 0, y: 0, scale: 0.7 },
    selectedFloorId: null,
    selectedCameraId: null,
    selectedZoneId: null,
    selectedPersonId: null,
    followedPersonId: null,
    hoveredEntity: null,
    panelsOpen: { persons: true, incidents: true, filters: false, minimap: true },
    liveFeedCameraId: null,
    persons: new Map(),
    cameraRuntime: new Map(),
    incidents: new Map(),
    filters: defaultFilters(),

    setTopology: (layout) => set({ zones: layout.Zones, cameras: layout.Cameras }),
    setViewMode: (m) => set({ viewMode: m }),
    setViewport: (v) => set(s => ({ viewport: { ...s.viewport, ...v } })),
    selectCamera: (id) => set({ selectedCameraId: id, selectedZoneId: null, selectedPersonId: null }),
    selectZone: (id) => set({ selectedZoneId: id, selectedCameraId: null, selectedPersonId: null }),
    selectPerson: (id) => set({ selectedPersonId: id }),
    followPerson: (id) => set({ followedPersonId: id }),
    setHovered: (h) => set({ hoveredEntity: h }),
    togglePanel: (p) => set(s => ({ panelsOpen: { ...s.panelsOpen, [p]: !s.panelsOpen[p] } })),
    setLiveFeedCamera: (id) => set({ liveFeedCameraId: id }),
    setFloor: (id) => set({ selectedFloorId: id }),

    ingestFaceRecognized: (p) => {
      const { cameras, zones, persons } = get();
      const personKey = p.UserId
        ? p.UserId
        : `track:${p.CameraId}:${p.TrackingId ?? 'anon'}`;
      const pos = resolvePosition(p.CameraId, cameras, zones);
      const existing = persons.get(personKey);
      const isUnknown = !p.UserId;
      const status: PersonStatus = isUnknown ? 'unknown' : 'known';

      const updated = new Map(persons);
      if (existing) {
        const trailed = pushTrail(existing.trail, existing.position.x, existing.position.y);
        updated.set(personKey, {
          ...existing,
          status: existing.isWatchlist ? 'watchlist' : status,
          currentCameraId: p.CameraId,
          currentZoneId: resolveZoneId(p.CameraId, cameras),
          targetPosition: pos,
          trail: trailed,
          avgSimilarity: p.Similarity,
          lastSeenUtc: p.TsUtc,
          lastEventAt: performance.now(),
        });
      } else {
        updated.set(personKey, buildPerson(personKey, {
          id: personKey,
          userId: p.UserId ?? null,
          faceProfileId: p.FaceProfileId ?? null,
          displayName: p.DisplayName ?? (isUnknown ? 'Unknown' : 'Person'),
          status,
          currentCameraId: p.CameraId,
          currentZoneId: resolveZoneId(p.CameraId, cameras),
          position: pos,
          targetPosition: pos,
          avgSimilarity: p.Similarity,
          firstSeenUtc: p.TsUtc,
          lastSeenUtc: p.TsUtc,
        }));
      }
      set({ persons: updated });
    },

    ingestCameraTracking: (p) => {
      const { persons, cameras, zones } = get();
      const personKey = p.UserId ?? p.DisplayName;
      if (!personKey) return;
      const pos = resolvePosition(p.CameraId, cameras, zones);
      const existing = persons.get(personKey);
      const updated = new Map(persons);
      if (existing) {
        updated.set(personKey, {
          ...existing,
          displayName: p.DisplayName ?? existing.displayName,
          currentCameraId: p.CameraId,
          currentZoneId: resolveZoneId(p.CameraId, cameras),
          targetPosition: pos,
          avgSimilarity: p.AvgSimilarity,
          lastSeenUtc: p.LastSeenUtc,
          lastEventAt: performance.now(),
        });
      }
      set({ persons: updated });
    },

    ingestCrossCameraReId: (p) => {
      const { cameras, zones, persons } = get();
      const personKey = p.UserId;
      const toPos = resolvePosition(p.ToCameraId, cameras, zones);
      const existing = persons.get(personKey);
      const updated = new Map(persons);
      if (existing) {
        const trailed = pushTrail(existing.trail, existing.position.x, existing.position.y);
        updated.set(personKey, {
          ...existing,
          targetPosition: toPos,
          trail: trailed,
          currentCameraId: p.ToCameraId,
          currentZoneId: resolveZoneId(p.ToCameraId, cameras),
          lastSeenUtc: p.TsUtc,
          lastEventAt: performance.now(),
        });
      } else {
        const fromPos = resolvePosition(p.FromCameraId, cameras, zones);
        updated.set(personKey, buildPerson(personKey, {
          id: personKey,
          userId: p.UserId,
          displayName: p.DisplayName,
          status: 'known',
          currentCameraId: p.ToCameraId,
          currentZoneId: resolveZoneId(p.ToCameraId, cameras),
          position: fromPos,
          targetPosition: toPos,
          trail: [{ x: fromPos.x, y: fromPos.y, t: performance.now() }],
          avgSimilarity: p.Similarity,
          lastSeenUtc: p.TsUtc,
        }));
      }
      set({ persons: updated });
    },

    ingestCameraStatus: (p) => {
      const cameraIdNum = parseInt(p.CameraId, 10);
      if (isNaN(cameraIdNum)) return;
      const { cameraRuntime } = get();
      const updated = new Map(cameraRuntime);
      updated.set(cameraIdNum, {
        cameraId: cameraIdNum,
        isOnline: p.IsOnline,
        hasActiveIncident: updated.get(cameraIdNum)?.hasActiveIncident ?? false,
        lastEventAt: performance.now(),
      });
      set({ cameraRuntime: updated });
    },

    ingestIncident: (i) => {
      if (!i.id) return;
      const { incidents } = get();
      const updated = new Map(incidents);
      // Try to resolve camera/zone from location payload
      updated.set(i.id, {
        id: i.id,
        cameraId: null,
        zoneId: null,
        severity: i.severity,
        type: i.type,
        title: i.title,
        status: i.status,
        timestamp: i.timestamp,
      });
      set({ incidents: updated });
    },

    ingestWatchlist: (p) => {
      const { persons, cameras, zones } = get();
      const personKey = p.UserId;
      const pos = resolvePosition(p.CameraId, cameras, zones);
      const existing = persons.get(personKey);
      const updated = new Map(persons);
      if (existing) {
        updated.set(personKey, {
          ...existing,
          isWatchlist: true,
          status: 'watchlist',
          currentCameraId: p.CameraId,
          currentZoneId: resolveZoneId(p.CameraId, cameras),
          targetPosition: pos,
          lastSeenUtc: p.TsUtc,
          lastEventAt: performance.now(),
        });
      } else {
        updated.set(personKey, buildPerson(personKey, {
          id: personKey,
          userId: p.UserId,
          faceProfileId: p.FaceProfileId,
          displayName: p.FullName ?? p.UserName ?? 'Watchlist Person',
          status: 'watchlist',
          isWatchlist: true,
          currentCameraId: p.CameraId,
          currentZoneId: resolveZoneId(p.CameraId, cameras),
          position: pos,
          targetPosition: pos,
          avgSimilarity: p.Similarity,
          firstSeenUtc: p.TsUtc,
          lastSeenUtc: p.TsUtc,
        }));
      }
      set({ persons: updated });
    },

    ingestZoneIntrusion: (p) => {
      const { zones, persons, incidents } = get();
      const parsedZoneId = parseInt(p.ZoneId, 10);
      const zoneId = Number.isFinite(parsedZoneId)
        ? parsedZoneId
        : zones.find(z => z.ZoneCode === p.ZoneId || z.Name === p.ZoneName)?.Id ?? null;

      const severity = p.UnauthorizedAccess
        ? IncidentSeverity.High
        : p.AlertLevel?.toLowerCase() === 'critical'
          ? IncidentSeverity.Critical
          : IncidentSeverity.Medium;

      const incidentKey = Math.abs(
        `${p.CameraId}:${p.ZoneId}:${p.TsUtc}`.split('').reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0)
      );

      const nextIncidents = new Map(incidents);
      nextIncidents.set(incidentKey, {
        id: incidentKey,
        cameraId: parseInt(p.CameraId, 10) || null,
        zoneId,
        severity,
        type: IncidentType.UnauthorizedAccess,
        title: p.UnauthorizedAccess ? 'Unauthorized zone entry' : 'Zone activity',
        status: IncidentStatus.Open,
        timestamp: p.TsUtc,
      });

      const nextPersons = new Map(persons);
      if (p.UnauthorizedAccess) {
        nextPersons.forEach((person, key) => {
          const sameCamera = person.currentCameraId === p.CameraId;
          const sameZone = zoneId !== null && person.currentZoneId === zoneId;
          if (sameCamera || sameZone) {
            nextPersons.set(key, {
              ...person,
              status: 'unauthorized',
              lastEventAt: performance.now(),
            });
          }
        });
      }

      set({ incidents: nextIncidents, persons: nextPersons });
    },

    ingestPersonExpired: (p) => {
      const { persons } = get();
      const updated = new Map(persons);
      updated.delete(p.UserId);
      set({ persons: updated });
    },

    hydrateActivePersons: (snapshot) => {
      const { cameras, zones } = get();
      const updated = new Map<string, MapPerson>();
      snapshot.forEach(s => {
        const key = s.UserId;
        const pos = resolvePosition(s.LastCameraId, cameras, zones);
        updated.set(key, buildPerson(key, {
          id: key,
          userId: s.UserId,
          faceProfileId: s.FaceProfileId,
          displayName: s.DisplayName ?? s.UserName ?? 'Person',
          status: 'known',
          currentCameraId: s.LastCameraId ?? null,
          currentZoneId: s.LastZoneId ? parseInt(s.LastZoneId, 10) || resolveZoneId(s.LastCameraId, cameras) : resolveZoneId(s.LastCameraId, cameras),
          position: pos,
          targetPosition: pos,
          avgSimilarity: s.AvgSimilarity,
          firstSeenUtc: s.FirstSeenUtc,
          lastSeenUtc: s.LastSeenUtc,
        }));
      });
      set({ persons: updated });
    },

    prunePersons: (idleMs) => {
      const { persons } = get();
      const now = performance.now();
      const updated = new Map(persons);
      let changed = false;
      updated.forEach((p, k) => {
        if (now - p.lastEventAt > idleMs) { updated.delete(k); changed = true; }
      });
      if (changed) set({ persons: updated });
    },

    setFilter: (k, v) => set(s => ({ filters: { ...s.filters, [k]: v } })),
  }))
);
