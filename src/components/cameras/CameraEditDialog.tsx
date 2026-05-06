import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import type { CameraEditForm } from "@/types/camera";
import { cn, safeNum } from "@/lib/utils";
import {
  CameraAICapabilities,
  CameraRecognitionMode,
  type CameraInferenceMode,
  type CameraSourceProfile,
} from "@/types";

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-medium leading-none">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
        )}
      </div>
    </label>
  );
}

export function CameraEditDialog(props: {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: CameraEditForm;
  setForm: React.Dispatch<React.SetStateAction<CameraEditForm>>;
  onSave: () => Promise<void> | void;
}) {
  const { open, setOpen, form, setForm, onSave } = props;
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = React.useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSave]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!isSaving) setOpen(nextOpen); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Camera Configuration</DialogTitle>
          <DialogDescription>Update camera settings. Changes will take effect after restart.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Field label="Camera Name">
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </Field>

          <Field label="RTSP URL">
            <Input value={form.rtspUrl} onChange={(e) => setForm((p) => ({ ...p, rtspUrl: e.target.value }))} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Capabilities">
              <Select
                value={String(form.capabilities)}
                onValueChange={(value) => setForm((p) => ({ ...p, capabilities: safeNum(value, CameraAICapabilities.All) }))}
              >
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
              <Select
                value={String(form.recognitionMode)}
                onValueChange={(value) => setForm((p) => ({ ...p, recognitionMode: safeNum(value, CameraRecognitionMode.Normal) }))}
              >
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
                type="number"
                value={form.matchThresholdOverride == null ? "" : String(form.matchThresholdOverride)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    matchThresholdOverride: e.target.value === "" ? null : safeNum(e.target.value, 0),
                  }))
                }
                placeholder="Default"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Inference Mode">
              <Select
                value={form.inferenceMode ?? "full_analytics"}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, inferenceMode: value as CameraInferenceMode }))
                }
              >
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
              <Select
                value={form.sourceProfile ?? "auto"}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, sourceProfile: value as CameraSourceProfile }))
                }
              >
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
              <Input
                type="number"
                value={form.expectedWidth == null ? "" : String(form.expectedWidth)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    expectedWidth: e.target.value === "" ? null : safeNum(e.target.value, 0),
                  }))
                }
                placeholder="Auto"
              />
            </Field>

            <Field label="Expected Height">
              <Input
                type="number"
                value={form.expectedHeight == null ? "" : String(form.expectedHeight)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    expectedHeight: e.target.value === "" ? null : safeNum(e.target.value, 0),
                  }))
                }
                placeholder="Auto"
              />
            </Field>

            <Field label="Expected FPS">
              <Input
                type="number"
                value={form.expectedFps == null ? "" : String(form.expectedFps)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    expectedFps: e.target.value === "" ? null : safeNum(e.target.value, 0),
                  }))
                }
                placeholder="Auto"
              />
            </Field>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="active" className="text-sm cursor-pointer">
              Camera Active
            </label>
          </div>

          <Field label="AI Processing">
            <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
              <ToggleSwitch
                id="use-face"
                checked={form.useFace ?? true}
                onChange={(v) => setForm((p) => ({ ...p, useFace: v }))}
                label="Face Recognition"
                description="Detect and identify faces in the stream"
              />
              <ToggleSwitch
                id="use-object"
                checked={form.useObject ?? true}
                onChange={(v) => setForm((p) => ({ ...p, useObject: v }))}
                label="Object Detection"
                description="Detect and classify objects (V1/V2/V3 only)"
              />
              <ToggleSwitch
                id="use-behavior"
                checked={form.useBehavior ?? true}
                onChange={(v) => setForm((p) => ({ ...p, useBehavior: v }))}
                label="Behavior Analysis"
                description="Analyze actions and flag abnormal behavior (V1/V2/V3 only)"
              />
            </div>
          </Field>
        </div>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
