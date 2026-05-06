import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

import cameraApi from "@/lib/api/cameraApi";
import signalRService from "@/lib/signalr-service";
import { useWhepStream } from "@/hooks/useWhepStream";
import { useCameraRuntime } from "@/hooks/useCameraRuntime";
import { useCameraRealtime } from "@/hooks/useCameraRealtime";
import { getRuntimeConfig } from "@/lib/config/runtimeConfig";
import { type CameraExecutionMode, getDefaultCameraExecutionMode, setDefaultCameraExecutionMode } from "@/lib/camera-execution-mode";


import type { CameraDTO, FaceRecognizedPayload, CameraStatusPayload, UpdateCameraRequest } from "@/types";
import type { CameraEditForm, CameraRuntimeDto, RuntimePoint, TabKey, WhepUiStatus } from "@/types/camera";
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

export default function CameraDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const cameraId = Number(id);

  const [tab, setTab] = useState<TabKey>("live");

  const [camera, setCamera] = useState<CameraDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [history, setHistory] = useState<RuntimePoint[]>([]);
  const [detections, setDetections] = useState<FaceRecognizedPayload[]>([]);
  const [lastDetection, setLastDetection] = useState<FaceRecognizedPayload | undefined>(undefined);
  const [mode, setMode] = useState<CameraExecutionMode>(() => getDefaultCameraExecutionMode());

  const [online, setOnline] = useState(false);
  const [fps, setFps] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<CameraEditForm>({
    name: "",
    rtspUrl: "",
    isActive: true,
    capabilities: 7,
    recognitionMode: 0,
    matchThresholdOverride: null,
  });

  const { data: runtimeRaw, errorMessage: runtimeError } = useCameraRuntime(cameraId, 2000);
  const runtime = runtimeRaw as unknown as CameraRuntimeDto | undefined;

  const { whepBase } = getRuntimeConfig();

  // ✅ FIX: Construct proper WHEP URL
  // MediaMTX WHEP endpoint format: http://localhost:8889/cam-3/whep
  const webrtcUrl = useMemo(() => {
    if (!camera) return null;
    
    const streamKey = camera.StreamKey || `cam-${cameraId}`;
    
    // If whepBase is configured, use it (e.g., "http://localhost:8889")
    // Otherwise use relative path which will be proxied
    if (whepBase) {
      const base = whepBase.replace(/\/+$/, ""); // Remove trailing slash
      return `${base}/${streamKey}/whep`;
    }
    
    // Fallback to relative path (will be proxied by Vite/nginx)
    return `/${streamKey}/whep`;
  }, [camera, cameraId, whepBase]);

  const {
    videoRef,
    status: whepStatusRaw,
    error: whepError,
    restart: restartWhep,
  } = useWhepStream(webrtcUrl, {
    enabled: tab === "live" && !!camera,     
    debug: true,
    pauseWhenHidden: false,
  });

  const whepStatus = (String(whepStatusRaw ?? "idle").trim() as WhepUiStatus) ?? "idle";

  useCameraRealtime({
    onFace: useCallback(
      (payload: FaceRecognizedPayload) => {
        if (String(payload.CameraId) !== String(cameraId)) return;
        setLastDetection(payload);
        setDetections((prev) => [payload, ...prev].slice(0, 200));
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

  const loadCamera = useCallback(async () => {
    try {
      setLoading(true);
      const c = await cameraApi.get(cameraId);
      setCamera(c);

      setForm({
        name: c.name,
        rtspUrl: c.rtspUrl,
        isActive: c.isActive,
        capabilities: c.capabilities,
        recognitionMode: c.recognitionMode,
        matchThresholdOverride: c.matchThresholdOverride ?? null,
      });
    } catch (e: any) {
      toast.error("Failed to load camera", { description: e?.message });
      nav("/cameras");
    } finally {
      setLoading(false);
    }
  }, [cameraId, nav]);

  useEffect(() => {
    if (!Number.isFinite(cameraId) || cameraId <= 0) {
      toast.error("Invalid camera ID");
      nav("/cameras");
      return;
    }

    loadCamera();
    signalRService.subscribeCamera(String(cameraId));

    return () => {
      signalRService.unsubscribeCamera(String(cameraId));
    };
  }, [cameraId, loadCamera, nav]);

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

  const start = async () => {
    if (!camera) return;
    try {
      await cameraApi.start(camera.id);
      toast.success("Camera started");
    } catch (e: any) {
      toast.error("Start failed", { description: e?.message });
    }
  };

  const stop = async () => {
    if (!camera) return;
    try {
      await cameraApi.stop(camera.id);
      toast.info("Camera stopped");
    } catch (e: any) {
      toast.error("Stop failed", { description: e?.message });
    }
  };

  const restart = async () => {
    if (!camera) return;
    try {
      await cameraApi.restart(camera.id);
      toast.success("Camera restarted");
    } catch (e: any) {
      toast.error("Restart failed", { description: e?.message });
    }
  };

  const saveEdit = async () => {
    if (!camera || !form.name.trim() || !form.rtspUrl.trim()) {
      toast.error("Name and RTSP URL are required");
      return;
    }

    try {
      const payload: UpdateCameraRequest = {
        name: form.name.trim(),
        rtspUrl: form.rtspUrl.trim(),
        isActive: form.isActive,
        capabilities: form.capabilities,
        recognitionMode: form.recognitionMode,
        matchThresholdOverride: form.matchThresholdOverride ?? null,
      };

      await cameraApi.update(cameraId, payload);
      toast.success("Camera updated");
      setEditOpen(false);
      await loadCamera();
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message });
    }
  };

  const isUnknown = !!lastDetection && !lastDetection.UserId;

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

  const setExecutionMode = useCallback((nextMode: CameraExecutionMode) => {
    setMode(nextMode);
    setDefaultCameraExecutionMode(nextMode);
  }, []);

  if (loading || !camera) {
    return (
      <div className="space-y-4">
        <Card className="glass">
          <CardContent className="py-8 text-center text-muted-foreground">Loading camera details...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <CameraHeader
        camera={camera}
        online={online}
        fps={fps}
        isUnknown={isUnknown}
        whepStatus={whepStatus}
        whepError={whepError}
        webrtcUrl={webrtcUrl || ""}
        mode={mode}
        onModeChange={setExecutionMode}
        onBack={() => nav("/cameras")}
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

      <div className={tab === "live" ? "block" : "hidden"}>
        <CameraLivePanel
          videoRef={videoRef}
          whepStatus={whepStatusRaw}
          whepError={whepError}
          webrtcUrl={webrtcUrl || ""}
          fps={fps}
          queue={runtimeKpis.q}
          drop={runtimeKpis.drop}
          detections={detections}
          lastDetection={lastDetection}
          overlayEvents={[]}
          latestAlert={null}
          zoneName={camera?.zoneName}
          runtimeLabel={mode}
          isUnknown={isUnknown}
        />
      </div>

      {tab === "metrics" && (
        <CameraMetricsPanel
          history={history}
          isRunning={runtimeKpis.isRunning}
          lastFrame={runtimeKpis.lastFrame}
          lastError={runtimeKpis.err}
        />
      )}

      {tab === "events" && <CameraEventsPanel detections={detections} securityEvents={[]} />}

      {tab === "settings" && (
        <CameraSettingsPanel
          camera={camera}
          mode={mode}
          onModeChange={setExecutionMode}
          onStart={start}
          onStop={stop}
          onRestart={restart}
          onEdit={() => setEditOpen(true)}
        />
      )}

      <CameraEditDialog open={editOpen} setOpen={setEditOpen} form={form} setForm={setForm} onSave={saveEdit} />
    </motion.div>
  );
}
