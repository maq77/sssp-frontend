import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ABPSuspicionEvent, SuspicionAlertPayload } from "@/types";

import { AdminFeedbackModal } from "./AdminFeedbackModal";

interface SuspicionAlertBannerProps {
  alert: SuspicionAlertPayload;
  onDismiss?: () => void;
}

export function SuspicionAlertBanner({ alert, onDismiss }: SuspicionAlertBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const score = Math.round((alert.SuspicionScore ?? 0) * 100);
  const trackId = alert.TrackId ?? "--";

  const event = useMemo<ABPSuspicionEvent>(() => {
    const cameraId =
      typeof alert.CameraId === "string"
        ? alert.CameraId
        : String(alert.CameraId ?? "");
    const trackNum =
      typeof alert.TrackId === "number"
        ? alert.TrackId
        : Number(alert.TrackId ?? 0);

    return {
      id: 0,
      eventId: alert.EventId,
      cameraId,
      trackId: Number.isFinite(trackNum) ? trackNum : 0,
      suspicionScore: alert.SuspicionScore ?? 0,
      isSuspicious: alert.IsSuspicious ?? true,
      featureVector: alert.FeatureVector ?? [],
      occurredAtUtc: alert.TsUtc,
      hasFeedback: false,
      clipUrl: alert.ClipUrl ?? undefined,
    };
  }, [alert]);

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-300"
        role="alert"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <div className="text-sm truncate">
            Suspicious behavior — {score}% confidence on Track #{trackId}
          </div>
          {alert.ClipUrl && (
            <video
              src={alert.ClipUrl}
              autoPlay
              muted
              loop
              playsInline
              className="h-8 w-14 rounded border border-amber-500/40 object-cover flex-shrink-0"
            />
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/50 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
            onClick={() => setModalOpen(true)}
          >
            Review
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-amber-200 hover:bg-amber-500/20 hover:text-amber-100"
            onClick={() => onDismiss?.()}
          >
            Dismiss
          </Button>
        </div>
      </div>

      <AdminFeedbackModal
        event={event}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
