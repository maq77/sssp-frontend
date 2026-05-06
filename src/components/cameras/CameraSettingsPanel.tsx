import { Play, Square, Wand2, Settings2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InferenceTogglesCard } from "@/components/cameras/InferenceTogglesCard";
import type { CameraDTO } from "@/types";
import type { CameraExecutionMode } from "@/lib/camera-execution-mode";
import { CAMERA_EXECUTION_MODES } from "@/lib/camera-execution-mode";

function getCapabilityLabel(value: number) {
  switch (value) {
    case 7:  return "Full Analytics";
    case 1:  return "Face Detection";
    case 2:  return "Object Detection";
    case 4:  return "Behavior Detection";
    case 3:  return "Face + Object";
    case 5:  return "Face + Behavior";
    case 6:  return "Object + Behavior";
    case 0:  return "Disabled";
    default: return String(value);
  }
}

function getRecognitionModeLabel(value: number) {
  switch (value) {
    case 0:  return "Disabled";
    case 1:  return "Observe Only";
    case 2:  return "Normal";
    case 3:  return "Strict";
    case 4:  return "Relaxed";
    default: return String(value);
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-semibold break-all mt-1">{value}</div>
    </div>
  );
}

export function CameraSettingsPanel(props: {
  camera: CameraDTO;
  mode: CameraExecutionMode;
  onModeChange: (mode: CameraExecutionMode) => void;
  onStart: (mode: CameraExecutionMode) => Promise<void>;
  onStop: (mode: CameraExecutionMode) => Promise<void>;
  onRestart: (mode: CameraExecutionMode) => Promise<void>;
  onEdit: () => void;
  onCameraUpdated: () => void;
}) {
  const { camera, mode, onModeChange, onStart, onStop, onRestart, onEdit, onCameraUpdated } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Camera config (read-only) ── */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <div className="font-semibold">Camera Configuration</div>
          <div className="text-xs text-muted-foreground">Current settings (click Edit to modify)</div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Info label="ID"     value={String(camera.id)} />
          <Info label="Name"   value={camera.name} />
          <Info label="RTSP URL" value={camera.rtspUrl} />
          <Info label="Active" value={camera.isActive ? "Yes" : "No"} />
          <Info label="Capabilities"      value={getCapabilityLabel(camera.capabilities)} />
          <Info label="Recognition Mode"  value={getRecognitionModeLabel(camera.recognitionMode)} />
          <Info
            label="Match Threshold"
            value={camera.matchThresholdOverride == null ? "Default" : String(camera.matchThresholdOverride)}
          />
        </CardContent>
      </Card>

      {/* ── AI toggles (interactive) ── */}
      <InferenceTogglesCard
        camera={camera}
        mode={mode}
        onRestart={onRestart}
        onCameraUpdated={onCameraUpdated}
      />

      {/* ── Operational controls ── */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <div className="font-semibold">Operational Controls</div>
          <div className="text-xs text-muted-foreground">Camera lifecycle management</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Mode:</label>
            <Select value={mode} onValueChange={(v) => onModeChange(v as CameraExecutionMode)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAMERA_EXECUTION_MODES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={() => void onStart(mode)} disabled={!camera.isActive}>
            <Play className="w-4 h-4 mr-2" /> Start Camera
          </Button>

          <Button className="w-full" variant="destructive" onClick={() => void onStop(mode)}>
            <Square className="w-4 h-4 mr-2" /> Stop Camera
          </Button>

          <Button className="w-full" variant="outline" onClick={() => void onRestart(mode)}>
            <Wand2 className="w-4 h-4 mr-2" /> Restart Camera
          </Button>

          <Button className="w-full" variant="outline" onClick={onEdit}>
            <Settings2 className="w-4 h-4 mr-2" /> Edit Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
