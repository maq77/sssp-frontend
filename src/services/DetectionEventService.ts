import { FaceRecognizedPayload } from "@/types";
import { DetectionEvent } from "@/types";

/**
 * Service Layer - Transforms detection payloads into domain events
 * Follows Single Responsibility Principle
 */
export class DetectionEventService {
  private readonly MAX_EVENTS = 200;

  /**
   * Transforms SignalR payload into domain event
   */
  toDetectionEvent(payload: FaceRecognizedPayload): DetectionEvent {
    const isUnknown = !payload.UserId;

    return {
      id: `${payload.FrameId}-${payload.TrackingId}-${Date.now()}`,
      displayName: payload.DisplayName || (isUnknown ? "Unknown" : "Recognized"),
      userId: payload.UserId ?? null,
      confidence: payload.Confidence,
      similarity: payload.Similarity,
      trackingId: payload.TrackingId ?? null,
      frameId: payload.FrameId ?? null,
      timestamp: payload.TsUtc,
      isUnknown,
    };
  }

  /**
   * Adds event to collection with size limit
   */
  addEvent(events: DetectionEvent[], newEvent: DetectionEvent): DetectionEvent[] {
    const updated = [newEvent, ...events];
    return updated.slice(0, this.MAX_EVENTS);
  }

  /**
   * Filters events for a specific camera
   */
  filterByCamera(payload: FaceRecognizedPayload, cameraId: number): boolean {
    return String(payload.CameraId) === String(cameraId);
  }

  /**
   * Checks if detection represents unknown person
   */
  isUnknownPerson(event: DetectionEvent | undefined): boolean {
    return !!event && event.isUnknown;
  }

  /**
   * Formats confidence/similarity for display
   */
  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Formats timestamp for display
   */
  formatTimestamp(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString();
    } catch {
      return "--";
    }
  }
}

// Singleton instance
export const detectionEventService = new DetectionEventService();