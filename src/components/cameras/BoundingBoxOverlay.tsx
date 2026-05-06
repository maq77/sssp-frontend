import { memo } from "react";
import { motion } from "framer-motion";
import type { FaceRecognizedPayload } from "@/types";

interface BoundingBoxOverlayProps {
  detection: FaceRecognizedPayload;
  videoWidth: number;
  videoHeight: number;
  disabled?: boolean;
}

export const BoundingBoxOverlay = memo(function BoundingBoxOverlay({
  detection,
  videoWidth,
  videoHeight,
  disabled,
}: BoundingBoxOverlayProps) {
  const { BBox, DisplayName, Confidence, Similarity, UserId, SourceWidth, SourceHeight } = detection;

  // Early returns for invalid data
  if (disabled) return null;
  if (!SourceWidth || !SourceHeight || !videoWidth || !videoHeight) return null;
  if (!BBox || BBox.Width <= 0 || BBox.Height <= 0) return null;

  // Calculate scaling and positioning (memoized via component)
  const scale = Math.max(videoWidth / SourceWidth, videoHeight / SourceHeight);
  const drawnW = SourceWidth * scale;
  const drawnH = SourceHeight * scale;

  const dx = (videoWidth - drawnW) / 2;
  const dy = (videoHeight - drawnH) / 2;


  const x = dx + BBox.X * scale;
  const y = dy + BBox.Y * scale;
  const w = BBox.Width * scale;
  const h = BBox.Height * scale;

  const x1 = x;
  const y1 = y;
  const x2 = x + w;
  const y2 = y + h;

  const cx1 = Math.max(0, Math.min(x1, videoWidth));
  const cy1 = Math.max(0, Math.min(y1, videoHeight));
  const cx2 = Math.max(0, Math.min(x2, videoWidth));
  const cy2 = Math.max(0, Math.min(y2, videoHeight));

  const clampedX = cx1;
  const clampedY = cy1;
  const clampedW = Math.max(0, cx2 - cx1);
  const clampedH = Math.max(0, cy2 - cy1);

  const recognized = !!UserId;
  const borderColor = recognized ? "border-green-400" : "border-red-400";
  const bgColor = recognized ? "bg-green-500" : "bg-red-500";
  const label = DisplayName || (recognized ? "Recognized" : "Unknown");
  const labelTop = clampedY > 50 ? '-42px' : `${clampedH + 4}px`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className={`absolute pointer-events-none border-2 ${borderColor}`}
      style={{
        left: clampedX,
        top: clampedY,
        width: clampedW,
        height: clampedH,
      }}
    >
      {/* Label */}
      <div
        className={`absolute left-0 ${bgColor} text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-lg whitespace-nowrap`}
        style={{ top: labelTop }}
      >
        <span>{label}</span>
        <div className="text-[10px] opacity-90 mt-0.5">
          Conf: {(Confidence * 100).toFixed(1)}% • Sim: {(Similarity * 100).toFixed(1)}%
        </div>
      </div>

      {/* Corner markers - using single border class */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${borderColor}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${borderColor}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${borderColor}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${borderColor}`} />
    </motion.div>
  );
}, (prev, next) => {
  // Custom comparison - only re-render if detection data or dimensions actually changed
  return (
    prev.detection.FrameId === next.detection.FrameId &&
    prev.detection.TrackingId === next.detection.TrackingId &&
    prev.videoWidth === next.videoWidth &&
    prev.videoHeight === next.videoHeight
  );
});