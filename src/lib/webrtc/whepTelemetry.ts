export type WhepTelemetryEvent =
  | { type: "status"; status: string; at: number; url: string }
  | { type: "error"; message: string; at: number; url: string }
  | { type: "metric"; name: string; value: number; at: number; url: string }
  | { type: "debug"; message: string; at: number; url: string; extra?: unknown };

export interface WhepTelemetry {
  emit(e: WhepTelemetryEvent): void;
}

export class ConsoleWhepTelemetry implements WhepTelemetry {
  emit(e: WhepTelemetryEvent) {
    if (e.type === "error") console.error("[WHEP]", e);
    else console.log("[WHEP]", e);
  }
}
