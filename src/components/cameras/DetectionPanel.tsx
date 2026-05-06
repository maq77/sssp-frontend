// src/features/camera-details/components/DetectionPanel.tsx

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetectionEvent } from "@/types";
import { detectionEventService } from "@/services/DetectionEventService";

type Props = {
  lastDetection?: DetectionEvent;
  detections: DetectionEvent[];
};

/**
 * Presentation Component - Detection history panel
 * Follows Single Responsibility: Display detection list
 */
export function DetectionPanel({ lastDetection, detections }: Props) {
  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <div className="font-semibold">Last Detection</div>
        <div className="text-xs text-muted-foreground">Real-time from SignalR</div>
      </CardHeader>

      <CardContent className="space-y-3">
        {lastDetection ? (
          <DetectionCard detection={lastDetection} isHighlight />
        ) : (
          <div className="text-sm text-muted-foreground">No detections yet.</div>
        )}

        <div className="text-xs text-muted-foreground font-semibold">Recent</div>

        <div className="space-y-2 max-h-[340px] overflow-auto pr-1">
          {detections.slice(0, 20).map((detection) => (
            <DetectionCard key={detection.id} detection={detection} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DetectionCard({ 
  detection, 
  isHighlight = false 
}: { 
  detection: DetectionEvent; 
  isHighlight?: boolean;
}) {
  const bgClass = isHighlight
    ? detection.isUnknown
      ? "bg-red-500/10"
      : "bg-muted/30"
    : "bg-muted/30";

  return (
    <div className={`p-${isHighlight ? 3 : 2} rounded ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div className={`font-semibold ${isHighlight ? "text-base" : "text-sm"}`}>
          {detection.displayName}
        </div>
        <Badge
          variant="outline"
          className={
            detection.isUnknown
              ? "border-red-500 text-red-400"
              : "border-green-500 text-green-400"
          }
        >
          {detection.isUnknown ? "Unknown" : "Known"}
        </Badge>
      </div>

      <div className={`${isHighlight ? "text-xs" : "text-[11px]"} text-muted-foreground mt-1`}>
        Conf {detectionEventService.formatPercentage(detection.confidence)} • Sim{" "}
        {detectionEventService.formatPercentage(detection.similarity)}
        {!isHighlight && ` • ${detectionEventService.formatTimestamp(detection.timestamp)}`}
      </div>

      {isHighlight && (
        <div className="text-xs text-muted-foreground">
          Track: {detection.trackingId ?? "--"} • Frame: {detection.frameId ?? "--"}
        </div>
      )}
    </div>
  );
}