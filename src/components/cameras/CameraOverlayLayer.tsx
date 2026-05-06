import { memo } from "react";
import { motion } from "framer-motion";
import type { CameraOverlayEvent } from "@/types";
import type { PredictedTrack } from "@/hooks/useBBoxPredictor";

interface CameraOverlayLayerProps {
  events: CameraOverlayEvent[];
  videoWidth: number;
  videoHeight: number;
  predictedTracks?: PredictedTrack[];
}

function getTone(severity?: "info" | "warning" | "critical") {
  if (severity === "critical") {
    return {
      border: "border-rose-400",
      bg: "bg-rose-500",
    };
  }

  if (severity === "warning") {
    return {
      border: "border-amber-400",
      bg: "bg-amber-500",
    };
  }

  return {
    border: "border-emerald-400",
    bg: "bg-emerald-500",
  };
}

export const CameraOverlayLayer = memo(function CameraOverlayLayer({
  events,
  videoWidth,
  videoHeight,
  predictedTracks,
}: CameraOverlayLayerProps) {
  const hasContent = events.length > 0 || (predictedTracks && predictedTracks.length > 0);
  if (!hasContent || !videoWidth || !videoHeight) return null;

  return (
    <>
      {/* ── Predicted face tracks (60-FPS rAF interpolated) ──────────────── */}
      {predictedTracks?.map((track) => {
        if (!track.sourceWidth || !track.sourceHeight) return null;

        const scale = Math.min(videoWidth / track.sourceWidth, videoHeight / track.sourceHeight);
        const drawnW = track.sourceWidth * scale;
        const drawnH = track.sourceHeight * scale;
        const dx = (videoWidth - drawnW) / 2;
        const dy = (videoHeight - drawnH) / 2;

        const x = dx + track.x * scale;
        const y = dy + track.y * scale;
        const w = track.w * scale;
        const h = track.h * scale;

        const x1 = Math.max(0, Math.min(x, videoWidth));
        const y1 = Math.max(0, Math.min(y, videoHeight));
        const x2 = Math.max(0, Math.min(x + w, videoWidth));
        const y2 = Math.max(0, Math.min(y + h, videoHeight));

        const tone = getTone(track.severity);
        const labelHeight = 38 + (track.behavior ? 14 : 0);
        const labelTop = y1 > labelHeight + 8 ? -labelHeight : Math.max(h + 4, 4);

        return (
          <div
            key={`pt-${track.trackId}`}
            className={`absolute pointer-events-none border-2 ${tone.border}`}
            style={{
              left: x1,
              top: y1,
              width: Math.max(0, x2 - x1),
              height: Math.max(0, y2 - y1),
              opacity: track.opacity,
              willChange: "left, top, width, height, opacity",
            }}
          >
            <div
              className={`absolute left-0 ${tone.bg} text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-lg whitespace-nowrap`}
              style={{ top: labelTop }}
            >
              <div>{track.label}</div>
              <div className="mt-0.5 text-[10px] opacity-90">
                {track.confidence > 0 ? `Conf ${(track.confidence * 100).toFixed(0)}%` : "Live"}
                {track.trackId > 0 ? ` | ID:${track.trackId}` : ""}
              </div>
              {track.behavior ? (
                <div className="mt-0.5 text-[10px] opacity-80 font-normal">{track.behavior}</div>
              ) : null}
            </div>

            <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${tone.border}`} />
            <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${tone.border}`} />
            <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${tone.border}`} />
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${tone.border}`} />
          </div>
        );
      })}

      {/* ── Standard SignalR overlay events ──────────────────────────────── */}
      {events.map((event) => {
        const sourceWidth = event.sourceWidth ?? videoWidth;
        const sourceHeight = event.sourceHeight ?? videoHeight;

        if (!event.bbox || event.bbox.Width <= 0 || event.bbox.Height <= 0) {
          return null;
        }

        const scale = Math.min(videoWidth / sourceWidth, videoHeight / sourceHeight);
        const drawnW = sourceWidth * scale;
        const drawnH = sourceHeight * scale;

        const dx = (videoWidth - drawnW) / 2;
        const dy = (videoHeight - drawnH) / 2;

        const x = dx + event.bbox.X * scale;
        const y = dy + event.bbox.Y * scale;
        const w = event.bbox.Width * scale;
        const h = event.bbox.Height * scale;

        const x1 = Math.max(0, Math.min(x, videoWidth));
        const y1 = Math.max(0, Math.min(y, videoHeight));
        const x2 = Math.max(0, Math.min(x + w, videoWidth));
        const y2 = Math.max(0, Math.min(y + h, videoHeight));

        const tone = getTone(event.severity);
        const labelHeight = 38 + (event.trackId != null ? 14 : 0) + (event.sublabel ? 14 : 0);
        const labelTop = y1 > labelHeight + 8 ? -labelHeight : Math.max(h + 4, 4);

        const similarity = "similarity" in event ? event.similarity : null;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: x1,
              top: y1,
              width: Math.max(0, x2 - x1),
              height: Math.max(0, y2 - y1),
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "linear" }}
            className={`absolute pointer-events-none border-2 ${tone.border}`}
            style={{ willChange: "left, top, width, height, opacity" }}
          >
            <div
              className={`absolute left-0 ${tone.bg} text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-lg whitespace-nowrap`}
              style={{ top: labelTop }}
            >
              <div>{event.label}</div>
              <div className="mt-0.5 text-[10px] opacity-90">
                {event.confidence != null ? `Conf ${(event.confidence * 100).toFixed(1)}%` : "Live event"}
                {similarity != null ? ` | Sim ${(similarity * 100).toFixed(1)}%` : ""}
              </div>
              {event.trackId != null ? (
                <div className="mt-0.5 text-[10px] opacity-85 font-normal">TrackId: {event.trackId}</div>
              ) : null}
              {event.sublabel ? (
                <div className="mt-0.5 text-[10px] opacity-80 font-normal">{event.sublabel}</div>
              ) : null}
            </div>

            <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${tone.border}`} />
            <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${tone.border}`} />
            <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${tone.border}`} />
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${tone.border}`} />
          </motion.div>
        );
      })}
    </>
  );
});
