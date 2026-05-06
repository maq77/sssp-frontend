import { useState, useCallback, useRef, useEffect } from "react";
import { Eye, Box, Activity, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import cameraApi from "@/lib/api/cameraApi";
import type { CameraDTO } from "@/types";
import type { CameraExecutionMode } from "@/lib/camera-execution-mode";

type Toggles = { useFace: boolean; useObject: boolean; useBehavior: boolean };
type ToggleKey = keyof Toggles;

interface RowProps {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
  saving: boolean;
}

function ToggleRow({ icon: Icon, label, description, checked, onChange, disabled, saving }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium leading-none mb-0.5">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
            "border-2 border-transparent transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-40",
            checked ? "bg-primary" : "bg-input",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
              checked ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>
    </div>
  );
}

interface Props {
  camera: CameraDTO;
  mode: CameraExecutionMode;
  onRestart: (mode: CameraExecutionMode) => Promise<void>;
  onCameraUpdated: () => void;
}

export function InferenceTogglesCard({ camera, mode, onRestart, onCameraUpdated }: Props) {
  const [toggles, setToggles] = useState<Toggles>({
    useFace: camera.useFace ?? true,
    useObject: camera.useObject ?? true,
    useBehavior: camera.useBehavior ?? true,
  });
  const [savingField, setSavingField] = useState<ToggleKey | null>(null);
  const [restartPending, setRestartPending] = useState(false);
  const [restarting, setRestarting] = useState(false);

  // Sync when navigating to a different camera
  const prevCameraId = useRef(camera.id);
  useEffect(() => {
    if (camera.id !== prevCameraId.current) {
      prevCameraId.current = camera.id;
      setToggles({
        useFace: camera.useFace ?? true,
        useObject: camera.useObject ?? true,
        useBehavior: camera.useBehavior ?? true,
      });
      setRestartPending(false);
    }
  }, [camera.id, camera.useFace, camera.useObject, camera.useBehavior]);

  const handleToggle = useCallback(
    async (field: ToggleKey, value: boolean) => {
      const prevValue = toggles[field];
      const next: Toggles = { ...toggles, [field]: value };

      // Optimistic update
      setToggles(next);
      setSavingField(field);

      try {
        await cameraApi.patchToggles(camera.id, camera, next);
        setRestartPending(true);
        onCameraUpdated();
      } catch (err: any) {
        setToggles((t) => ({ ...t, [field]: prevValue }));
        toast.error("Failed to save", { description: err?.message ?? "Unknown error" });
      } finally {
        setSavingField(null);
      }
    },
    [camera, toggles, onCameraUpdated],
  );

  const handleRestart = useCallback(async () => {
    setRestarting(true);
    try {
      await onRestart(mode);
      setRestartPending(false);
    } catch {
      // onRestart shows its own toast; keep banner visible so user can retry
    } finally {
      setRestarting(false);
    }
  }, [mode, onRestart]);

  const isBusy = savingField !== null || restarting;

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="font-semibold">AI Processing</div>
        <div className="text-xs text-muted-foreground">
          Controls which inference branches run on this camera
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <ToggleRow
          icon={Eye}
          label="Face Recognition"
          description="Identify faces in the stream"
          checked={toggles.useFace}
          onChange={(v) => void handleToggle("useFace", v)}
          disabled={isBusy}
          saving={savingField === "useFace"}
        />
        <ToggleRow
          icon={Box}
          label="Object Detection"
          description="Detect & classify objects · V1 / V2 / V3"
          checked={toggles.useObject}
          onChange={(v) => void handleToggle("useObject", v)}
          disabled={isBusy}
          saving={savingField === "useObject"}
        />
        <ToggleRow
          icon={Activity}
          label="Behavior Analysis"
          description="Flag abnormal actions · V1 / V2 / V3"
          checked={toggles.useBehavior}
          onChange={(v) => void handleToggle("useBehavior", v)}
          disabled={isBusy}
          saving={savingField === "useBehavior"}
        />

        {restartPending && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Saved · restart stream to apply</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
              onClick={() => void handleRestart()}
              disabled={restarting}
            >
              {restarting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1.5">{restarting ? "Restarting…" : "Restart Now"}</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
