import type { UpdateCameraRequest } from "@/types";


export type WhepUiStatus =
  | "idle"
  | "starting"
  | "playing"
  | "reconnecting"
  | "stopped"
  | "error";

export type TabKey = "live" | "metrics" | "events" | "settings";


export type RuntimePoint = {
  t: string;
  fps: number;
  q: number;
  drop: number;
  ai: number;
  match: number;
  total: number;
};

export type CameraRuntimeDto = {
  IsRunning?: boolean;
  LastFrameUtc?: string;
  Fps?: number;

  QueueDepth?: number;
  DroppedFrames?: number;

  AvgAiMs?: number;
  AvgMatchMs?: number;
  AvgTotalMs?: number;

  UpTimeSeconds?: number;
  LastError?: string | null;

  DeepStreamDesiredPipelineVersion?: string | null;
  DeepStreamDesiredInstanceId?: string | null;
  DeepStreamActivePipelineVersion?: string | null;
  DeepStreamActiveInstanceId?: string | null;
  DeepStreamFaceAccepted?: number;
  DeepStreamObjectAccepted?: number;
  DeepStreamBehaviorAccepted?: number;
  DeepStreamZoneAccepted?: number;
  DeepStreamAnomalyAccepted?: number;
  DeepStreamRejectedVersionMismatch?: number;
  DeepStreamRejectedInstanceMismatch?: number;
  DeepStreamRejectedConcurrentInstance?: number;
};

export type CameraEditForm = Omit<UpdateCameraRequest, "name" | "rtspUrl"> & {
  name: string;
  rtspUrl: string;
};
