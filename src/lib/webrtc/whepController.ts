import { Emitter } from "@/lib/core/emitter";
import type { WhepState, WhepUiStatus } from "./whepTypes";
import { WhepHttpClient } from "./whepHttpClient";
import { PeerConnectionFactory } from "./peerFactory";
import { MediaBinder } from "./mediaBinder";

export type WhepControllerConfig = {
  whepUrl: string;
  audio?: boolean;
  rtcConfig?: RTCConfiguration;

  iceGatheringTimeoutMs?: number;
  waitForIceGathering?: boolean;

  staleMs?: number;
  maxReconnectAttempts?: number;

  baseBackoffMs?: number;
  maxBackoffMs?: number;

  // Observability hooks
  debug?: boolean;
  onLog?: (msg: string, meta?: any) => void;
};

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);

    const onAbort = () => {
      window.clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function jitter(ms: number) {
  const j = ms * 0.2;
  return Math.max(0, ms + (Math.random() * 2 - 1) * j);
}

function nextBackoff(attempt: number, base: number, max: number) {
  const exp = base * Math.pow(2, Math.max(0, attempt - 1));
  return Math.min(max, exp);
}

async function waitIceComplete(pc: RTCPeerConnection, timeoutMs: number) {
  if (pc.iceGatheringState === "complete") return;

  await new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(() => {
      cleanup();
      reject(new Error("ICE gathering timeout"));
    }, timeoutMs);

    const onState = () => {
      if (pc.iceGatheringState === "complete") {
        cleanup();
        resolve();
      }
    };

    function cleanup() {
      window.clearTimeout(t);
      pc.removeEventListener("icegatheringstatechange", onState);
    }

    pc.addEventListener("icegatheringstatechange", onState);
  });
}

export class WhepController {
  readonly state$ = new Emitter<WhepState>();

  private cfg: Required<
    Pick<
      WhepControllerConfig,
      | "iceGatheringTimeoutMs"
      | "waitForIceGathering"
      | "staleMs"
      | "maxReconnectAttempts"
      | "baseBackoffMs"
      | "maxBackoffMs"
      | "debug"
    >
  > & WhepControllerConfig;

  private http = new WhepHttpClient(10_000);
  private peerFactory = new PeerConnectionFactory();
  private binder = new MediaBinder();

  private pc: RTCPeerConnection | null = null;
  private sessionUrl: string | null = null;
  private detachVideo: null | (() => void) = null;

  private status: WhepUiStatus = "idle";
  private error: string | null = null;

  private videoEl: HTMLVideoElement | null = null;

  private runAbort: AbortController | null = null;
  private runId = 0;
  private startPromise: Promise<void> | null = null;

  private lastProgressAt = 0;
  private lastMediaTime = 0;

  private reconnectAttempt = 0;

  constructor(cfg: WhepControllerConfig) {
    this.cfg = {
      iceGatheringTimeoutMs: 2500,
      waitForIceGathering: true,
      staleMs: 6000,
      maxReconnectAttempts: 8,
      baseBackoffMs: 800,
      maxBackoffMs: 15000,
      debug: false,
      ...cfg,
    };
    this.emit();
  }

  updateConfig(next: Partial<WhepControllerConfig>) {
    this.cfg = { ...this.cfg, ...next } as any;
  }

  attachVideo(videoEl: HTMLVideoElement | null) {
    this.videoEl = videoEl;
  }

  private log(msg: string, meta?: any) {
    if (!this.cfg.debug) return;
    this.cfg.onLog?.(msg, meta);
  }

  private setStatus(s: WhepUiStatus, err?: string | null) {
    this.status = s;
    if (err !== undefined) this.error = err;
    this.emit();
  }

  private emit() {
    this.state$.emit({
      status: this.status,
      error: this.error,
      sessionUrl: this.sessionUrl,
      updatedAt: Date.now(),
    });
  }

  /** Public: idempotent start (single-flight) */
  start() {
    if (this.startPromise) return this.startPromise;
    console.log("WHEP Controller start");
    this.startPromise = this.run().catch((e) => {
    this.log("start() failed", { message: e?.message, name: e?.name, e });
    this.setStatus("error", e?.message ?? "WHEP start failed");
    throw e;
  }).finally(() => {
    this.startPromise = null;
  });

    return this.startPromise;
  }

  /** Public: stop (async but safe to call fire-and-forget) */
  async stop() {
    this.runAbort?.abort();
    this.runAbort = null;

    await this.cleanup();
    this.setStatus("stopped", null);
  }

  async restart() {
    await this.stop();
    await this.start();
  }

  /**
   * UI tells us media is progressing.
   * IMPORTANT: only allow "playing" after session established.
   */
  reportProgress(currentTime: number) {
    if (!this.sessionUrl) return;
    const now = Date.now();
    this.lastProgressAt = now;

    if (Number.isFinite(currentTime) && currentTime > this.lastMediaTime) {
      this.lastMediaTime = currentTime;
    }

    if (this.sessionUrl && this.pc && this.status !== "playing") {
      this.setStatus("playing");
    }
  }

  private stillValid(myRunId: number, abort: AbortController) {
    return this.runId === myRunId && !abort.signal.aborted;
  }

  private async run(): Promise<void> {
    this.log("run() entered", {
    whepUrl: this.cfg.whepUrl,
    hasVideo: !!this.videoEl,
    hasPc: !!this.pc,
    status: this.status,
  });
    const videoEl = this.videoEl;
    if (!videoEl) {
        this.log("run() abort: video not attached");
      this.setStatus("error", "Video element not attached");
      return;
    }

    const myRunId = ++this.runId;
    const abort = new AbortController();
    this.runAbort = abort;

    // always from clean state
    this.setStatus("starting", null);
    await this.cleanup();
    if (!this.stillValid(myRunId, abort)) return;

    this.reconnectAttempt = 0;

    // main loop: start stream, then watchdog, then reconnect if needed
    while (this.stillValid(myRunId, abort)) {
      try {
        await this.startOnce(myRunId, abort, videoEl);
        if (!this.stillValid(myRunId, abort)) return;

        // watchdog
        this.lastProgressAt = Date.now();
        this.lastMediaTime = videoEl.currentTime || 0;

        while (this.stillValid(myRunId, abort)) {
          await sleep(1000, abort.signal).catch(() => {});
          if (!this.stillValid(myRunId, abort)) break;

          const stale = Date.now() - this.lastProgressAt > this.cfg.staleMs;

          if (this.status === "playing" && stale) {
            this.reconnectAttempt += 1;

            if (this.reconnectAttempt > this.cfg.maxReconnectAttempts) {
              this.setStatus("error", "Stream stalled. Max reconnect attempts reached.");
              return;
            }

            this.setStatus("reconnecting", null);

            const backoff = jitter(
              nextBackoff(this.reconnectAttempt, this.cfg.baseBackoffMs, this.cfg.maxBackoffMs)
            );

            this.log("WHEP stalled; reconnecting", { attempt: this.reconnectAttempt, backoff });

            await this.cleanup();
            if (!this.stillValid(myRunId, abort)) return;

            await sleep(backoff, abort.signal).catch(() => {});
            break; // break watchdog -> re-enter startOnce
          }
        }
      } catch (e: any) {
        if (!this.stillValid(myRunId, abort)) return;

        // Abort is not a real failure
        if (e?.name === "AbortError") {
          this.log("Run aborted");
          return;
        }

        this.reconnectAttempt += 1;

        if (this.reconnectAttempt > this.cfg.maxReconnectAttempts) {
          this.setStatus("error", e?.message ?? "WHEP error");
          return;
        }

        this.setStatus("reconnecting", e?.message ?? "WHEP error");
        const backoff = jitter(
          nextBackoff(this.reconnectAttempt, this.cfg.baseBackoffMs, this.cfg.maxBackoffMs)
        );

        await this.cleanup();
        if (!this.stillValid(myRunId, abort)) return;

        await sleep(backoff, abort.signal).catch(() => {});
        // loop continues and tries again
      }
    }
  }

  private async startOnce(myRunId: number, abort: AbortController, videoEl: HTMLVideoElement) {
    const t0 = performance.now();
    const mark = (name: string) =>
    this.log(`⏱ ${name}`, { ms: Math.round(performance.now() - t0) });
    mark("begin");
    this.log("startOnce: begin");
    if (!this.stillValid(myRunId, abort)) return;
    console.log("WHEP Controller start once !!");
    this.setStatus("negotiating", null);

    this.log("startOnce: create pc");
    const pc = this.peerFactory.create({
      rtcConfig: this.cfg.rtcConfig,
      audio: this.cfg.audio,
    });
    this.pc = pc;

    pc.addEventListener("iceconnectionstatechange", () =>
    this.log("pc.iceConnectionState", { v: pc.iceConnectionState })
    );
    pc.addEventListener("connectionstatechange", () =>
        this.log("pc.connectionState", { v: pc.connectionState })
    );
    pc.addEventListener("icegatheringstatechange", () =>
        this.log("pc.iceGatheringState", { v: pc.iceGatheringState })
    );
    pc.addEventListener("signalingstatechange", () =>
        this.log("pc.signalingState", { v: pc.signalingState })
    );

    this.log("startOnce: bindVideo");
    this.detachVideo = this.binder.bindVideo(videoEl, pc);

    this.log("startOnce: auto play pre-offer");
    this.log("ensureAutoplay (pre-offer) start");
    void this.binder.ensureAutoplay(videoEl)
    .then(() => this.log("ensureAutoplay (pre-offer) ok"))
    .catch((e) => this.log("ensureAutoplay (pre-offer) fail", { e }));

    if (!this.stillValid(myRunId, abort)) return;
    mark("createOffer:start");
    console.log("WHEP Controller before creat offer");
    const offer = await pc.createOffer();

    console.log("WHEP Controller after creat offer");
    mark("createOffer:done");

    mark("setLocalDescription:start");
    this.log("startOnce: set local desc");
    await pc.setLocalDescription(offer);
    mark("setLocalDescription:done");

    
    if (this.cfg.waitForIceGathering) {
    mark("waitIceComplete:start");
    this.log("startOnce: waitIceComplete");
    await waitIceComplete(pc, this.cfg.iceGatheringTimeoutMs);
    this.log("startOnce: waitIceComplete done");
    mark("waitIceComplete:done");
  }
    if (!this.stillValid(myRunId, abort)) return;

    const sdp = pc.localDescription?.sdp;
    if (!sdp) throw new Error("No local SDP");

    const whepUrlAbs = new URL(this.cfg.whepUrl, window.location.href).toString();

    mark("postOffer:start");
    this.log("POST offer -> WHEP", { whepUrlAbs, sdpLen: sdp.length });
    const { location, answerSdp } = await this.http.postOffer(whepUrlAbs, sdp);
    this.log("POST OK", { location, answerLen: answerSdp.length });
    mark("postOffer:done");

    if (!this.stillValid(myRunId, abort)) return;

    this.sessionUrl = location;

    this.setStatus("connecting", null);
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    if (!this.stillValid(myRunId, abort)) return;

    this.log("startOnce: ensureAutoplay (post-answer) start");
    void this.binder.ensureAutoplay(videoEl)
    .then(() => this.log("startOnce: ensureAutoplay (post-answer) ok"))
    .catch((e) => this.log("startOnce: ensureAutoplay (post-answer) fail", { e }));

    // Only now it’s legit to say playing
    this.setStatus("connecting", null);
    this.reconnectAttempt = 0;
    this.log("startOnce: done");

  }

  private async cleanup() {
    // don't spam stopping if already idle
    if (this.status !== "idle" && this.status !== "stopped") {
      this.setStatus("stopping", null);
    }

    const pc = this.pc;
    const sessionUrl = this.sessionUrl;

    this.pc = null;
    this.sessionUrl = null;

    try {
      if (sessionUrl) {
        await this.http.deleteSession(sessionUrl);
      }
    } finally {
      try {
        this.detachVideo?.();
        this.detachVideo = null;

        if (pc) {
          try {
            pc.getTransceivers?.().forEach((t) => {
              try { (t as any).stop?.(); } catch {}
            });
          } catch {}
          pc.close();
        }
      } catch {}
    }
  }
}
