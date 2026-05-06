import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import signalRService from "@/lib/signalr-service";
import { useCameraRuntime } from "@/hooks/useCameraRuntime";
import { useCameraRealtime } from "@/hooks/useCameraRealtime";
import type { CameraStatusPayload, FaceRecognizedPayload } from "@/types";

export type RuntimePoint = {
  t: string;
  fps: number;
  q: number;
  drop: number;
  ai: number;
  match: number;
  total: number;
};

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmtMs(v?: number) {
  if (v == null) return "--";
  return `${Math.round(v)}ms`;
}

function fmtUptime(seconds?: number) {
  if (seconds == null) return "--";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}h ${m}m ${ss}s`;
}

function secondsAgo(iso?: string) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return (Date.now() - t) / 1000;
}

export function useCameraTelemetry(cameraId: number) {
  // your existing runtime hook (polls every 2s)
  const { data: runtime, errorMessage: runtimeError } = useCameraRuntime(cameraId, 2000);

  const [history, setHistory] = useState<RuntimePoint[]>([]);
  const [detections, setDetections] = useState<FaceRecognizedPayload[]>([]);
  const [lastDetection, setLastDetection] = useState<FaceRecognizedPayload | undefined>(undefined);

  const [online, setOnline] = useState(false);
  const [fps, setFps] = useState(0);

  // prevent toast spam
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
      toast.error("Runtime metrics error", { description: msg });
    }
  }, [runtimeError]);

  // subscribe/unsubscribe this camera in SignalR
  useEffect(() => {
    if (!Number.isFinite(cameraId) || cameraId <= 0) return;

    signalRService.subscribeCamera(String(cameraId));
    return () => {
      signalRService.unsubscribeCamera(String(cameraId));
    };
  }, [cameraId]);

  // realtime callbacks
  useCameraRealtime({
    onFace: useCallback(
      (payload: FaceRecognizedPayload) => {
        if (String(payload.CameraId) !== String(cameraId)) return;

        setLastDetection(payload);
        setDetections((prev) => [payload, ...prev].slice(0, 500));
      },
      [cameraId]
    ),

    onStatus: useCallback(
      (payload: CameraStatusPayload) => {
        if (String(payload.CameraId) !== String(cameraId)) return;

        setOnline(payload.IsOnline);
        if (payload.Fps != null) setFps(Math.round(payload.Fps));
      },
      [cameraId]
    ),
  });

  // runtime -> online/fps + chart history
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

  const runtimeKpis = useMemo(() => {
    const r: any = runtime;
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
    };
  }, [runtime]);

  return {
    runtime,
    runtimeKpis,
    history,

    detections,
    lastDetection,

    online,
    fps,

    clearDetections: () => {
      setDetections([]);
      setLastDetection(undefined);
    },
  };
}
