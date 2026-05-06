import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CameraApi from "@/lib/api/cameraApi";
import signalRService from "@/lib/signalr-service";
import { CameraDTO, FaceRecognizedPayload, CameraStatusPayload } from "@/types";
import { CameraRuntimeStatus, DetectionEvent, RuntimeHistoryPoint } from "@/types";
import { cameraRuntimeService } from "@/services/CameraRuntimeService";
import { detectionEventService } from "@/services/DetectionEventService";

/**
 * Master hook - Orchestrates all camera details state
 * Follows Single Responsibility: State orchestration
 */
export function useCameraDetails(cameraId: number) {
  const navigate = useNavigate();

  // Camera data
  const [camera, setCamera] = useState<CameraDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Runtime state
  const [runtime, setRuntime] = useState<CameraRuntimeStatus | null>(null);
  const [history, setHistory] = useState<RuntimeHistoryPoint[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [fps, setFps] = useState(0);

  // Detection state
  const [lastDetection, setLastDetection] = useState<DetectionEvent | undefined>();
  const [detections, setDetections] = useState<DetectionEvent[]>([]);

  // Load camera data
  const loadCamera = async () => {
    try {
      setIsLoading(true);
      const data = await CameraApi.get(cameraId);
      setCamera(data);
    } catch (e: any) {
      toast.error("Failed to load camera", { description: e?.message });
      navigate("/cameras");
    } finally {
      setIsLoading(false);
    }
  };

  // Poll runtime status
  const pollRuntime = async () => {
    try {
      const data = await CameraApi.runtime(cameraId);
      setRuntime(data);

      const metrics = cameraRuntimeService.computeMetrics(data);
      setIsOnline(metrics.isOnline);
      setFps(metrics.fps);

      const point = cameraRuntimeService.toHistoryPoint(data);
      setHistory((prev) => cameraRuntimeService.addHistoryPoint(prev, point));
    } catch {
      // Silent fail for polling
    }
  };

  // Handle face detection from SignalR
  const handleFaceDetection = (payload: FaceRecognizedPayload) => {
    if (!detectionEventService.filterByCamera(payload, cameraId)) return;

    const event = detectionEventService.toDetectionEvent(payload);
    setLastDetection(event);
    setDetections((prev) => detectionEventService.addEvent(prev, event));
  };

  // Handle camera status from SignalR
  const handleCameraStatus = (payload: CameraStatusPayload) => {
    if (String(payload.CameraId) !== String(cameraId)) return;
    setIsOnline(payload.IsOnline);
    setFps(Math.round(payload.Fps ?? 0));
  };

  // Initial setup
  useEffect(() => {
    if (!Number.isFinite(cameraId) || cameraId <= 0) {
      toast.error("Invalid camera ID");
      navigate("/cameras");
      return;
    }

    loadCamera();

    // Subscribe to SignalR
    signalRService.subscribeCamera(String(cameraId));

    signalRService.on("ReceiveFaceRecognized", (env) => handleFaceDetection(env.Data));
    signalRService.on("ReceiveCameraStatus", (env) => handleCameraStatus(env.Data));

    // Start polling
    const interval = setInterval(pollRuntime, 2000);
    pollRuntime();

    return () => {
      clearInterval(interval);
      signalRService.off("ReceiveFaceRecognized", handleFaceDetection as any);
      signalRService.off("ReceiveCameraStatus", handleCameraStatus as any);
      signalRService.unsubscribeCamera(String(cameraId));
    };
  }, [cameraId]);

  return {
    camera,
    isLoading,
    runtime,
    history,
    isOnline,
    fps,
    lastDetection,
    detections,
    loadCamera,
    pollRuntime,
  };
}