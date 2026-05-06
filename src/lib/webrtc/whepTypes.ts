export type WhepUiStatus =
  | "idle"
  | "starting"
  | "negotiating"
  | "connecting"
  | "playing"
  | "reconnecting"
  | "stopping"
  | "stopped"
  | "error";

export type WhepState = {
  status: WhepUiStatus;
  error: string | null;
  sessionUrl: string | null;
  updatedAt: number;
};
