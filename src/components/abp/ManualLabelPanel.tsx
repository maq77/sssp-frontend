import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Brain, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import abpApi from "@/lib/api/abpApi";
import type { ABPProactiveResult } from "@/types";

const ACTION_TYPES = [
  "Fighting",
  "Vandalism",
  "Running",
  "Falling",
  "Loitering",
  "Trespassing",
  "Other",
] as const;

const FRAME_WINDOWS = [16, 30, 60] as const;

const FEATURE_LABELS = [
  "Behavior",
  "Pose",
  "Motion",
  "Temporal",
  "Zone Risk",
  "IR Thermal",
] as const;

interface ManualLabelPanelProps {
  cameraId: string;
  zoneId?: string;
}

export function ManualLabelPanel({ cameraId, zoneId }: ManualLabelPanelProps) {
  const [open, setOpen] = useState(false);
  const [isAbnormal, setIsAbnormal] = useState(true);
  const [actionType, setActionType] = useState<string>("Fighting");
  const [frameWindow, setFrameWindow] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ABPProactiveResult | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await abpApi.submitProactiveFeedback({
        cameraId,
        actionType: isAbnormal ? actionType : "Normal",
        isAbnormal,
        frameWindow,
        zoneId,
      });
      setResult(res);
      toast.success(
        isAbnormal
          ? `Labeled as ${actionType} — model updated`
          : "Labeled as Normal — model updated"
      );
    } catch {
      toast.error("Failed to submit label. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setResult(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Brain className="mr-2 h-4 w-4" />
          Manual Label
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Behavior Label</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Behavior type toggle */}
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Behavior
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAbnormal(false)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                  !isAbnormal
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setIsAbnormal(true)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                  isAbnormal
                    ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertTriangle className="mr-1.5 inline-block h-3.5 w-3.5" />
                Abnormal
              </button>
            </div>
          </div>

          {/* Action class — only when Abnormal */}
          {isAbnormal && (
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Action Class
              </div>
              <div className="relative">
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ACTION_TYPES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Frame window */}
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Frame Window
            </div>
            <div className="flex gap-2">
              {FRAME_WINDOWS.map((fw) => (
                <button
                  key={fw}
                  type="button"
                  onClick={() => setFrameWindow(fw)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                    frameWindow === fw
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {fw} frames
                </button>
              ))}
            </div>
          </div>

          {/* Feature breakdown after submission */}
          {result && (
            <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wide">Feature Breakdown</span>
                <span className="font-semibold text-amber-300">
                  {Math.round(result.suspicionScore * 100)}% suspicion
                </span>
              </div>
              <div className="space-y-2">
                {FEATURE_LABELS.map((label, i) => {
                  const raw = result.featureVector[i] ?? 0;
                  const pct = Math.round(Math.max(0, Math.min(1, raw)) * 100);
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{label}</span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                        <div
                          className="h-full rounded-full bg-amber-500/70 transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {result.gaTriggered && (
                <div className="text-[11px] text-emerald-400">
                  ✓ GA optimization triggered ({result.feedbackStoreSize} samples)
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              variant={isAbnormal ? "destructive" : "default"}
            >
              {submitting ? "Submitting…" : "Submit Label"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
