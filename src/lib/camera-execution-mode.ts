const STORAGE_KEY = "sssp.camera.executionMode";

export const CAMERA_EXECUTION_MODES = [
  { value: "legacy", label: "Legacy MTCNN" },
  { value: "deepstream-v1", label: "DeepStream V1" },
  { value: "deepstream-v2", label: "DeepStream V2" },
  { value: "deepstream-v3-light", label: "DeepStream V3 Light" },
] as const;

export type CameraExecutionMode = (typeof CAMERA_EXECUTION_MODES)[number]["value"];

const DEFAULT_MODE: CameraExecutionMode = "deepstream-v2";

export function isCameraExecutionMode(value: string): value is CameraExecutionMode {
  return CAMERA_EXECUTION_MODES.some((mode) => mode.value === value);
}

export function getDefaultCameraExecutionMode(): CameraExecutionMode {
  if (typeof window === "undefined") return DEFAULT_MODE;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && isCameraExecutionMode(stored)) return stored;

  return DEFAULT_MODE;
}

export function setDefaultCameraExecutionMode(mode: CameraExecutionMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
}
