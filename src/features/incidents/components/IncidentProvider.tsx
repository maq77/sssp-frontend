/**
 * IncidentProvider — mounted once at app root.
 * - Unlocks Web Audio on first user gesture.
 * - Subscribes to global SignalR events and enqueues incidents.
 * - Renders the IncidentStack.
 */

import { useEffect } from "react";
import signalRService from "@/lib/signalr-service";
import { ensureAudioContext } from "@/features/incidents/audio/incidentBeep";
import { useIncidentStore } from "@/store/useIncidentStore";
import { IncidentStack } from "./IncidentStack";
import type {
  RealtimeEnvelope,
  WatchlistDetectedPayload,
  BehaviorAlertPayload,
  BBoxTrackPayload,
} from "@/types";

function getAlertSeverity(alertLevel?: string): "info" | "warning" | "critical" {
  const l = (alertLevel ?? "").toLowerCase();
  if (l === "critical") return "critical";
  if (l === "warning") return "warning";
  return "info";
}

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const enqueue = useIncidentStore((s) => s.enqueue);

  // Unlock Web Audio on first interaction
  useEffect(() => {
    const unlock = () => {
      ensureAudioContext();
      document.removeEventListener("pointerdown", unlock);
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  // Subscribe to incident-class SignalR events
  useEffect(() => {
    const rawHandler = (env: RealtimeEnvelope) => {
      const topic = String(env.Topic ?? "").toLowerCase();
      const event = String(env.Event ?? "").toLowerCase();

      // Watchlist hit
      if (topic === "security" && (event === "watchlist.detected.v1" || event === "detected.v1")) {
        const p = env.Data as WatchlistDetectedPayload;
        enqueue({
          type: "watchlist_hit",
          severity: "critical",
          cameraId: String(p.CameraId),
          cameraName: `Camera ${p.CameraId}`,
          timestamp: Date.now(),
          personName: p.FullName ?? p.UserName ?? null,
          faceCropUrl: p.SnapshotUrl ?? p.ProfilePhotoUrl ?? null,
          behaviorLabel: null,
          trackId: typeof p.TrackId === "number" ? p.TrackId : null,
          message: p.WatchlistReason ?? "Person on watchlist detected",
          autoDismissMs: Infinity,
        });
        return;
      }

      // Behavior alerts
      if (
        topic === "behavior" &&
        (event === "alert.v1" || event === "behavior.alert.v1")
      ) {
        const p = env.Data as BehaviorAlertPayload;
        const action = (p.ActionType ?? "").toLowerCase();
        const isFighting = action.includes("fight");
        const isWeapon = action.includes("weapon");
        const isLoitering = action.includes("loiter");

        if (isFighting || isWeapon) {
          enqueue({
            type: isWeapon ? "behavior_weapon" : "behavior_fighting",
            severity: "critical",
            cameraId: String(p.CameraId),
            cameraName: `Camera ${p.CameraId}`,
            timestamp: Date.now(),
            personName: null,
            faceCropUrl: null,
            behaviorLabel: p.ActionType,
            trackId: typeof p.TrackId === "number" ? p.TrackId : null,
            message: p.AlertMessage ?? `${p.ActionType} detected`,
            autoDismissMs: Infinity,
          });
        } else if (isLoitering && (p.Confidence ?? 0) > 0.6) {
          enqueue({
            type: "behavior_loitering",
            severity: "warning",
            cameraId: String(p.CameraId),
            cameraName: `Camera ${p.CameraId}`,
            timestamp: Date.now(),
            personName: null,
            faceCropUrl: null,
            behaviorLabel: p.ActionType,
            trackId: typeof p.TrackId === "number" ? p.TrackId : null,
            message: p.AlertMessage ?? "Loitering detected",
            autoDismissMs: 30_000,
          });
        }
        return;
      }

      // Zone breach
      if (topic === "zone" && (event === "intrusion.v1" || event === "zone.intrusion.v1")) {
        const p = env.Data as { CameraId?: string; ZoneName?: string; AlertLevel?: string; UnauthorizedAccess?: boolean };
        if (p.UnauthorizedAccess) {
          enqueue({
            type: "zone_breach",
            severity: getAlertSeverity(p.AlertLevel),
            cameraId: String(p.CameraId ?? ""),
            cameraName: `Camera ${p.CameraId ?? ""}`,
            timestamp: Date.now(),
            personName: null,
            faceCropUrl: null,
            behaviorLabel: null,
            trackId: null,
            message: `Unauthorized access in ${p.ZoneName ?? "zone"}`,
            autoDismissMs: 30_000,
          });
        }
        return;
      }

      // BBox track alerts (watchlist/critical severity from AI)
      if (topic === "faces" && event === "bbox.track.v1") {
        const p = env.Data as BBoxTrackPayload;
        if (p.Severity === "critical" && p.PersonName) {
          enqueue({
            type: "watchlist_hit",
            severity: "critical",
            cameraId: String(p.CameraId),
            cameraName: `Camera ${p.CameraId}`,
            timestamp: Date.now(),
            personName: p.PersonName,
            faceCropUrl: null,
            behaviorLabel: p.BehaviorLabel ?? null,
            trackId: p.TrackId,
            message: "Watchlist person detected",
            autoDismissMs: Infinity,
          });
        }
      }
    };

    signalRService.on("Receive", rawHandler);
    return () => signalRService.off("Receive", rawHandler);
  }, [enqueue]);

  return (
    <>
      {children}
      <IncidentStack />
    </>
  );
}
