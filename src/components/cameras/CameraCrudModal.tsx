import { type ReactNode, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CameraDTO,
  CreateCameraRequest,
  UpdateCameraRequest,
  CameraAICapabilities,
  CameraRecognitionMode,
  type CameraInferenceMode,
  type CameraSourceProfile,
} from "@/types";
import { safeNum } from "@/lib/utils";

type Mode = "create" | "edit";

const CAPABILITY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: CameraAICapabilities.All, label: "Full Analytics" },
  { value: CameraAICapabilities.Face, label: "Face Detection" },
  { value: CameraAICapabilities.Object, label: "Object Detection" },
  { value: CameraAICapabilities.Behavior, label: "Behavior Detection" },
  { value: CameraAICapabilities.Face | CameraAICapabilities.Object, label: "Face + Object" },
  { value: CameraAICapabilities.Face | CameraAICapabilities.Behavior, label: "Face + Behavior" },
  { value: CameraAICapabilities.Object | CameraAICapabilities.Behavior, label: "Object + Behavior" },
  { value: CameraAICapabilities.None, label: "Disabled" },
];

const RECOGNITION_MODE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: CameraRecognitionMode.Normal, label: "Normal (Identify & track)" },
  { value: CameraRecognitionMode.ObserveOnly, label: "Observe Only (no identity stored)" },
  { value: CameraRecognitionMode.Relaxed, label: "Relaxed (lower threshold)" },
  { value: CameraRecognitionMode.Strict, label: "Strict (higher threshold)" },
  { value: CameraRecognitionMode.Disabled, label: "Disabled" },
];

const INFERENCE_OPTIONS: Array<{ value: CameraInferenceMode; label: string }> = [
  { value: "full_analytics", label: "Full Analytics" },
  { value: "face_behavior", label: "Face + Behavior" },
  { value: "face_only", label: "Face Only" },
  { value: "behavior_only", label: "Behavior Only" },
  { value: "zone_only", label: "Zone Only" },
];

const SOURCE_PROFILE_OPTIONS: Array<{ value: CameraSourceProfile; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "phone", label: "Mobile Cam" },
  { value: "cctv", label: "CCTV" },
  { value: "webcam", label: "Webcam" },
  { value: "test_video", label: "Test Video" },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

export function CameraCrudModal({
  open,
  onOpenChange,
  mode,
  camera,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  camera?: CameraDTO | null;
  onSubmit: (payload: CreateCameraRequest | UpdateCameraRequest) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [capabilities, setCapabilities] = useState<number>(CameraAICapabilities.All);
  const [recognitionMode, setRecognitionMode] = useState<number>(CameraRecognitionMode.Normal);
  const [matchThresholdOverride, setMatchThresholdOverride] = useState<string>("");
  const [inferenceMode, setInferenceMode] = useState<CameraInferenceMode>("full_analytics");
  const [sourceProfile, setSourceProfile] = useState<CameraSourceProfile>("auto");
  const [expectedWidth, setExpectedWidth] = useState<string>("");
  const [expectedHeight, setExpectedHeight] = useState<string>("");
  const [expectedFps, setExpectedFps] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && camera) {
      setName(camera.name ?? "");
      setRtspUrl(camera.rtspUrl ?? "");
      setCapabilities(camera.capabilities ?? CameraAICapabilities.All);
      setRecognitionMode(camera.recognitionMode ?? CameraRecognitionMode.Normal);
      setMatchThresholdOverride(camera.matchThresholdOverride?.toString() ?? "");
      setInferenceMode(camera.inferenceMode ?? "full_analytics");
      setSourceProfile(camera.sourceProfile ?? "auto");
      setExpectedWidth(camera.expectedWidth?.toString() ?? "");
      setExpectedHeight(camera.expectedHeight?.toString() ?? "");
      setExpectedFps(camera.expectedFps?.toString() ?? "");
    } else {
      setName("");
      setRtspUrl("");
      setCapabilities(CameraAICapabilities.All);
      setRecognitionMode(CameraRecognitionMode.Normal);
      setMatchThresholdOverride("");
      setInferenceMode("full_analytics");
      setSourceProfile("auto");
      setExpectedWidth("");
      setExpectedHeight("");
      setExpectedFps("");
    }
  }, [mode, camera, open]);

  const submit = async () => {
    if (isSubmitting) return;

    const thr = matchThresholdOverride.trim() === "" ? undefined : Number(matchThresholdOverride);
    const width = expectedWidth.trim() === "" ? null : safeNum(expectedWidth, 0);
    const height = expectedHeight.trim() === "" ? null : safeNum(expectedHeight, 0);
    const fps = expectedFps.trim() === "" ? null : safeNum(expectedFps, 0);

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const payload: CreateCameraRequest = {
          name,
          rtspUrl,
          capabilities: capabilities as any,
          recognitionMode: recognitionMode as any,
          matchThresholdOverride: thr,
          inferenceMode,
          sourceProfile,
          expectedWidth: width,
          expectedHeight: height,
          expectedFps: fps,
          zoneId: camera?.zoneId ?? null,
          useFace: camera?.useFace ?? true,
          useObject: camera?.useObject ?? true,
          useBehavior: camera?.useBehavior ?? true,
        };
        await onSubmit(payload);
      } else {
        const payload: UpdateCameraRequest = {
          name,
          rtspUrl,
          isActive: true, // keep from your backend contract
          capabilities: capabilities as any,
          recognitionMode: recognitionMode as any,
          matchThresholdOverride: thr,
          inferenceMode,
          sourceProfile,
          expectedWidth: width,
          expectedHeight: height,
          expectedFps: fps,
          zoneId: camera?.zoneId ?? null,
          useFace: camera?.useFace ?? true,
          useObject: camera?.useObject ?? true,
          useBehavior: camera?.useBehavior ?? true,
        };
        await onSubmit(payload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!isSubmitting) onOpenChange(nextOpen); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Camera" : "Edit Camera"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Main Entrance" />
          </Field>

          <Field label="RTSP URL">
            <Input value={rtspUrl} onChange={(e) => setRtspUrl(e.target.value)} placeholder="rtsp://..." />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Capabilities">
              <Select value={String(capabilities)} onValueChange={(value) => setCapabilities(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAPABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Recognition Mode">
              <Select value={String(recognitionMode)} onValueChange={(value) => setRecognitionMode(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECOGNITION_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Match Threshold">
              <Input
                value={matchThresholdOverride}
                onChange={(e) => setMatchThresholdOverride(e.target.value)}
                placeholder="Default"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Inference Mode">
              <Select value={inferenceMode} onValueChange={(value) => setInferenceMode(value as CameraInferenceMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INFERENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Source Profile">
              <Select value={sourceProfile} onValueChange={(value) => setSourceProfile(value as CameraSourceProfile)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_PROFILE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Expected Width">
              <Input value={expectedWidth} onChange={(e) => setExpectedWidth(e.target.value)} placeholder="Auto" />
            </Field>

            <Field label="Expected Height">
              <Input value={expectedHeight} onChange={(e) => setExpectedHeight(e.target.value)} placeholder="Auto" />
            </Field>

            <Field label="Expected FPS">
              <Input value={expectedFps} onChange={(e) => setExpectedFps(e.target.value)} placeholder="Auto" />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
