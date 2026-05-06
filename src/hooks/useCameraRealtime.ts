import { useEffect } from "react";
import signalRService from "@/lib/signalr-service";
import {
  RealtimeEnvelope,
  FaceRecognizedPayload,
  CameraStatusPayload,
  ObjectDetectedPayload,
  BehaviorAlertPayload,
  BoundingBox,
  ZoneIntrusionPayload,
  AnomalyDetectedPayload,
  WatchlistDetectedPayload,
  DeepStreamReadyPayload,
  DeepStreamBehaviorAlertPayload,
  SuspicionAlertPayload,
  BBoxTrackPayload,
} from "@/types";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? value as AnyRecord : {};
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0;
}

function normalizeBBox(value: unknown): BoundingBox {
  const box = asRecord(value);
  return {
    X: num(box.X ?? box.x),
    Y: num(box.Y ?? box.y),
    Width: num(box.Width ?? box.width ?? box.W ?? box.w),
    Height: num(box.Height ?? box.height ?? box.H ?? box.h),
  };
}

function normalizeFacePayload(payload: FaceRecognizedPayload): FaceRecognizedPayload {
  const raw = asRecord(payload);
  return {
    ...payload,
    BBox: normalizeBBox(raw.BBox ?? raw.bbox),
  };
}

function normalizeBehaviorPayload(payload: BehaviorAlertPayload): BehaviorAlertPayload {
  const raw = asRecord(payload);
  return {
    ...payload,
    BBox: normalizeBBox(raw.BBox ?? raw.bbox),
  };
}

function normalizeDeepStreamBehaviorPayload(payload: DeepStreamBehaviorAlertPayload): BehaviorAlertPayload {
  const raw = asRecord(payload);
  const alertMessage = raw.AlertMessage ?? raw.alertMessage;

  return {
    CameraId: String(raw.CameraDbId ?? raw.cameraDbId ?? raw.CameraId ?? raw.cameraId ?? ""),
    StreamKey: String(raw.StreamKey ?? raw.streamKey ?? ""),
    FrameId: String(raw.FrameId ?? raw.frameId ?? ""),
    TrackId: num(raw.TrackId ?? raw.trackId),
    ActionType: String(raw.Action ?? raw.action ?? raw.ActionType ?? raw.actionType ?? ""),
    Confidence: num(raw.Confidence ?? raw.confidence),
    AlertLevel: String(raw.AlertLevel ?? raw.alertLevel ?? "Info"),
    AlertMessage: typeof alertMessage === "string" ? alertMessage : null,
    BBox: normalizeBBox(raw.Bbox ?? raw.bbox ?? raw.BBox),
    SourceWidth: null,
    SourceHeight: null,
    TsUtc: String(raw.TsUtc ?? raw.tsUtc ?? new Date().toISOString()),
  };
}

export function useCameraRealtime(params: {
  onFace?: (payload: FaceRecognizedPayload) => void;
  onStatus?: (payload: CameraStatusPayload) => void;
  onObject?: (payload: ObjectDetectedPayload) => void;
  onBehavior?: (payload: BehaviorAlertPayload) => void;
  onZone?: (payload: ZoneIntrusionPayload) => void;
  onAnomaly?: (payload: AnomalyDetectedPayload) => void;
  onWatchlist?: (payload: WatchlistDetectedPayload) => void;
  onPipelineReady?: (payload: DeepStreamReadyPayload) => void;
  onSuspicionAlert?: (payload: SuspicionAlertPayload) => void;
  onBBoxTrack?: (payload: BBoxTrackPayload) => void;
}) {
  const {
    onFace,
    onStatus,
    onObject,
    onBehavior,
    onZone,
    onAnomaly,
    onWatchlist,
    onPipelineReady,
    onSuspicionAlert,
    onBBoxTrack,
  } = params;

  useEffect(() => {
    const faceHandler = (env: RealtimeEnvelope<FaceRecognizedPayload>) => onFace?.(normalizeFacePayload(env.Data));
    const statusHandler = (env: RealtimeEnvelope<CameraStatusPayload>) => onStatus?.(env.Data);
    const pipelineReadyHandler = (env: RealtimeEnvelope<DeepStreamReadyPayload>) => onPipelineReady?.(env.Data);

    // Typed handler for DeepStream behavior alerts (topic="deepstream", event="behavior_alert")
    const behaviorAlertHandler = (env: RealtimeEnvelope<DeepStreamBehaviorAlertPayload>) => {
      if (!onBehavior) return;
      const p = env.Data;
      // Map DeepStreamBehaviorAlertPayload → BehaviorAlertPayload
      onBehavior({
        CameraId: String(p.CameraDbId),
        StreamKey: p.StreamKey,
        FrameId: String(p.FrameId),
        TrackId: p.TrackId,
        ActionType: p.Action,
        Confidence: p.Confidence,
        AlertLevel: p.AlertLevel,
        AlertMessage: p.AlertMessage ?? null,
        BBox: normalizeBBox(p.Bbox),
        SourceWidth: null,
        SourceHeight: null,
        TsUtc: p.TsUtc,
      });
    };

    const rawHandler = (env: RealtimeEnvelope) => {
      const topic = String(env.Topic ?? "").toLowerCase();
      const event = String(env.Event ?? "").toLowerCase();

      if (
        topic === "faces"
        && (
          event === "recognized"
          || event === "unknown"
          || event === "recognized.v1"
          || event === "unknown.v1"
          || event === "face.recognized.v1"
          || event === "face.unknown.v1"
          || event === "faces.recognized.v1"
          || event === "faces.unknown.v1"
        )
      ) {
        onFace?.(normalizeFacePayload(env.Data as FaceRecognizedPayload));
        return;
      }

      // BL-generated behavior alerts (topic="behavior", event="alert.v1" or "behavior.alert.v1")
      if (topic === "behavior" && (event === "alert.v1" || event === "behavior.alert.v1")) {
        onBehavior?.(normalizeBehaviorPayload(env.Data as BehaviorAlertPayload));
        return;
      }

      if (topic === "deepstream" && event === "behavior_alert") {
        onBehavior?.(normalizeDeepStreamBehaviorPayload(env.Data as DeepStreamBehaviorAlertPayload));
        return;
      }

      if (topic === "object" && (event === "detected.v1" || event === "object.detected.v1")) {
        onObject?.(env.Data as ObjectDetectedPayload);
        return;
      }

      if (topic === "zone" && (event === "intrusion.v1" || event === "zone.intrusion.v1")) {
        onZone?.(env.Data as ZoneIntrusionPayload);
        return;
      }

      if (topic === "anomaly" && (event === "detected.v1" || event === "anomaly.detected.v1")) {
        onAnomaly?.(env.Data as AnomalyDetectedPayload);
        return;
      }

      if (topic === "security" && (event === "watchlist.detected.v1" || event === "detected.v1")) {
        onWatchlist?.(env.Data as WatchlistDetectedPayload);
        return;
      }

      // High-frequency bbox track events — feed into useBBoxPredictor
      if (topic === "faces" && event === "bbox.track.v1") {
        onBBoxTrack?.(env.Data as BBoxTrackPayload);
        return;
      }
    };

    const suspicionAlertHandler = (env: RealtimeEnvelope<SuspicionAlertPayload>) =>
      onSuspicionAlert?.(env.Data);

    const bboxTrackHandler = (env: RealtimeEnvelope<BBoxTrackPayload>) => onBBoxTrack?.(env.Data);

    signalRService.on("ReceiveFaceRecognized", faceHandler);
    signalRService.on("ReceiveCameraStatus", statusHandler);
    signalRService.on("ReceiveDeepStreamReady", pipelineReadyHandler);
    signalRService.on("ReceiveBehaviorAlert", behaviorAlertHandler);
    signalRService.on("ReceiveSuspicionAlert", suspicionAlertHandler);
    signalRService.on("ReceiveBBoxTrack", bboxTrackHandler);
    signalRService.on("Receive", rawHandler);

    return () => {
      signalRService.off("ReceiveFaceRecognized", faceHandler);
      signalRService.off("ReceiveCameraStatus", statusHandler);
      signalRService.off("ReceiveDeepStreamReady", pipelineReadyHandler);
      signalRService.off("ReceiveBehaviorAlert", behaviorAlertHandler);
      signalRService.off("ReceiveSuspicionAlert", suspicionAlertHandler);
      signalRService.off("ReceiveBBoxTrack", bboxTrackHandler);
      signalRService.off("Receive", rawHandler);
    };
  }, [onFace, onStatus, onObject, onBehavior, onZone, onAnomaly, onWatchlist, onPipelineReady, onSuspicionAlert, onBBoxTrack]);
}
