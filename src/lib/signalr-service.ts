// src/lib/signalr-service.ts
import * as signalR from "@microsoft/signalr";
import { getRuntimeConfig } from "@/lib/config/runtimeConfig";
import type {
  RealtimeEnvelope,
  FaceRecognizedPayload,
  CameraTrackingPayload,
  CameraStatusPayload,
  SensorAlertPayload,
  SystemNotificationPayload,
  IncidentResponse,
  DeepStreamReadyPayload,
  DeepStreamBehaviorAlertPayload,
  SuspicionAlertPayload,
  PersonExpiredPayload,
  CrossCameraReIdPayload,
  BBoxTrackPayload,
} from "@/types";

type EventMap = {
  Receive: RealtimeEnvelope;
  ReceiveFaceRecognized: RealtimeEnvelope<FaceRecognizedPayload>;
  ReceiveIncident: RealtimeEnvelope<IncidentResponse>;
  ReceiveIncidentAssigned: RealtimeEnvelope<unknown>;
  ReceiveCameraStatus: RealtimeEnvelope<CameraStatusPayload>;
  ReceiveCameraTracking: RealtimeEnvelope<CameraTrackingPayload>;
  ReceiveSensorAlert: RealtimeEnvelope<SensorAlertPayload>;
  ReceiveSystem: RealtimeEnvelope<SystemNotificationPayload>;
  ReceiveDeepStreamReady: RealtimeEnvelope<DeepStreamReadyPayload>;
  ReceiveBehaviorAlert: RealtimeEnvelope<DeepStreamBehaviorAlertPayload>;
  ReceiveSuspicionAlert: RealtimeEnvelope<SuspicionAlertPayload>;
  ReceivePersonExpired: RealtimeEnvelope<PersonExpiredPayload>;
  ReceiveCrossCameraReId: RealtimeEnvelope<CrossCameraReIdPayload>;
  ReceiveBBoxTrack: RealtimeEnvelope<BBoxTrackPayload>;

  // some servers call a generic "event" client method
  event: unknown;
  Event: unknown;
};

type EventName = keyof EventMap;
type EventCallback<E extends EventName> = (envelope: EventMap[E]) => void;
type AnyCallback = (envelope: EventMap[EventName]) => void;

type PendingInvoke = { method: string; args: unknown[] };

const signalrDedupWindowMs = 10_000;
const signalrDedupPurgeThreshold = 256;

let signalrDroppedDuplicates = 0;

function extractEnvelopeMessageId(envelope: unknown): string | null {
  if (!envelope || typeof envelope !== "object") {
    return null;
  }

  const candidate =
    (envelope as { MessageId?: unknown; messageId?: unknown }).MessageId
    ?? (envelope as { MessageId?: unknown; messageId?: unknown }).messageId;

  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate : null;
}

export function getSignalrDroppedDuplicates() {
  return signalrDroppedDuplicates;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private listeners: Partial<Record<EventName, Set<AnyCallback>>> = {};
  private maxReconnectAttempts = 10;
  private recentMessageIds = new Map<string, number>();

  private connecting: Promise<void> | null = null;
  private pendingInvokes: PendingInvoke[] = [];
  private _tokenFactory: (() => string | Promise<string>) | null = null;
  private _closeRecoveryTimer: ReturnType<typeof setTimeout> | null = null;

  private subscribedCameras = new Set<string>();
  private subscribedOperators = new Set<number>();
  private subscribedIncidents = new Set<number>();

  async connect(getToken: string | (() => string | Promise<string>)) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;
    if (this.connecting) return this.connecting;

    const tokenFactory: () => string | Promise<string> =
      typeof getToken === "function" ? getToken : () => getToken;

    // Store so onclose recovery can use the latest-token factory.
    this._tokenFactory = tokenFactory;

    const { signalrHub } = getRuntimeConfig();
    const hubUrl = signalrHub || (import.meta.env.VITE_SIGNALR_HUB || "/hubs/notifications");

    this.connecting = (async () => {
      if (this.connection) {
        try {
          await this.connection.stop();
        } catch {
          // ignore
        }
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: tokenFactory,
          withCredentials: false,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (ctx) => {
            if (ctx.previousRetryCount >= this.maxReconnectAttempts) return null;
            return Math.min(1000 * Math.pow(2, ctx.previousRetryCount), 30000);
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupEventHandlers();

      await this.connection.start();
      // eslint-disable-next-line no-console
      console.log("[SignalR] Connected. ConnectionId:", this.connection.connectionId);

      await this.joinGlobal();
      await this.restoreSubscriptions();
      this.flushPending();
    })()
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error("[SignalR] connect failed:", e);
        throw e;
      })
      .finally(() => {
        this.connecting = null;
      });

    return this.connecting;
  }

  private setupEventHandlers() {
    if (!this.connection) return;
    const c = this.connection;

    // clear old handlers (avoid double binding)
    const names: EventName[] = [
      "Receive",
      "ReceiveFaceRecognized",
      "ReceiveIncident",
      "ReceiveIncidentAssigned",
      "ReceiveCameraStatus",
      "ReceiveCameraTracking",
      "ReceiveSensorAlert",
      "ReceiveSystem",
      "ReceiveDeepStreamReady",
      "ReceiveBehaviorAlert",
      "ReceiveSuspicionAlert",
      "ReceivePersonExpired",
      "ReceiveCrossCameraReId",
      "event",
      "Event",
    ];
    names.forEach((n) => c.off(n));

    c.on("Receive", (envelope: EventMap["Receive"]) => this.notifyListeners("Receive", envelope));
    c.on("ReceiveFaceRecognized", (envelope: EventMap["ReceiveFaceRecognized"]) =>
      this.notifyListeners("ReceiveFaceRecognized", envelope)
    );
    c.on("ReceiveIncident", (envelope: EventMap["ReceiveIncident"]) =>
      this.notifyListeners("ReceiveIncident", envelope)
    );
    c.on("ReceiveIncidentAssigned", (envelope: EventMap["ReceiveIncidentAssigned"]) =>
      this.notifyListeners("ReceiveIncidentAssigned", envelope)
    );
    c.on("ReceiveCameraStatus", (envelope: EventMap["ReceiveCameraStatus"]) =>
      this.notifyListeners("ReceiveCameraStatus", envelope)
    );
    c.on("ReceiveCameraTracking", (envelope: EventMap["ReceiveCameraTracking"]) =>
      this.notifyListeners("ReceiveCameraTracking", envelope)
    );
    c.on("ReceiveSensorAlert", (envelope: EventMap["ReceiveSensorAlert"]) =>
      this.notifyListeners("ReceiveSensorAlert", envelope)
    );
    c.on("ReceiveSystem", (envelope: EventMap["ReceiveSystem"]) =>
      this.notifyListeners("ReceiveSystem", envelope)
    );
    c.on("ReceiveDeepStreamReady", (envelope: EventMap["ReceiveDeepStreamReady"]) =>
      this.notifyListeners("ReceiveDeepStreamReady", envelope)
    );
    c.on("ReceiveBehaviorAlert", (envelope: EventMap["ReceiveBehaviorAlert"]) =>
      this.notifyListeners("ReceiveBehaviorAlert", envelope)
    );
    c.on("ReceiveSuspicionAlert", (envelope: EventMap["ReceiveSuspicionAlert"]) =>
      this.notifyListeners("ReceiveSuspicionAlert", envelope)
    );
    c.on("ReceivePersonExpired", (envelope: EventMap["ReceivePersonExpired"]) =>
      this.notifyListeners("ReceivePersonExpired", envelope)
    );
    c.on("ReceiveCrossCameraReId", (envelope: EventMap["ReceiveCrossCameraReId"]) =>
      this.notifyListeners("ReceiveCrossCameraReId", envelope)
    );
    c.on("ReceiveBBoxTrack", (envelope: EventMap["ReceiveBBoxTrack"]) =>
      this.notifyListeners("ReceiveBBoxTrack", envelope)
    );

    // silence "No client method with the name 'event' found."
    c.on("event", (payload: unknown) => {
      this.notifyListeners("event", payload);
    });
    c.on("Event", (payload: unknown) => {
      this.notifyListeners("Event", payload);
    });

    c.onreconnecting((error) => {
      // eslint-disable-next-line no-console
      console.warn("[SignalR] Reconnecting...", error);
    });

    c.onreconnected(async (connectionId) => {
      // eslint-disable-next-line no-console
      console.log("[SignalR] Reconnected. ConnectionId:", connectionId);
      try {
        await this.joinGlobal();
        await this.restoreSubscriptions();
        this.flushPending();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[SignalR] Failed to restore subscriptions after reconnect:", e);
      }
    });

    c.onclose((error) => {
      // eslint-disable-next-line no-console
      console.error("[SignalR] Permanently closed.", error);

      // Automatic reconnect exhausted its retry budget — schedule a manual recovery
      // so the page doesn't silently go dark without a refresh.
      if (this._tokenFactory) {
        const factory = this._tokenFactory;
        if (this._closeRecoveryTimer !== null) clearTimeout(this._closeRecoveryTimer);
        this._closeRecoveryTimer = setTimeout(() => {
          this._closeRecoveryTimer = null;
          // eslint-disable-next-line no-console
          console.log("[SignalR] Attempting recovery after permanent close...");
          void this.connect(factory).catch((e) => {
            // eslint-disable-next-line no-console
            console.error("[SignalR] Recovery attempt failed:", e);
          });
        }, 5000);
      }
    });
  }

  private notifyListeners<E extends EventName>(event: E, envelope: EventMap[E]) {
    const messageId = extractEnvelopeMessageId(envelope);
    if (messageId) {
      const now = performance.now();
      const dedupKey = `${String(event)}:${messageId}`;
      const insertedAt = this.recentMessageIds.get(dedupKey);

      if (insertedAt !== undefined && now - insertedAt < signalrDedupWindowMs) {
        signalrDroppedDuplicates += 1;
        return;
      }

      this.recentMessageIds.set(dedupKey, now);

      if (this.recentMessageIds.size > signalrDedupPurgeThreshold) {
        this.purgeRecentMessageIds(now);
      }
    }

    const set = this.listeners[event];
    if (!set) return;
    set.forEach((cb) => cb(envelope as EventMap[EventName]));
  }

  private purgeRecentMessageIds(now: number) {
    for (const [messageId, insertedAt] of this.recentMessageIds) {
      if (now - insertedAt >= signalrDedupWindowMs) {
        this.recentMessageIds.delete(messageId);
      }
    }
  }

  on<E extends EventName>(event: E, callback: EventCallback<E>) {
    if (!this.listeners[event]) this.listeners[event] = new Set<AnyCallback>();
    this.listeners[event]!.add(callback as unknown as AnyCallback);
    return () => this.off(event, callback);
  }

  off<E extends EventName>(event: E, callback: EventCallback<E>) {
    this.listeners[event]?.delete(callback as unknown as AnyCallback);
  }

  async joinGlobal() {
    await this.invoke("JoinGlobal");
  }

  async subscribeCamera(cameraId: string) {
    if (!cameraId) return;
    this.subscribedCameras.add(cameraId);
    await this.invoke("SubscribeCamera", cameraId);
  }

  async unsubscribeCamera(cameraId: string) {
    if (!cameraId) return;
    this.subscribedCameras.delete(cameraId);
    await this.invoke("UnsubscribeCamera", cameraId);
  }

  async subscribeOperator(operatorId: number) {
    if (!Number.isFinite(operatorId)) return;
    this.subscribedOperators.add(operatorId);
    await this.invoke("SubscribeOperator", operatorId);
  }

  async subscribeIncident(incidentId: number) {
    if (!Number.isFinite(incidentId)) return;
    this.subscribedIncidents.add(incidentId);
    await this.invoke("SubscribeIncident", incidentId);
  }

  private async invoke(methodName: string, ...args: unknown[]) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke(methodName, ...args);
        return;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`invoke failed: ${methodName}`, error);
        return;
      }
    }

    this.pendingInvokes.push({ method: methodName, args });
  }

  private flushPending() {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) return;
    const pending = [...this.pendingInvokes];
    this.pendingInvokes = [];
    pending.forEach((p) => void this.invoke(p.method, ...p.args));
  }

  private async restoreSubscriptions() {
    for (const camId of this.subscribedCameras) await this.invoke("SubscribeCamera", camId);
    for (const opId of this.subscribedOperators) await this.invoke("SubscribeOperator", opId);
    for (const incId of this.subscribedIncidents) await this.invoke("SubscribeIncident", incId);
  }

  async disconnect() {
    // Cancel any pending recovery timer so a deliberate logout/disconnect
    // does not trigger a reconnect 5 s later.
    if (this._closeRecoveryTimer !== null) {
      clearTimeout(this._closeRecoveryTimer);
      this._closeRecoveryTimer = null;
    }
    this._tokenFactory = null;

    try {
      if (this.connection) await this.connection.stop();
    } finally {
      this.connection = null;
      this.listeners = {};
      this.pendingInvokes = [];
      this.subscribedCameras.clear();
      this.subscribedOperators.clear();
      this.subscribedIncidents.clear();
      this.recentMessageIds.clear();
      // eslint-disable-next-line no-console
      console.log("[SignalR] Disconnected.");
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
export default signalRService;
