import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

import cameraApi from "@/lib/api/cameraApi";
import securityAlertApi from "@/lib/api/securityAlertApi";
import signalRService from "@/lib/signalr-service";
import { SuspicionAlertBanner } from "@/components/abp/SuspicionAlertBanner";
import { ManualLabelPanel } from "@/components/abp/ManualLabelPanel";
// import { useWhepStream } from "@/hooks/useWhepStream";
import { useWhepStream2 as useWhepStream } from "@/hooks/useWhepStream2";
import { useCameraRuntime } from "@/hooks/useCameraRuntime";
import { useCameraRealtime } from "@/hooks/useCameraRealtime";
import { useBBoxPredictor } from "@/hooks/useBBoxPredictor";
import { getRuntimeConfig } from "@/lib/config/runtimeConfig";
import {
  type CameraExecutionMode,
  getDefaultCameraExecutionMode,
  setDefaultCameraExecutionMode,
} from "@/lib/camera-execution-mode";

import type {
  CameraDTO,
  CameraStreamStatus,
  FaceRecognizedPayload,
  CameraStatusPayload,
  ObjectDetectedPayload,
  UpdateCameraRequest,
  BehaviorAlertPayload,
  ZoneIntrusionPayload,
  AnomalyDetectedPayload,
  WatchlistDetectedPayload,
  CameraSecurityRealtimeEvent,
  CameraOverlayEvent,
  SecurityAlert,
  DeepStreamReadyPayload,
  PipelineReadyState,
  SuspicionAlertPayload,
  BBoxTrackPayload,
} from "@/types";
import type { CameraEditForm, CameraRuntimeDto, RuntimePoint, TabKey } from "@/types/camera";
import { fmtMs, fmtUptime, safeNum, secondsAgo } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { CameraHeader } from "@/components/cameras/CameraHeader";
import { CameraTabs } from "@/components/cameras/CameraTabs";
import { CameraKpis } from "@/components/cameras/CameraKpis";
import { CameraLivePanel } from "@/components/cameras/CameraLivePanel";
import { CameraMetricsPanel } from "@/components/cameras/CameraMetricsPanel";
import { CameraEventsPanel } from "@/components/cameras/CameraEventsPanel";
import { CameraSettingsPanel } from "@/components/cameras/CameraSettingsPanel";
import { CameraEditDialog } from "@/components/cameras/CameraEditDialog";

type OverlayEntry = CameraOverlayEvent & {
  lastSeenAt: number;
  behaviorSeenAt?: number;
};

function buildOverlayKey(
  kind: CameraOverlayEvent["kind"],
  trackId: string | number | null | undefined,
  classId: string | number,
  frameId?: string | number | null
) {
  const normalizedTrackId = typeof trackId === "string" ? trackId.trim() : trackId;
  const hasStableTrack =
    normalizedTrackId !== null
    && normalizedTrackId !== undefined
    && normalizedTrackId !== ""
    && normalizedTrackId !== -1
    && normalizedTrackId !== "-1";

  if (hasStableTrack) {
    return `${kind}:${normalizedTrackId}:${classId}`;
  }

  return `${kind}:tmp:${frameId ?? "na"}:${classId}`;
}

function overlayListsMatch(prev: CameraOverlayEvent[], next: OverlayEntry[]) {
  if (prev.length !== next.length) {
    return false;
  }

  for (let i = 0; i < prev.length; i += 1) {
    if (prev[i] !== next[i]) {
      return false;
    }
  }

  return true;
}

function maxSeverity(
  a?: "info" | "warning" | "critical",
  b?: "info" | "warning" | "critical",
): "info" | "warning" | "critical" {
  const rank = (s?: string) => (s === "critical" ? 2 : s === "warning" ? 1 : 0);
  return rank(a) >= rank(b) ? (a ?? "info") : (b ?? "info");
}

function normalizeTrackId(trackId: string | number | null | undefined): string | null {
  const normalized = typeof trackId === "string" ? trackId.trim() : trackId;
  if (
    normalized === null
    || normalized === undefined
    || normalized === ""
    || normalized === -1
    || normalized === "-1"
  ) {
    return null;
  }

  return String(normalized);
}

function buildPersonTrackKey(trackId: string | number | null | undefined): string | null {
  const normalized = normalizeTrackId(trackId);
  return normalized ? `person:track:${normalized}` : null;
}

function bboxArea(bbox?: { Width: number; Height: number } | null) {
  return Math.max(0, bbox?.Width ?? 0) * Math.max(0, bbox?.Height ?? 0);
}

function bboxAssociationScore(
  a?: { X: number; Y: number; Width: number; Height: number } | null,
  b?: { X: number; Y: number; Width: number; Height: number } | null,
) {
  if (!a || !b || a.Width <= 0 || a.Height <= 0 || b.Width <= 0 || b.Height <= 0) {
    return 0;
  }

  const ax2 = a.X + a.Width;
  const ay2 = a.Y + a.Height;
  const bx2 = b.X + b.Width;
  const by2 = b.Y + b.Height;
  const interW = Math.max(0, Math.min(ax2, bx2) - Math.max(a.X, b.X));
  const interH = Math.max(0, Math.min(ay2, by2) - Math.max(a.Y, b.Y));
  const smallerArea = Math.min(bboxArea(a), bboxArea(b));
  return smallerArea > 0 ? (interW * interH) / smallerArea : 0;
}

function buildObjectOverlayEvent(payload: ObjectDetectedPayload): CameraOverlayEvent {
  return {
    kind: "object",
    id: buildOverlayKey("object", payload.TrackId, payload.ClassId, payload.FrameId),
    label: payload.ClassLabel,
    trackId: payload.TrackId,
    severity: "info",
    bbox: payload.BBox,
    confidence: payload.Confidence,
    sourceWidth: payload.SourceWidth ?? null,
    sourceHeight: payload.SourceHeight ?? null,
  };
}

function buildAnomalyOverlayEvent(payload: AnomalyDetectedPayload): CameraOverlayEvent {
  return {
    kind: "anomaly",
    id: buildOverlayKey("anomaly", payload.TrackId, payload.AnomalyType, payload.FrameId),
    label: payload.AnomalyType,
    trackId: payload.TrackId,
    severity: payload.AlertLevel?.toLowerCase() === "critical" ? "critical" : "warning",
    bbox: payload.BBox,
    confidence: payload.Confidence,
    sourceWidth: payload.SourceWidth ?? null,
    sourceHeight: payload.SourceHeight ?? null,
  };
}

function CameraDetailsPageComponent() {
  const nav = useNavigate();
  const { id } = useParams();
  const cameraId = Number(id);

  // Single mount log per component
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      console.log('[CameraDetailsPage] 🎬 Component mounted, Camera ID:', cameraId);
      mountedRef.current = true;
    }
  }, [cameraId]);

  const [tab, setTab] = useState<TabKey>("live");
  const [camera, setCamera] = useState<CameraDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamWanted, setStreamWanted] = useState(false);
  const [streamStatus, setStreamStatus] = useState<CameraStreamStatus | null>(null);


  const [history, setHistory] = useState<RuntimePoint[]>([]);
  const [detections, setDetections] = useState<FaceRecognizedPayload[]>([]);
  const [securityEvents, setSecurityEvents] = useState<CameraSecurityRealtimeEvent[]>([]);
  const [overlayEvents, setOverlayEvents] = useState<CameraOverlayEvent[]>([]);
  const [lastDetection, setLastDetection] = useState<FaceRecognizedPayload | undefined>(undefined);
  const [openAlerts, setOpenAlerts] = useState<SecurityAlert[]>([]);
  const [activeSuspicionAlerts, setActiveSuspicionAlerts] = useState<SuspicionAlertPayload[]>([]);
  const [mode, setMode] = useState<CameraExecutionMode>(() => getDefaultCameraExecutionMode());
  const overlayMapRef = useRef<Map<string, OverlayEntry>>(new Map());
  // Per-person overlay state keyed by canonical identity key (person:user:X, person:profile:X, person:track:X)
  const personOverlayMapRef = useRef<Map<string, OverlayEntry>>(new Map());
  // DeepStream TrackId (string) → canonical person key — cleared on camera change
  const trackIdToIdentityRef = useRef<Map<string, string>>(new Map());
  // Last known source dimensions from any face event — fallback for behavior overlay scaling
  const lastKnownSourceRef = useRef<{ width: number; height: number } | null>(null);
  const lastOverlayCommitAtRef = useRef(0);
  const realtimeToastAtRef = useRef<Map<string, number>>(new Map());
  const realtimeEventSeenAtRef = useRef<Map<string, number>>(new Map());

  const [online, setOnline] = useState(false);
  const [fps, setFps] = useState(0);
  const [annotatedMode, setAnnotatedMode] = useState(false);
  const [pipelineReadyState, setPipelineReadyState] = useState<PipelineReadyState | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<CameraEditForm>({
    name: "",
    rtspUrl: "",
    isActive: true,
    capabilities: 7,
    recognitionMode: 0,
    matchThresholdOverride: null,
    inferenceMode: "full_analytics",
    sourceProfile: "auto",
    expectedWidth: null,
    expectedHeight: null,
    expectedFps: null,
    useFace: true,
    useObject: true,
    useBehavior: true,
    zoneId: null,
  });

  const { data: runtimeRaw, errorMessage: runtimeError } = useCameraRuntime(cameraId, 2000);
  const runtime = useMemo(() => runtimeRaw as unknown as CameraRuntimeDto | undefined, [runtimeRaw]);

  // Memoize config to prevent re-initialization
  const config = useMemo(() => getRuntimeConfig(), []);
  const { whepBase } = config;

  // WebRTC URL construction — derived only from stable camera config, not polled streamStatus.
  // Removing streamStatus from deps prevents URL churn on every 3s poll cycle.
  const webrtcUrl = useMemo(() => {
    if (!camera) return null;

    const streamKey = camera.StreamKey || `cam-${cameraId}`;
    const base = whepBase ? whepBase.replace(/\/+$/, "") : "";

    if (annotatedMode) {
      const annotatedPath = `cameras/${streamKey}/annotated`;
      const url = base ? `${base}/${annotatedPath}/whep` : `/${annotatedPath}/whep`;
      console.log('[CameraDetailsPage] 🎨 WHEP URL (annotated):', url);
      return url;
    }

    if (base) {
      const url = `${base}/${streamKey}/whep`;
      console.log('[CameraDetailsPage] 🌐 WHEP URL (absolute):', url);
      return url;
    }

    const url = `/${streamKey}/whep`;
    console.log('[CameraDetailsPage] 🌐 WHEP URL (proxied):', url);
    return url;
  }, [annotatedMode, camera, cameraId, whepBase]);

  // enableWhep no longer depends on canStartWhep (derived from polled streamStatus) so that a
  // transient probe failure doesn't kill the live connection every 3 seconds. The WhepController
  // manages its own reconnect loop and will recover when the stream becomes ready.
  const enableWhep = tab === "live"
    && !!camera
    && camera.isActive
    && streamWanted;

  // WHEP stream hook
  const {
    videoRef,
    status: whepStatusRaw,
    error: whepError,
    frameFresh,
    restart: restartWhep,
    stop: stopWhep,
  } = useWhepStream(webrtcUrl, {
    enabled: enableWhep,
    debug: true,
    pauseWhenHidden: false,
    cameraId: String(cameraId),
  });
  
  const whepStatus = whepStatusRaw; 

  
  // Log WHEP status changes (debounced)
  const lastWhepStatusRef = useRef<string>("");
  useEffect(() => {
    const statusKey = `${whepStatus}-${whepError || 'none'}`;
    if (statusKey !== lastWhepStatusRef.current) {
      console.log('[CameraDetailsPage] 📡 WHEP Status:', {
        status: whepStatus,
        error: whepError || 'none',
        tab,
        enabled: tab === "live" && !!camera,
      });
      lastWhepStatusRef.current = statusKey;
    }
  }, [whepStatus, whepError, tab, camera]);

  const upsertOverlay = useCallback((event: CameraOverlayEvent) => {
    overlayMapRef.current.set(event.id, {
      ...event,
      lastSeenAt: performance.now(),
    });
  }, []);

  const showRealtimeToast = useCallback((
    key: string,
    kind: "success" | "warning" | "info",
    title: string,
    description?: string,
    cooldownMs = 5000,
  ) => {
    const now = Date.now();
    const lastShownAt = realtimeToastAtRef.current.get(key) ?? 0;
    if (now - lastShownAt < cooldownMs) return;

    realtimeToastAtRef.current.set(key, now);
    const options = description ? { description } : undefined;

    if (kind === "success") {
      toast.success(title, options);
    } else if (kind === "warning") {
      toast.warning(title, options);
    } else {
      toast.info(title, options);
    }
  }, []);

  const shouldProcessRealtimeEvent = useCallback((key: string, cooldownMs = 1000) => {
    const now = Date.now();
    const lastSeenAt = realtimeEventSeenAtRef.current.get(key) ?? 0;
    if (now - lastSeenAt < cooldownMs) return false;

    realtimeEventSeenAtRef.current.set(key, now);
    if (realtimeEventSeenAtRef.current.size > 512) {
      for (const [entryKey, entrySeenAt] of realtimeEventSeenAtRef.current) {
        if (now - entrySeenAt > 10_000) {
          realtimeEventSeenAtRef.current.delete(entryKey);
        }
      }
    }

    return true;
  }, []);

  const rememberSourceDimensions = useCallback((width?: number | null, height?: number | null) => {
    if (
      typeof width === "number"
      && Number.isFinite(width)
      && width > 0
      && typeof height === "number"
      && Number.isFinite(height)
      && height > 0
    ) {
      lastKnownSourceRef.current = { width, height };
    }
  }, []);

  const getSourceDimensions = useCallback((width?: number | null, height?: number | null) => {
    rememberSourceDimensions(width, height);
    return {
      width: width ?? lastKnownSourceRef.current?.width ?? streamStatus?.expectedWidth ?? null,
      height: height ?? lastKnownSourceRef.current?.height ?? streamStatus?.expectedHeight ?? null,
    };
  }, [rememberSourceDimensions, streamStatus?.expectedHeight, streamStatus?.expectedWidth]);

  // Real-time detection handler - stable reference
  const handleFaceDetection = useCallback(
    (payload: FaceRecognizedPayload) => {
      if (String(payload.CameraId) !== String(cameraId)) return;
      const eventKey = `face:${payload.CameraId}:${payload.FrameId}:${payload.TrackingId ?? ""}:${payload.UserId ?? payload.FaceProfileId ?? "unknown"}`;
      if (!shouldProcessRealtimeEvent(eventKey)) return;

      console.log('[CameraDetailsPage] 👤 Face detected:', {
        displayName: payload.DisplayName || 'Unknown',
        confidence: (payload.Confidence * 100).toFixed(1) + '%',
        isUnknown: !payload.UserId,
      });

      const now = performance.now();
      const normalizedTrackId = normalizeTrackId(payload.TrackingId);
      const trackKey = buildPersonTrackKey(payload.TrackingId);
      let inferredKey: string | undefined;
      let inferredTrackId = normalizedTrackId;

      if (!inferredTrackId) {
        let bestScore = 0;
        for (const [key, entry] of personOverlayMapRef.current) {
          const age = now - entry.lastSeenAt;
          if (age > 5000) continue;

          const score = bboxAssociationScore(payload.BBox, entry.bbox);
          if (score > bestScore) {
            bestScore = score;
            inferredKey = key;
            inferredTrackId = normalizeTrackId(entry.trackId);
          }
        }

        if (bestScore < 0.35) {
          inferredKey = undefined;
          inferredTrackId = null;
        }
      }

      // Canonical person key: prefer stable UserId > FaceProfileId > TrackId.
      const canonicalKey = payload.UserId
        ? `person:user:${payload.UserId}`
        : payload.FaceProfileId
          ? `person:profile:${payload.FaceProfileId}`
          : trackKey ?? inferredKey ?? `person:unknown:${cameraId}`;

      // Register DeepStream TrackId -> canonical key so behavior events can be merged.
      if (inferredTrackId) {
        trackIdToIdentityRef.current.set(inferredTrackId, canonicalKey);
      }

      // Preserve/migrate a behavior-first or unknown-first person box.
      const existing = personOverlayMapRef.current.get(canonicalKey)
        ?? (inferredKey ? personOverlayMapRef.current.get(inferredKey) : undefined)
        ?? (trackKey ? personOverlayMapRef.current.get(trackKey) : undefined);
      const behaviorFresh = existing?.behaviorSeenAt != null && now - existing.behaviorSeenAt < 10000;
      const preservedBehavior = behaviorFresh ? existing?.sublabel : undefined;
      const source = getSourceDimensions(payload.SourceWidth, payload.SourceHeight);
      const faceSeverity: "info" | "warning" = payload.UserId ? "info" : "warning";
      const shouldKeepBehaviorBox = !!preservedBehavior && bboxArea(existing?.bbox) > bboxArea(payload.BBox);

      if (trackKey && trackKey !== canonicalKey) {
        personOverlayMapRef.current.delete(trackKey);
        for (const key of overlayMapRef.current.keys()) {
          if (inferredTrackId && key.startsWith(`behavior:${inferredTrackId}:`)) {
            overlayMapRef.current.delete(key);
          }
        }
      }
      if (inferredKey && inferredKey !== canonicalKey) {
        personOverlayMapRef.current.delete(inferredKey);
      }

      personOverlayMapRef.current.set(canonicalKey, {
        kind: "face",
        id: canonicalKey,
        label: payload.DisplayName || (payload.UserId ? "Recognized person" : "Unknown person"),
        sublabel: preservedBehavior,
        trackId: inferredTrackId,
        severity: maxSeverity(faceSeverity, existing?.severity),
        bbox: shouldKeepBehaviorBox && existing ? existing.bbox : payload.BBox,
        confidence: payload.Confidence,
        similarity: payload.Similarity,
        sourceWidth: (shouldKeepBehaviorBox ? existing?.sourceWidth : source.width) ?? source.width,
        sourceHeight: (shouldKeepBehaviorBox ? existing?.sourceHeight : source.height) ?? source.height,
        lastSeenAt: now,
        behaviorSeenAt: behaviorFresh ? existing?.behaviorSeenAt : undefined,
      });

      const displayPayload = inferredTrackId && !payload.TrackingId
        ? { ...payload, TrackingId: inferredTrackId }
        : payload;
      setLastDetection(displayPayload);
      setDetections((prev) => [displayPayload, ...prev].slice(0, 200));

      const isUnknownFace = !payload.UserId;
      const confidence = Number.isFinite(payload.Confidence) ? `${(payload.Confidence * 100).toFixed(1)}%` : "n/a";
      const similarity = Number.isFinite(payload.Similarity) ? `${(payload.Similarity * 100).toFixed(1)}%` : "n/a";
      if (isUnknownFace) {
        showRealtimeToast(
          "face:unknown",
          "warning",
          "Unknown person detected",
          `Camera ${cameraId} - confidence ${confidence}`,
        );
      } else {
        showRealtimeToast(
          `face:${payload.UserId ?? payload.FaceProfileId ?? "known"}`,
          "success",
          `${payload.DisplayName || "Known person"} recognized`,
          `Similarity ${similarity} - confidence ${confidence}`,
        );
      }
    },
    [cameraId, getSourceDimensions, shouldProcessRealtimeEvent, showRealtimeToast]
  );

  // Real-time status handler - stable reference
  const handleStatusUpdate = useCallback(
    (payload: CameraStatusPayload) => {
      if (String(payload.CameraId) !== String(cameraId)) return;
      
      setOnline(payload.IsOnline);
      if (payload.Fps != null) setFps(Math.round(payload.Fps));
    },
    [cameraId]
  );

  const appendSecurityEvent = useCallback((entry: CameraSecurityRealtimeEvent) => {
    setSecurityEvents((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const alerts = await securityAlertApi.listOpen();
      setOpenAlerts(alerts.filter((entry) => entry.cameraId === cameraId || entry.streamKey === camera?.StreamKey));
    } catch (error) {
      console.error("[CameraDetailsPage] Failed to load alerts", error);
    }
  }, [camera?.StreamKey, cameraId]);

  const loadStreamStatus = useCallback(async () => {
    if (!Number.isFinite(cameraId) || cameraId <= 0) return;

    try {
      const next = await cameraApi.streamStatus(cameraId);
      setStreamStatus(next);
    } catch (error) {
      console.error("[CameraDetailsPage] Failed to load stream status", error);
    }
  }, [cameraId]);

  const handleBehaviorAlert = useCallback(
    (payload: BehaviorAlertPayload) => {
      if (String(payload.CameraId) !== String(cameraId)) return;
      const eventKey = `behavior:${payload.CameraId}:${payload.FrameId}:${payload.TrackId}:${payload.ActionType}`;
      if (!shouldProcessRealtimeEvent(eventKey)) return;

      appendSecurityEvent({ kind: "behavior", payload, topic: "behavior", event: "behavior.alert.v1" });

      const level = payload.AlertLevel?.toLowerCase();
      const isNormal = level === "info" || payload.ActionType?.toLowerCase().includes("normal");
      const readableAction = payload.ActionType
        ?.replace(/^Normal/i, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim()
        .toLowerCase();
      const behaviorLabel = `${isNormal ? "Normal" : "Abnormal"}: ${readableAction || payload.ActionType}`;
      const behaviorSeverity: "info" | "warning" | "critical" =
        level === "critical" ? "critical" : level === "info" ? "info" : "warning";

      const normalizedTrackId = normalizeTrackId(payload.TrackId);
      const trackKey = buildPersonTrackKey(payload.TrackId);
      const mappedKey = normalizedTrackId ? trackIdToIdentityRef.current.get(normalizedTrackId) : undefined;
      const canonicalKey = mappedKey ?? trackKey ?? `person:behavior:${payload.FrameId}:${payload.ActionType}`;
      const personEntry = personOverlayMapRef.current.get(canonicalKey)
        ?? (trackKey ? personOverlayMapRef.current.get(trackKey) : undefined);
      const source = getSourceDimensions(payload.SourceWidth, payload.SourceHeight);

      if (normalizedTrackId) {
        trackIdToIdentityRef.current.set(normalizedTrackId, canonicalKey);
      }

      if (trackKey && trackKey !== canonicalKey) {
        personOverlayMapRef.current.delete(trackKey);
      }

      const now = performance.now();
      personOverlayMapRef.current.set(canonicalKey, {
        kind: "face",
        id: canonicalKey,
        label: personEntry?.label ?? "Tracked person",
        sublabel: behaviorLabel,
        trackId: normalizedTrackId,
        severity: maxSeverity(personEntry?.severity, behaviorSeverity),
        bbox: payload.BBox,
        confidence: personEntry?.confidence ?? payload.Confidence,
        similarity: personEntry?.kind === "face" ? personEntry.similarity : undefined,
        sourceWidth: payload.SourceWidth ?? personEntry?.sourceWidth ?? source.width,
        sourceHeight: payload.SourceHeight ?? personEntry?.sourceHeight ?? source.height,
        lastSeenAt: now,
        behaviorSeenAt: now,
      });

      console.log("[CameraDetailsPage] Behavior overlay merged", {
        trackId: normalizedTrackId,
        key: canonicalKey,
        hasFace: personEntry?.kind === "face",
        action: payload.ActionType,
      });


      const confidence = Number.isFinite(payload.Confidence) ? `${(payload.Confidence * 100).toFixed(1)}%` : "n/a";
      showRealtimeToast(
        `behavior:${payload.TrackId}:${payload.ActionType}`,
        level === "critical" || level === "warning" ? "warning" : "info",
        `${payload.ActionType} detected`,
        `${payload.AlertLevel || "Info"} - confidence ${confidence}`,
        4000,
      );
    },
    [appendSecurityEvent, cameraId, getSourceDimensions, shouldProcessRealtimeEvent, showRealtimeToast]
  );

  const handleObjectEvent = useCallback(
    (payload: ObjectDetectedPayload) => {
      if (String(payload.CameraId) !== String(cameraId)) return;
      appendSecurityEvent({ kind: "object", payload, topic: "object", event: "object.detected.v1" });
      upsertOverlay(buildObjectOverlayEvent(payload));
    },
    [appendSecurityEvent, cameraId, upsertOverlay]
  );

  const handleZoneAlert = useCallback(
    (payload: ZoneIntrusionPayload) => {
      if (String(payload.CameraId) !== String(cameraId)) return;
      appendSecurityEvent({ kind: "zone", payload, topic: "zone", event: "zone.intrusion.v1" });
      if (payload.UnauthorizedAccess || payload.AlertLevel?.toLowerCase() !== "info") {
        showRealtimeToast(
          `zone:${payload.ZoneId}:${payload.Status}`,
          "warning",
          payload.UnauthorizedAccess ? "Unauthorized zone access" : "Zone alert",
          `${payload.ZoneName || payload.ZoneId} - ${payload.Status}`,
          5000,
        );
      }
    },
    [appendSecurityEvent, cameraId, showRealtimeToast]
  );

  const handleAnomalyAlert = useCallback(
    (payload: AnomalyDetectedPayload) => {
      if (String(payload.CameraId) !== String(cameraId)) return;
      appendSecurityEvent({ kind: "anomaly", payload, topic: "anomaly", event: "anomaly.detected.v1" });
      upsertOverlay(buildAnomalyOverlayEvent(payload));
      showRealtimeToast(
        `anomaly:${payload.TrackId}:${payload.AnomalyType}`,
        "warning",
        `${payload.AnomalyType} anomaly`,
        `${payload.AlertLevel || "Warning"} - confidence ${(payload.Confidence * 100).toFixed(1)}%`,
        5000,
      );
    },
    [appendSecurityEvent, cameraId, showRealtimeToast, upsertOverlay]
  );

  const handleWatchlistAlert = useCallback(
    (payload: WatchlistDetectedPayload) => {
      if (String(payload.CameraId) !== String(cameraId)) return;
      appendSecurityEvent({ kind: "watchlist", payload, topic: "security", event: "watchlist.detected.v1" });

      const now = performance.now();
      const normalizedTrackId = normalizeTrackId(payload.TrackId);
      const trackKey = buildPersonTrackKey(payload.TrackId);
      const mappedKey = normalizedTrackId ? trackIdToIdentityRef.current.get(normalizedTrackId) : undefined;
      const canonicalKey = payload.UserId
        ? `person:user:${payload.UserId}`
        : mappedKey ?? trackKey ?? `person:watchlist:${payload.FaceProfileId ?? payload.FrameId}`;
      const existing = personOverlayMapRef.current.get(canonicalKey)
        ?? (mappedKey ? personOverlayMapRef.current.get(mappedKey) : undefined)
        ?? (trackKey ? personOverlayMapRef.current.get(trackKey) : undefined);
      const behaviorFresh = existing?.behaviorSeenAt != null && now - existing.behaviorSeenAt < 10000;
      const source = getSourceDimensions(payload.SourceWidth, payload.SourceHeight);
      const shouldKeepBehaviorBox = behaviorFresh && bboxArea(existing?.bbox) > bboxArea(payload.BBox);

      if (normalizedTrackId) {
        trackIdToIdentityRef.current.set(normalizedTrackId, canonicalKey);
      }

      if (trackKey && trackKey !== canonicalKey) {
        personOverlayMapRef.current.delete(trackKey);
      }
      if (mappedKey && mappedKey !== canonicalKey) {
        personOverlayMapRef.current.delete(mappedKey);
      }

      personOverlayMapRef.current.set(canonicalKey, {
        kind: "face",
        id: canonicalKey,
        label: `${payload.FullName || payload.UserName || "Watchlist hit"} - Watchlist`,
        sublabel: behaviorFresh ? existing?.sublabel : undefined,
        trackId: normalizedTrackId ?? existing?.trackId,
        severity: "critical",
        bbox: shouldKeepBehaviorBox && existing ? existing.bbox : payload.BBox,
        confidence: payload.Confidence,
        similarity: payload.Similarity,
        sourceWidth: (shouldKeepBehaviorBox ? existing?.sourceWidth : source.width) ?? source.width,
        sourceHeight: (shouldKeepBehaviorBox ? existing?.sourceHeight : source.height) ?? source.height,
        lastSeenAt: now,
        behaviorSeenAt: behaviorFresh ? existing?.behaviorSeenAt : undefined,
      });

      showRealtimeToast(
        `watchlist:${payload.IncidentId ?? payload.UserId}`,
        "warning",
        "Watchlist hit",
        `${payload.FullName || payload.UserName || payload.UserId} - incident #${payload.IncidentId ?? "pending"}`,
        8000,
      );
    },
    [appendSecurityEvent, cameraId, getSourceDimensions, showRealtimeToast]
  );

  const handlePipelineReady = useCallback((payload: DeepStreamReadyPayload) => {
    setPipelineReadyState(payload.ReadyState as PipelineReadyState);
  }, []);

  const handleSuspicionAlert = useCallback(
    (payload: SuspicionAlertPayload) => {
      if (String(payload.CameraId) !== String(cameraId)) return;
      const eventKey = `suspicion:${payload.EventId}`;
      if (!shouldProcessRealtimeEvent(eventKey)) return;

      setActiveSuspicionAlerts((prev) => {
        const filtered = prev.filter((entry) => entry.EventId !== payload.EventId);
        return [payload, ...filtered].slice(0, 3);
      });

      const scorePct = `${(payload.SuspicionScore * 100).toFixed(0)}%`;
      showRealtimeToast(
        `suspicion:${payload.EventId}`,
        "warning",
        "Suspicious behavior detected",
        `Score: ${scorePct}`,
        8000,
      );
    },
    [cameraId, shouldProcessRealtimeEvent, showRealtimeToast]
  );

  // BBox predictor — smooth 60-FPS overlay from high-freq detection events
  const { tracks: predictedTracks, ingest: ingestBBox, clear: clearBBoxTracks } = useBBoxPredictor();

  const handleBBoxTrack = useCallback((payload: BBoxTrackPayload) => {
    if (String(payload.CameraId) !== String(cameraId)) return;
    ingestBBox({
      trackId: payload.TrackId,
      bbox: { x: payload.X, y: payload.Y, w: payload.W, h: payload.H },
      label: payload.PersonName ?? (payload.IdentityLocked ? "Known" : "Unknown"),
      behavior: payload.BehaviorLabel,
      confidence: payload.IdentityConfidence,
      severity: (payload.Severity?.toLowerCase() ?? "info") as "info" | "warning" | "critical",
      sourceWidth: payload.SourceWidth,
      sourceHeight: payload.SourceHeight,
      receivedAt: performance.now(),
    });
  }, [cameraId, ingestBBox]);

  // Clear predicted tracks on camera change
  useEffect(() => {
    clearBBoxTracks();
  }, [cameraId, clearBBoxTracks]);

  // Real-time SignalR subscription
  useCameraRealtime({
    onFace: handleFaceDetection,
    onStatus: handleStatusUpdate,
    onObject: handleObjectEvent,
    onBehavior: handleBehaviorAlert,
    onZone: handleZoneAlert,
    onAnomaly: handleAnomalyAlert,
    onWatchlist: handleWatchlistAlert,
    onPipelineReady: handlePipelineReady,
    onSuspicionAlert: handleSuspicionAlert,
    onBBoxTrack: handleBBoxTrack,
  });

  // Runtime error handling
  const lastRuntimeErrRef = useRef<string>("");
  useEffect(() => {
    if (!runtimeError) return;

    const msg =
      runtimeError instanceof Error
        ? runtimeError.message
        : typeof runtimeError === "string"
          ? runtimeError
          : "Runtime error";

    if (msg && msg !== lastRuntimeErrRef.current) {
      lastRuntimeErrRef.current = msg;
      console.error('[CameraDetailsPage] Runtime error:', msg);
      toast.error("Runtime metrics error", { description: msg });
    }
  }, [runtimeError]);

  // Load camera data - stable reference
  const loadCamera = useCallback(async () => {
    console.log('[CameraDetailsPage] Loading camera data...');
    
    try {
      setLoading(true);
      const c = await cameraApi.get(cameraId);
      
      console.log('[CameraDetailsPage] Camera loaded:', {
        id: c.id,
        name: c.name,
        streamKey: c.StreamKey,
        isActive: c.isActive,
      });
      
      setCamera(c);
      setStreamWanted(c.isActive);

      const preferredMode = getDefaultCameraExecutionMode();
      setMode(preferredMode);
      setDefaultCameraExecutionMode(preferredMode);

      setForm({
        name: c.name,
        rtspUrl: c.rtspUrl,
        isActive: c.isActive,
        capabilities: c.capabilities,
        recognitionMode: c.recognitionMode,
        matchThresholdOverride: c.matchThresholdOverride ?? null,
        inferenceMode: c.inferenceMode ?? "full_analytics",
        sourceProfile: c.sourceProfile ?? "auto",
        expectedWidth: c.expectedWidth ?? null,
        expectedHeight: c.expectedHeight ?? null,
        expectedFps: c.expectedFps ?? null,
        useFace: c.useFace ?? true,
        useObject: c.useObject ?? true,
        useBehavior: c.useBehavior ?? true,
        zoneId: c.zoneId ?? null,
      });
    } catch (e: any) {
      console.error('[CameraDetailsPage] Failed to load camera:', e);
      toast.error("Failed to load camera", { description: e?.message });
      nav("/app/cameras");
    } finally {
      setLoading(false);
    }
  }, [cameraId, nav]);

  // Initial load and SignalR subscription
  useEffect(() => {
    if (!Number.isFinite(cameraId) || cameraId <= 0) {
      console.error('[CameraDetailsPage] Invalid camera ID:', cameraId);
      toast.error("Invalid camera ID");
      nav("/app/cameras", { replace: true });
    }

    console.log('[CameraDetailsPage] Subscribing to camera:', cameraId);
    loadCamera();
    void loadStreamStatus();
    signalRService.subscribeCamera(String(cameraId));

    return () => {
      console.log('[CameraDetailsPage] Unsubscribing from camera:', cameraId);
      signalRService.unsubscribeCamera(String(cameraId));
    };
  }, [cameraId, loadCamera, loadStreamStatus, nav]);

  useEffect(() => {
    void loadStreamStatus();
    const interval = window.setInterval(() => {
      void loadStreamStatus();
    }, tab === "live" ? 3000 : 6000);

    return () => window.clearInterval(interval);
  }, [loadStreamStatus, tab]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (securityEvents.length === 0) return;
    const timer = window.setTimeout(() => {
      void loadAlerts();
    }, 750);
    return () => window.clearTimeout(timer);
  }, [securityEvents.length, loadAlerts]);

  useEffect(() => {
    overlayMapRef.current.clear();
    personOverlayMapRef.current.clear();
    trackIdToIdentityRef.current.clear();
    realtimeToastAtRef.current.clear();
    realtimeEventSeenAtRef.current.clear();
    lastOverlayCommitAtRef.current = 0;
    setOverlayEvents([]);
    setDetections([]);
    setSecurityEvents([]);
    setLastDetection(undefined);
    setOpenAlerts([]);
    setActiveSuspicionAlerts([]);
  }, [cameraId]);

  useEffect(() => {
    let rafId = 0;

    const tick = (now: number) => {
      const overlaysById = overlayMapRef.current;
      const personMap = personOverlayMapRef.current;

      // Expire regular overlays (tmp: 1s, stable: 5s)
      for (const [key, entry] of overlaysById) {
        const ttl = key.includes(":tmp:") ? 1000 : 8000;
        if (now - entry.lastSeenAt > ttl) {
          overlaysById.delete(key);
        }
      }

      // Expire person overlays (10s since last face or behavior update)
      for (const [key, entry] of personMap) {
        if (now - entry.lastSeenAt > 10000) {
          personMap.delete(key);
          for (const [trackId, identityKey] of trackIdToIdentityRef.current) {
            if (identityKey === key) {
              trackIdToIdentityRef.current.delete(trackId);
            }
          }
        }
      }

      if (now - lastOverlayCommitAtRef.current >= 33) {
        lastOverlayCommitAtRef.current = now;
        // Person overlays first (rendered on top), then object/behavior/anomaly overlays
        const next: OverlayEntry[] = [
          ...Array.from(personMap.values()),
          ...Array.from(overlaysById.values()),
        ];
        setOverlayEvents((prev) => (overlayListsMatch(prev, next) ? prev : next));
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      overlayMapRef.current.clear();
      personOverlayMapRef.current.clear();
    };
  }, []);

  // Runtime metrics processing
  useEffect(() => {
    if (!runtime) return;

    const isRunning = runtime.IsRunning ?? false;
    const lastFrame = runtime.LastFrameUtc;
    const isOnline = isRunning && secondsAgo(lastFrame) < 10;

    setOnline(isOnline);
    setFps(Math.round(runtime.Fps ?? 0));

    const point: RuntimePoint = {
      t: new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
      fps: safeNum(runtime.Fps, 0),
      q: safeNum(runtime.QueueDepth, 0),
      drop: safeNum(runtime.DroppedFrames, 0),
      ai: safeNum(runtime.AvgAiMs, 0),
      match: safeNum(runtime.AvgMatchMs, 0),
      total: safeNum(runtime.AvgTotalMs, 0),
    };

    setHistory((prev) => {
      const next = [...prev, point];
      return next.length > 120 ? next.slice(-120) : next;
    });
  }, [runtime]);

  const start = useCallback(async (mode: string) => {  
    if (!camera) return;
    console.log('[CameraDetailsPage] Starting camera:', camera.id, 'Mode:', mode);
    try {
      await cameraApi.start(camera.id, undefined, mode);  
      toast.success(`Camera started in ${mode} mode`);
      setStreamWanted(true);
      await loadStreamStatus();
    } catch (e: any) {
      console.error('[CameraDetailsPage] Start failed:', e);
      toast.error("Start failed", { description: e?.message });
      setStreamWanted(false);  
    }
  }, [camera, loadStreamStatus, mode]);

  const latestAlert = useMemo(() => {
    return [...openAlerts].sort((a, b) => Date.parse(b.occurredAtUtc) - Date.parse(a.occurredAtUtc))[0] ?? null;
  }, [openAlerts]);

  const runtimeLabel = useMemo(() => {
    const activePipeline = runtime?.DeepStreamActivePipelineVersion?.toLowerCase();
    const desiredPipeline = runtime?.DeepStreamDesiredPipelineVersion?.toLowerCase();

    if (activePipeline === "v1") return "DeepStream V1 (active)";
    if (activePipeline === "v2") return "DeepStream V2 (active)";
    if (activePipeline === "v3-light") return "DeepStream V3 Light (active)";

    if (desiredPipeline === "v1") return "DeepStream V1 (requested)";
    if (desiredPipeline === "v2") return "DeepStream V2 (requested)";
    if (desiredPipeline === "v3-light") return "DeepStream V3 Light (requested)";

    switch (mode) {
      case "legacy":
        return "Legacy AI";
      case "deepstream-v1":
        return "DeepStream V1";
      case "deepstream-v2":
        return "DeepStream V2";
      case "deepstream-v3-light":
        return "DeepStream V3 Light";
      default:
        return mode;
    }
  }, [mode, runtime?.DeepStreamActivePipelineVersion, runtime?.DeepStreamDesiredPipelineVersion]);

  const stop = useCallback(async (mode: string) => {  
    if (!camera) return;
    console.log('[CameraDetailsPage] ⏸Stopping camera:', camera.id, 'Mode:', mode);
    try {
      setStreamWanted(false);        
      await stopWhep();              
      await cameraApi.stop(camera.id, mode);  
      toast.info("Camera stopped");
      await loadStreamStatus();
    } catch (e: any) {
      console.error('[CameraDetailsPage] Stop failed:', e);
      toast.error("Stop failed", { description: e?.message });
    }
  }, [camera, loadStreamStatus, stopWhep]);

  const restart = useCallback(async (mode: string) => {
    if (!camera) return;
    console.log('[CameraDetailsPage] Restarting camera:', camera.id, 'Mode:', mode);
    try {
      await cameraApi.restart(camera.id, undefined, mode);
      toast.success(`Camera restarted in ${mode} mode`);
      setStreamWanted(true);
      await loadStreamStatus();
    } catch (e: any) {
      console.error('[CameraDetailsPage] Restart failed:', e);
      toast.error("Restart failed", { description: e?.message });
      throw e; // propagate so callers (e.g. InferenceTogglesCard) know it failed
    }
  }, [camera, loadStreamStatus]);

  const saveEdit = useCallback(async () => {
    if (!camera || !form.name.trim() || !form.rtspUrl.trim()) {
      toast.error("Name and RTSP URL are required");
      return;
    }

    console.log('[CameraDetailsPage] Saving camera changes...');
    
    try {
      const payload: UpdateCameraRequest = {
        name: form.name.trim(),
        rtspUrl: form.rtspUrl.trim(),
        isActive: form.isActive,
        capabilities: form.capabilities,
        recognitionMode: form.recognitionMode,
        matchThresholdOverride: form.matchThresholdOverride ?? null,
        inferenceMode: form.inferenceMode,
        sourceProfile: form.sourceProfile,
        expectedWidth: form.expectedWidth ?? null,
        expectedHeight: form.expectedHeight ?? null,
        expectedFps: form.expectedFps ?? null,
        useFace: form.useFace ?? true,
        useObject: form.useObject ?? true,
        useBehavior: form.useBehavior ?? true,
        zoneId: camera.zoneId ?? form.zoneId ?? null,
      };

      await cameraApi.update(cameraId, payload);
      toast.success("Camera updated");
      setEditOpen(false);
      await loadCamera();
    } catch (e: any) {
      console.error('[CameraDetailsPage] Save failed:', e);
      toast.error("Save failed", { description: e?.message });
    }
  }, [camera, form, cameraId, loadCamera]);

  const isUnknown = useMemo(
    () => !!lastDetection && !lastDetection.UserId,
    [lastDetection]
  );

  const setExecutionMode = useCallback((nextMode: CameraExecutionMode) => {
    setMode(nextMode);
    setDefaultCameraExecutionMode(nextMode);
    if (camera?.isActive) {
      void restart(nextMode);
    }
  }, [camera, restart]);

  // Memoized runtime KPIs
  const runtimeKpis = useMemo(() => {
    const r = runtime;
    if (!r) {
      return {
        q: "--",
        drop: "--",
        ai: "--",
        match: "--",
        total: "--",
        uptime: "--",
        lastFrame: "--",
        err: "",
        isRunning: false,
      };
    }

    return {
      q: String(safeNum(r.QueueDepth, 0)),
      drop: String(safeNum(r.DroppedFrames, 0)),
      ai: fmtMs(r.AvgAiMs),
      match: fmtMs(r.AvgMatchMs),
      total: fmtMs(r.AvgTotalMs),
      uptime: fmtUptime(r.UpTimeSeconds),
      lastFrame: r.LastFrameUtc ? new Date(r.LastFrameUtc).toLocaleString() : "--",
      err: r.LastError ?? "",
      isRunning: !!r.IsRunning,
    };
  }, [runtime]);

  const effectiveOnline = online || (whepStatus === "playing" && frameFresh) || !!streamStatus?.sourceReady;

  if (loading || !camera) {
    return (
      <div className="space-y-4">
        <Card className="glass">
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading camera details...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <CameraHeader
        camera={camera}
        online={effectiveOnline}
        streamStatus={streamStatus}
        fps={fps}
        isUnknown={isUnknown}
        whepStatus={whepStatus}
        whepError={whepError}
        webrtcUrl={webrtcUrl || ""}
        runtimeLabel={runtimeLabel}
        mode={mode}
        onModeChange={setExecutionMode}
        onBack={() => nav("/app/cameras")}
        onRefreshStream={restartWhep}
        onStart={start}
        onStop={stop}
        onRestart={restart}
        onEdit={() => setEditOpen(true)}
      />

      <CameraKpis
        fps={fps}
        q={runtimeKpis.q}
        drop={runtimeKpis.drop}
        ai={runtimeKpis.ai}
        match={runtimeKpis.match}
        uptime={runtimeKpis.uptime}
      />

      <Card className="glass">
        <CardContent>
          <CameraTabs tab={tab} setTab={setTab} />
        </CardContent>
      </Card>

      {/* Manual ABP label control — admin proactive feedback */}
      <div className="flex justify-end">
        <ManualLabelPanel
          cameraId={String(camera.id)}
          zoneId={camera.zoneId != null ? String(camera.zoneId) : undefined}
        />
      </div>

      {/* Conditionally render panels based on active tab */}
      <div className={tab === "live" ? "block" : "hidden"}>
        <CameraLivePanel
          videoRef={videoRef}
          whepStatus={whepStatusRaw}
          whepError={whepError}
          webrtcUrl={webrtcUrl || ""}
          streamStatus={streamStatus}
          fps={fps}
          queue={runtimeKpis.q}
          drop={runtimeKpis.drop}
          aiLatency={runtimeKpis.ai}
          matchLatency={runtimeKpis.match}
          detections={detections}
          lastDetection={lastDetection}
          overlayEvents={overlayEvents}
          latestAlert={latestAlert}
          zoneName={camera.zoneName}
          runtimeLabel={runtimeLabel}
          isUnknown={isUnknown}
          pipelineReadyState={pipelineReadyState}
          annotatedMode={annotatedMode}
          onAnnotatedToggle={() => setAnnotatedMode((v) => !v)}
          predictedTracks={Array.from(predictedTracks.values())}
        />

        {activeSuspicionAlerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {activeSuspicionAlerts.map((alert) => (
              <SuspicionAlertBanner
                key={alert.EventId}
                alert={alert}
                onDismiss={() =>
                  setActiveSuspicionAlerts((prev) => prev.filter((a) => a.EventId !== alert.EventId))
                }
              />
            ))}
          </div>
        )}
      </div>

      {tab === "metrics" && (
        <CameraMetricsPanel
          history={history}
          isRunning={runtimeKpis.isRunning}
          lastFrame={runtimeKpis.lastFrame}
          lastError={runtimeKpis.err}
        />
      )}

      {tab === "events" && <CameraEventsPanel detections={detections} securityEvents={securityEvents} />}

      {tab === "settings" && (
        <CameraSettingsPanel
          camera={camera}
          mode={mode}
          onModeChange={setExecutionMode}
          onStart={start}
          onStop={stop}
          onRestart={restart}
          onEdit={() => setEditOpen(true)}
          onCameraUpdated={loadCamera}
        />
      )}

      <CameraEditDialog 
        open={editOpen} 
        setOpen={setEditOpen} 
        form={form} 
        setForm={setForm} 
        onSave={saveEdit} 
      />
    </motion.div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(CameraDetailsPageComponent);
