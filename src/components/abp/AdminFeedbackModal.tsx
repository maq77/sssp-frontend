import { useABPFeedback } from "@/hooks/useABPFeedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ABPSuspicionEvent } from "@/types";

const FEATURE_LABELS = [
  "Behavior",
  "Pose",
  "Motion",
  "Temporal",
  "Zone Risk",
  "IR Thermal",
] as const;

interface AdminFeedbackModalProps {
  event: ABPSuspicionEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedbackSubmitted?: () => void;
}

export function AdminFeedbackModal({
  event,
  open,
  onOpenChange,
  onFeedbackSubmitted,
}: AdminFeedbackModalProps) {
  const { submitFeedback: submitFeedbackHook, submitting } = useABPFeedback();

  async function submitFeedback(isSuspicious: boolean) {
    if (!event || event.hasFeedback) return;
    const ok = await submitFeedbackHook(event.eventId, isSuspicious);
    if (ok) {
      onOpenChange(false);
      onFeedbackSubmitted?.();
    }
  }

  const score = event ? Math.round(event.suspicionScore * 100) : 0;
  const features = event?.featureVector ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Suspicion Alert</DialogTitle>
        </DialogHeader>

        {!event ? (
          <div className="text-sm text-muted-foreground">
            No event selected.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Suspicion
                </div>
                <div className="text-2xl font-semibold text-amber-300">
                  {score}%
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Camera
                </div>
                <div className="text-sm font-medium truncate" title={event.cameraId}>
                  {event.cameraId}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Track
                </div>
                <div className="text-sm font-medium">#{event.trackId}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                Feature Breakdown
              </div>
              <div className="space-y-2">
                {FEATURE_LABELS.map((label, i) => {
                  const raw = features[i] ?? 0;
                  const clamped = Math.max(0, Math.min(1, raw));
                  const pct = Math.round(clamped * 100);
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{label}</span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted/40">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {event.clipUrl && (
              <div>
                <div className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Event Clip
                </div>
                <video
                  src={event.clipUrl}
                  controls
                  autoPlay
                  muted
                  loop
                  className="w-full rounded-lg border border-border bg-black"
                  style={{ maxHeight: 200 }}
                />
              </div>
            )}

            {event.hasFeedback ? (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Feedback already submitted
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                disabled={submitting || event.hasFeedback}
                onClick={() => submitFeedback(false)}
              >
                Normal
              </Button>
              <Button
                variant="destructive"
                disabled={submitting || event.hasFeedback}
                onClick={() => submitFeedback(true)}
              >
                Suspicious
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
