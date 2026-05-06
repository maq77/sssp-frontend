export type CameraRuntimeStatus = {
  CameraId: number;
  IsRunning: boolean;

  Fps?: number;
  TargetFps?: number;

  QueueDepth?: number;
  QueueCapacity?: number;
  DroppedFrames?: number;

  AvgAiMs?: number;
  AvgMatchMs?: number;
  AvgTotalMs?: number;

  LastFrameUtc?: string;
  StartedAtUtc?: string;

  UpTimeSeconds?: number;
  LastError?: string;

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
