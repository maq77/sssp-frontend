import { memo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Camera, MapPin, Pencil, Play, RefreshCcw,
  Square, Wand2, ShieldAlert, ExternalLink, Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SecurityBadge } from "@/components/ui/security-badge";
import { LiveBadge } from "@/components/ui/live-badge";
import { PipelineHealthPill } from "@/components/cameras/PipelineHealthPill";
import type { CameraDTO, CameraStreamStatus } from "@/types";
import type { WhepUiStatus } from "@/types/camera";
import type { CameraExecutionMode } from "@/lib/camera-execution-mode";
import { CAMERA_EXECUTION_MODES } from "@/lib/camera-execution-mode";

interface CameraHeaderProps {
  camera: CameraDTO;
  online: boolean;
  fps: number;
  isUnknown: boolean;
  whepStatus: WhepUiStatus;
  whepError?: string | null;
  webrtcUrl: string;
  streamStatus?: CameraStreamStatus | null;
  runtimeLabel?: string;
  mode: CameraExecutionMode;
  onBack: () => void;
  onRefreshStream: () => void;
  onModeChange: (mode: CameraExecutionMode) => void;
  onStart: (mode: CameraExecutionMode) => void;
  onStop: (mode: CameraExecutionMode) => void;
  onRestart: (mode: CameraExecutionMode) => void;
  onEdit: () => void;
}

export const CameraHeader = memo(function CameraHeader({
  camera, online, fps, isUnknown, whepStatus, whepError,
  webrtcUrl, streamStatus, runtimeLabel, mode,
  onBack, onModeChange, onRefreshStream, onStart, onStop, onRestart, onEdit,
}: CameraHeaderProps) {
  const isPlaying = whepStatus === "playing";
  const isError   = whepStatus === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel rounded-2xl px-5 py-4"
    >
      {/* Top row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Left: breadcrumb + title */}
        <div className="flex-1 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            All Cameras
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 rounded-xl bg-blue-500/15">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{camera.name}</h1>

            {/* Status badges */}
            {isPlaying ? (
              <LiveBadge label="LIVE" color="green" />
            ) : isError ? (
              <SecurityBadge variant="critical" dot>Stream Error</SecurityBadge>
            ) : (
              <SecurityBadge variant="neutral" dot>{whepStatus}</SecurityBadge>
            )}

            <SecurityBadge variant={online ? "online" : "offline"} dot>
              {online ? "Online" : "Offline"}
            </SecurityBadge>

            {camera.zoneName && (
              <SecurityBadge variant="info">
                <MapPin className="w-3 h-3" />
                {camera.zoneName}
              </SecurityBadge>
            )}

            {runtimeLabel && (
              <SecurityBadge variant="neutral">
                <Zap className="w-3 h-3" />
                {runtimeLabel}
              </SecurityBadge>
            )}

            <PipelineHealthPill cameraId={String(camera.id)} />

            {isUnknown && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/15 border border-red-500/30 rounded-full px-3 py-0.5 animate-threat-pulse"
              >
                <ShieldAlert className="w-3 h-3" />
                Unknown Detected
              </motion.div>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap mt-2">
            <span className="text-xs text-muted-foreground font-mono tabular">ID: {camera.id}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs text-muted-foreground font-mono tabular">{fps} FPS</span>
            {streamStatus?.expectedWidth && streamStatus?.expectedHeight && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground font-mono tabular">
                  {streamStatus.expectedWidth}×{streamStatus.expectedHeight}
                  {streamStatus.expectedFps ? ` @ ${streamStatus.expectedFps}fps` : ""}
                </span>
              </>
            )}
            {streamStatus?.orientation && streamStatus.orientation !== "unknown" && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground capitalize">{streamStatus.orientation}</span>
              </>
            )}
            {camera.sourceProfile && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground">Profile: {camera.sourceProfile}</span>
              </>
            )}
            <a
              href={webrtcUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              WHEP <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {(whepError || (isError && streamStatus?.message)) && (
            <p className="text-xs text-red-400 mt-1.5 font-mono">
              ⚠ {whepError ?? streamStatus?.message}
            </p>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Mode selector */}
          <Select value={mode} onValueChange={(v) => onModeChange(v as CameraExecutionMode)}>
            <SelectTrigger className="h-9 w-[160px] text-xs bg-surface-2 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAMERA_EXECUTION_MODES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={onRefreshStream}
              className="h-9 gap-1.5 text-xs border-border/60 bg-surface-2 hover:bg-surface-3"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={() => onStart(mode)}
              disabled={!camera.isActive}
              className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0"
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStop(mode)}
              className="h-9 gap-1.5 text-xs"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onRestart(mode)}
              className="h-9 gap-1.5 text-xs border-border/60 bg-surface-2 hover:bg-surface-3"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Restart
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="h-9 gap-1.5 text-xs border-border/60 bg-surface-2 hover:bg-surface-3"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
