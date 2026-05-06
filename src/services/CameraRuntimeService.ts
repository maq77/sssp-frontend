import { CameraRuntimeStatus, RuntimeMetrics, RuntimeHistoryPoint } from "@/types";

/**
 * Service Layer - Handles business logic for camera runtime operations
 * Follows Single Responsibility Principle
 */
export class CameraRuntimeService {
  private readonly STALE_THRESHOLD_SECONDS = 10;
  private readonly MAX_HISTORY_POINTS = 120;

  /**
   * Transforms raw runtime status into UI-friendly metrics
   */
  computeMetrics(runtime: CameraRuntimeStatus | null): RuntimeMetrics {
    if (!runtime) {
      return this.getEmptyMetrics();
    }

    const isOnline = this.isRuntimeOnline(runtime);

    return {
      fps: Math.round(runtime.Fps ?? 0),
      queueDepth: runtime.QueueDepth ?? 0,
      droppedFrames: runtime.DroppedFrames ?? 0,
      avgAiMs: runtime.AvgAiMs ?? 0,
      avgMatchMs: runtime.AvgMatchMs ?? 0,
      avgTotalMs: runtime.AvgTotalMs ?? 0,
      uptime: this.formatUptime(runtime.UpTimeSeconds),
      lastFrame: this.formatLastFrame(runtime.LastFrameUtc),
      lastError: runtime.LastError ?? "",
      isOnline,
    };
  }

  /**
   * Determines if runtime is considered "online"
   */
  isRuntimeOnline(runtime: CameraRuntimeStatus): boolean {
    if (!runtime.IsRunning) return false;
    if (!runtime.LastFrameUtc) return false;

    const secondsAgo = this.secondsSince(runtime.LastFrameUtc);
    return secondsAgo < this.STALE_THRESHOLD_SECONDS;
  }

  /**
   * Converts runtime status to history point
   */
  toHistoryPoint(runtime: CameraRuntimeStatus): RuntimeHistoryPoint {
    return {
      timestamp: new Date().toLocaleTimeString([], { 
        minute: "2-digit", 
        second: "2-digit" 
      }),
      fps: runtime.Fps ?? 0,
      queueDepth: runtime.QueueDepth ?? 0,
      droppedFrames: runtime.DroppedFrames ?? 0,
      aiLatency: runtime.AvgAiMs ?? 0,
      matchLatency: runtime.AvgMatchMs ?? 0,
      totalLatency: runtime.AvgTotalMs ?? 0,
    };
  }

  /**
   * Adds a point to history with size constraints
   */
  addHistoryPoint(
    history: RuntimeHistoryPoint[],
    point: RuntimeHistoryPoint
  ): RuntimeHistoryPoint[] {
    const updated = [...history, point];
    return updated.length > this.MAX_HISTORY_POINTS
      ? updated.slice(updated.length - this.MAX_HISTORY_POINTS)
      : updated;
  }

  // ========== Private Helpers ==========

  private getEmptyMetrics(): RuntimeMetrics {
    return {
      fps: 0,
      queueDepth: 0,
      droppedFrames: 0,
      avgAiMs: 0,
      avgMatchMs: 0,
      avgTotalMs: 0,
      uptime: "--",
      lastFrame: "--",
      lastError: "",
      isOnline: false,
    };
  }

  private formatUptime(seconds?: number): string {
    if (seconds == null) return "--";
    
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    
    return `${h}h ${m}m ${ss}s`;
  }

  private formatLastFrame(iso?: string): string {
    if (!iso) return "--";
    
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return "--";
    }
  }

  private secondsSince(iso: string): number {
    try {
      const timestamp = Date.parse(iso);
      if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
      return (Date.now() - timestamp) / 1000;
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }
}

// Singleton instance
export const cameraRuntimeService = new CameraRuntimeService();