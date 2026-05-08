import { useCallback, useMemo, useState, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Activity, Radio, Loader2, Eye, Maximize2, Minimize2,
  RotateCcw, Pause, User, ShieldAlert, Clock, Wifi, WifiOff, Cpu, Layers,
} from "lucide-react";

import { SecurityBadge } from "@/components/ui/security-badge";
import { LiveBadge } from "@/components/ui/live-badge";
import { cn } from "@/lib/utils";

import type { CameraOverlayEvent, CameraStreamStatus, FaceRecognizedPayload, SecurityAlert } from "@/types";
import type { WhepUiStatus } from "@/types/camera";
import type { PredictedTrack } from "@/hooks/useBBoxPredictor";
import { useElementSize } from "@/hooks/useElementSize";
import { CameraOverlayLayer } from "@/components/cameras/CameraOverlayLayer";

type Props = {
  videoRef: (element: HTMLVideoElement | null) => void;
  whepStatus: WhepUiStatus;
  whepError?: string | null;
  webrtcUrl: string;
  streamStatus?: CameraStreamStatus | null;
  fps: number;
  queue: string;
  drop: string;
  aiLatency?: string;
  matchLatency?: string;
  detections: FaceRecognizedPayload[];
  lastDetection?: FaceRecognizedPayload;
  overlayEvents: CameraOverlayEvent[];
  latestAlert?: SecurityAlert | null;
  zoneName?: string | null;
  runtimeLabel?: string;
  isUnknown: boolean;
  pipelineReadyState?: string | null;
  annotatedMode?: boolean;
  onAnnotatedToggle?: () => void;
  predictedTracks?: PredictedTrack[];
};

// ── ConfBar ──────────────────────────────────────────────────────────────────
function ConfBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono font-semibold tabular">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-20 shrink-0">{label}</span>
      <span className="text-xs font-mono text-foreground truncate">{value}</span>
    </div>
  );
}

// ── KpiPill ──────────────────────────────────────────────────────────────────
function KpiPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
      <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="font-mono font-bold text-sm tabular" style={{ color }}>{value}</span>
    </div>
  );
}

// ── CameraLivePanel ──────────────────────────────────────────────────────────
export const CameraLivePanel = memo(function CameraLivePanel({
  videoRef,
  whepStatus,
  whepError,
  webrtcUrl: _webrtcUrl,
  streamStatus,
  fps,
  queue,
  drop,
  aiLatency,
  matchLatency,
  detections,
  lastDetection,
  overlayEvents,
  latestAlert,
  zoneName,
  runtimeLabel,
  isUnknown,
  pipelineReadyState,
  annotatedMode,
  onAnnotatedToggle,
  predictedTracks,
}: Props) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [videoMetadata, setVideoMetadata] = useState({ width: 0, height: 0 });

  const { ref: videoWrapRef, size: videoSize } = useElementSize<HTMLDivElement>();

  const isAiWarming = pipelineReadyState === "INITIALIZING" || pipelineReadyState === "WARMING";
  const isPlaying = whepStatus === "playing";
  const isError = whepStatus === "error";

  const bridgedVideoRef = useCallback((el: HTMLVideoElement | null) => {
    setVideoEl(el);
    videoRef(el);
  }, [videoRef]);

  useEffect(() => {
    if (!videoEl) { setVideoMetadata({ width: 0, height: 0 }); return; }
    const sync = () => setVideoMetadata({ width: videoEl.videoWidth || 0, height: videoEl.videoHeight || 0 });
    sync();
    videoEl.addEventListener("loadedmetadata", sync);
    videoEl.addEventListener("loadeddata", sync);
    videoEl.addEventListener("resize", sync);
    videoEl.addEventListener("emptied", sync);
    return () => {
      videoEl.removeEventListener("loadedmetadata", sync);
      videoEl.removeEventListener("loadeddata", sync);
      videoEl.removeEventListener("resize", sync);
      videoEl.removeEventListener("emptied", sync);
    };
  }, [videoEl]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const fallbackSize = useMemo(() => {
    const first = overlayEvents.find(e => (e.sourceWidth ?? 0) > 0 && (e.sourceHeight ?? 0) > 0);
    return { width: first?.sourceWidth ?? 0, height: first?.sourceHeight ?? 0 };
  }, [overlayEvents]);

  const resolvedVideoSize = useMemo(() => ({
    width: videoMetadata.width || streamStatus?.expectedWidth || fallbackSize.width || 16,
    height: videoMetadata.height || streamStatus?.expectedHeight || fallbackSize.height || 9,
  }), [videoMetadata, streamStatus, fallbackSize]);

  const latestOverlay = useMemo(() => {
    if (!lastDetection) return null;
    return overlayEvents.find(e =>
      e.trackId != null && lastDetection.TrackingId != null &&
      String(e.trackId) === String(lastDetection.TrackingId)
    ) ?? overlayEvents.find(e => e.kind === "face" && e.label === lastDetection.DisplayName) ?? null;
  }, [lastDetection, overlayEvents]);

  const statusMessage = useMemo(() => {
    if (whepStatus === "error") return {
      text: "Stream Error",
      detail: whepError ?? streamStatus?.lastTransportError ?? streamStatus?.message ?? "Browser could not start playback.",
      icon: AlertTriangle,
    };
    if (whepStatus === "reconnecting") return { text: "Reconnecting…", detail: "Recovering live session.", icon: RotateCcw };
    if (streamStatus && !streamStatus.mediaMtxReachable) return {
      text: "MediaMTX Unreachable",
      detail: streamStatus.lastTransportError || streamStatus.message || `Cannot reach ${streamStatus.mediaMtxHealthEndpoint}.`,
      icon: WifiOff,
    };
    if (streamStatus && !streamStatus.pathConfigured) return {
      text: "Configuring Stream Path",
      detail: streamStatus.message || "Preparing camera path in MediaMTX.",
      icon: Activity,
    };
    if (streamStatus && !streamStatus.lastProbeSucceeded && streamStatus.lastProbeError) return {
      text: "Camera Offline",
      detail: streamStatus.lastProbeError,
      icon: WifiOff,
    };
    if (streamStatus && !streamStatus.sourceReady) return {
      text: "Waiting For Camera Feed",
      detail: streamStatus.message || "MediaMTX waiting for RTSP source.",
      icon: Wifi,
    };
    switch (whepStatus) {
      case "idle":    return { text: "Stream Idle",    detail: streamStatus?.message ?? "Live playback idle.",    icon: Pause };
      case "starting": return { text: streamStatus?.pathReady ? "Negotiating WebRTC" : "Starting Stream…", detail: streamStatus?.pathReady ? "Establishing browser playback." : streamStatus?.message ?? "Preparing live playback.", icon: Activity };
      case "stopped": return { text: "Stream Stopped", detail: streamStatus?.message ?? "Live playback stopped.", icon: Pause };
      default:        return null;
    }
  }, [streamStatus, whepError, whepStatus]);

  const toggleFullscreen = () => {
    const el = videoWrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) { el.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const detCount = detections.length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

      {/* ── Video Panel ─────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
        {/* Video header bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            {isPlaying
              ? <LiveBadge label="LIVE" color="green" size="sm" />
              : isError
                ? <SecurityBadge variant="critical" dot>Error</SecurityBadge>
                : <SecurityBadge variant="neutral" dot>{whepStatus}</SecurityBadge>
            }
            {streamStatus?.state && (
              <span className="text-[10px] text-muted-foreground font-mono">· {streamStatus.state}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onAnnotatedToggle && (
              <button
                onClick={onAnnotatedToggle}
                className={cn(
                  "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                  annotatedMode
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "text-muted-foreground border-border/50 bg-surface-2 hover:bg-surface-3 hover:text-foreground"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                {annotatedMode ? "Annotated" : "Raw"}
              </button>
            )}
            <button
              onClick={() => setShowOverlay(v => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border/50 bg-surface-2 hover:bg-surface-3 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Overlay
            </button>
          </div>
        </div>

        {/* Video
            The wrapper uses aspect-ratio to drive its height from its width, then
            caps that height with max-height. We MUST use absolute inset-0 on the
            <video> element here — "h-full" on a flex-child whose height comes from
            aspect-ratio + max-height resolves incorrectly in Chrome/Safari, causing
            the video to render at 0 height (black screen) while overlays stay visible. */}
        <div
          ref={videoWrapRef}
          className="relative w-full bg-black group flex-shrink-0"
          style={{ aspectRatio: `${resolvedVideoSize.width} / ${resolvedVideoSize.height}`, maxHeight: "72vh" }}
          onClick={toggleFullscreen}
        >
          <video
            ref={bridgedVideoRef}
            className="absolute inset-0 w-full h-full object-contain"
            playsInline muted autoPlay
          />

          {/* Overlay layer */}
          {showOverlay && videoSize.width > 0 && videoSize.height > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <CameraOverlayLayer
                events={overlayEvents}
                videoWidth={videoSize.width}
                videoHeight={videoSize.height}
                predictedTracks={predictedTracks}
              />
            </div>
          )}

          {/* Unknown alert banner */}
          <AnimatePresence>
            {isUnknown && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl animate-threat-pulse pointer-events-none"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                UNKNOWN DETECTED
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI warmup badge */}
          <AnimatePresence>
            {isAiWarming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-3 right-3 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg pointer-events-none"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                AI {pipelineReadyState === "WARMING" ? "Warming" : "Initializing"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom HUD: stats + fullscreen */}
          <AnimatePresence>
            {showOverlay && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 pointer-events-none"
              >
                <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-xs font-mono shadow-lg">
                  <span><span className="text-emerald-400 font-semibold">FPS</span> <span className="tabular">{fps}</span></span>
                  <span className="text-white/20">·</span>
                  <span><span className="text-blue-400 font-semibold">Q</span> <span className="tabular">{queue}</span></span>
                  <span className="text-white/20">·</span>
                  <span><span className="text-red-400 font-semibold">D</span> <span className="tabular">{drop}</span></span>
                  {aiLatency && (
                    <>
                      <span className="text-white/20">·</span>
                      <span><span className="text-amber-400 font-semibold">AI</span> <span className="tabular">{aiLatency}ms</span></span>
                    </>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleFullscreen(); }}
                  className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 text-white hover:bg-black/90 transition-colors pointer-events-auto shadow-lg"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status overlay (non-playing) */}
          <AnimatePresence>
            {whepStatus !== "playing" && statusMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm"
              >
                <div className="text-center space-y-4 px-6">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="mx-auto w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center"
                  >
                    <statusMessage.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <div className="text-white text-lg font-semibold">{statusMessage.text}</div>
                    {statusMessage.detail && (
                      <div className={cn("text-sm mt-1.5 max-w-sm mx-auto", isError ? "text-red-400" : "text-white/70")}>
                        {statusMessage.detail}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs">
              Click for fullscreen
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Panel ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Stream Status */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Stream Status</div>

          <div className="grid grid-cols-2 gap-2">
            <KpiPill label="FPS"   value={String(fps)}   color="#34d399" />
            <KpiPill label="Queue" value={queue}          color="#60a5fa" />
            <KpiPill label="Drops" value={drop}           color={parseInt(drop) > 0 ? "#f87171" : "#94a3b8"} />
            <KpiPill label="Track" value={String(detCount)} color="#a78bfa" />
          </div>

          {(aiLatency || matchLatency) && (
            <div className="grid grid-cols-2 gap-2">
              {aiLatency   && <KpiPill label="AI"    value={`${aiLatency}ms`}    color="#f59e0b" />}
              {matchLatency && <KpiPill label="Match" value={`${matchLatency}ms`} color="#8b5cf6" />}
            </div>
          )}

          <div className="pt-1 border-t border-border/30 space-y-0">
            <InfoRow icon={Radio}  label="Pipeline" value={runtimeLabel || "Unknown"} />
            <InfoRow icon={Activity} label="Zone"   value={zoneName || "Unassigned"} />
            {streamStatus?.expectedFps && (
              <InfoRow icon={Cpu}  label="Profile" value={`${streamStatus.expectedFps}fps · ${streamStatus.orientation ?? "?"}`} />
            )}
          </div>
        </div>

        {/* Last Detection */}
        <div className="glass-card rounded-2xl p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Last Detection</div>

          <AnimatePresence mode="wait">
            {lastDetection ? (
              <motion.div
                key={lastDetection.FrameId ?? lastDetection.TrackingId}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "rounded-xl border p-3 space-y-3",
                  isUnknown
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-emerald-500/10 border-emerald-500/30"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0",
                      isUnknown ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                    )}>
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-sm truncate">
                      {lastDetection.DisplayName || (isUnknown ? "Unknown Person" : "Recognized")}
                    </span>
                  </div>
                  <SecurityBadge variant={isUnknown ? "critical" : "low"}>
                    {isUnknown ? "Unknown" : "Known"}
                  </SecurityBadge>
                </div>

                <div className="space-y-2">
                  <ConfBar label="Confidence" value={lastDetection.Confidence} color={isUnknown ? "#f87171" : "#34d399"} />
                  <ConfBar label="Similarity"  value={lastDetection.Similarity} color={isUnknown ? "#fb923c" : "#60a5fa"} />
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Track #{lastDetection.TrackingId ?? latestOverlay?.trackId ?? "—"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lastDetection.TsUtc ? new Date(lastDetection.TsUtc).toLocaleTimeString() : "--"}</span>
                </div>

                {latestOverlay?.sublabel && (
                  <div className="rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 text-xs font-semibold">
                    Behavior: {latestOverlay.sublabel}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border/40 rounded-xl"
              >
                <User className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <span className="text-sm text-muted-foreground">No detections yet</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Latest Alert */}
        {latestAlert && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Active Alert</div>
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="font-semibold text-sm truncate text-orange-300">{latestAlert.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {latestAlert.person?.displayName || latestAlert.reason || latestAlert.alertCategory}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(latestAlert.occurredAtUtc).toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent detections mini-list */}
        {detections.length > 1 && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Recent</div>
              <span className="text-[10px] text-muted-foreground tabular">{detections.length} total</span>
            </div>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin pr-1">
              {detections.slice(0, 12).map((d, i) => {
                const known = !!d.UserId;
                return (
                  <div key={`${d.FrameId ?? i}-${d.TrackingId ?? i}`}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-border/30 hover:bg-surface-3 transition-colors"
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", known ? "bg-emerald-400" : "bg-red-400")} />
                    <span className="flex-1 text-xs truncate font-medium">{d.DisplayName || "Unknown"}</span>
                    <span className="text-[10px] text-muted-foreground tabular font-mono">{(d.Confidence * 100).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
