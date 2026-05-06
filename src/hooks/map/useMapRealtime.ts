import { useEffect, useRef } from 'react';
import { signalRService } from '@/lib/signalr-service';
import { useMapStore } from '@/store/mapStore';
import type { WatchlistDetectedPayload } from '@/types';

const PRUNE_INTERVAL_MS = 5_000;
const IDLE_TIMEOUT_MS   = 5 * 60 * 1_000; // 5 min

export function useMapRealtime() {
  const store = useMapStore.getState;
  const pruneRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = signalRService;

    const unsubFace = s.on('ReceiveFaceRecognized', (env) => {
      if (env?.Data) store().ingestFaceRecognized(env.Data);
    });
    const unsubTracking = s.on('ReceiveCameraTracking', (env) => {
      if (env?.Data) store().ingestCameraTracking(env.Data);
    });
    const unsubReId = s.on('ReceiveCrossCameraReId', (env) => {
      if (env?.Data) store().ingestCrossCameraReId(env.Data);
    });
    const unsubStatus = s.on('ReceiveCameraStatus', (env) => {
      if (env?.Data) store().ingestCameraStatus(env.Data);
    });
    const unsubIncident = s.on('ReceiveIncident', (env) => {
      if (env?.Data) store().ingestIncident(env.Data);
    });
    const unsubWatchlist = s.on('Receive', (env) => {
      // Watchlist events come through the generic Receive channel
      if (env?.Topic === 'watchlist' && env?.Data) {
        store().ingestWatchlist(env.Data as WatchlistDetectedPayload);
      }
      if (env?.Topic === 'zone' && (env.Event === 'intrusion.v1' || env.Event === 'zone.intrusion.v1') && env.Data) {
        store().ingestZoneIntrusion(env.Data as Parameters<ReturnType<typeof store>['ingestZoneIntrusion']>[0]);
      }
      if (env?.Topic === 'camera' && env.Event === 'cross_camera_reid' && env.Data) {
        store().ingestCrossCameraReId(env.Data as Parameters<ReturnType<typeof store>['ingestCrossCameraReId']>[0]);
      }
    });
    const unsubExpired = s.on('ReceivePersonExpired', (env) => {
      if (env?.Data) store().ingestPersonExpired(env.Data);
    });

    // GC pulse
    pruneRef.current = setInterval(() => {
      store().prunePersons(IDLE_TIMEOUT_MS);
    }, PRUNE_INTERVAL_MS);

    return () => {
      unsubFace();
      unsubTracking();
      unsubReId();
      unsubStatus();
      unsubIncident();
      unsubWatchlist();
      unsubExpired();
      if (pruneRef.current) clearInterval(pruneRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
