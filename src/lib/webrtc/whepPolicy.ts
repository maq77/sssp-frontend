export type WhepPolicy = {
  staleMs: number;
  maxReconnectAttempts: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  iceGatheringTimeoutMs: number;
  waitForIceGathering: boolean;
  requestTimeoutMs: number;
};

export const defaultWhepPolicy: WhepPolicy = {
  staleMs: 6000,
  maxReconnectAttempts: 8,
  baseBackoffMs: 800,
  maxBackoffMs: 15000,
  iceGatheringTimeoutMs: 2500,
  waitForIceGathering: true,
  requestTimeoutMs: 10000,
};
