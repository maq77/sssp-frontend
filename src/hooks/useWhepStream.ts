import { useCallback, useEffect, useRef, useState } from "react";
import { WhepPlayer } from "@/lib/webrtc/whepPlayer";

export type WhepUiStatus =
  | "idle"
  | "starting"
  | "playing"
  | "stopped"
  | "reconnecting"
  | "error";

export type UseWhepStreamOptions = {
  enabled?: boolean;
  audio?: boolean;
  staleMs?: number;
  maxReconnectAttempts?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  pauseWhenHidden?: boolean;
  debug?: boolean;
  rtcConfig?: RTCConfiguration;
  startTimeoutMs?: number;
};

export type UseWhepStreamResult = {
  videoRef: (el: HTMLVideoElement | null) => void;
  status: WhepUiStatus;
  error: string | null;
  restart: () => void;
  stop: () => Promise<void>;
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

export function useWhepStream(
  whepUrl: string | null,
  opts?: UseWhepStreamOptions
): UseWhepStreamResult {
  const enabled = opts?.enabled ?? true;
  const audio = opts?.audio ?? false;
  const staleMs = opts?.staleMs ?? 6000;
  const maxReconnectAttempts = opts?.maxReconnectAttempts ?? 8;
  const baseBackoffMs = opts?.baseBackoffMs ?? 800;
  const maxBackoffMs = opts?.maxBackoffMs ?? 15000;
  const pauseWhenHidden = opts?.pauseWhenHidden ?? false;
  const debug = opts?.debug ?? false;
  const rtcConfig = opts?.rtcConfig;
  const startTimeoutMs = opts?.startTimeoutMs ?? 12000;

  const log = useCallback(
    (msg: string, extra?: unknown) => {
      if (!debug) return;
      console.log(`[useWhepStream] ${msg}`, extra ?? "");
    },
    [debug]
  );

  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    console.log('[useWhepStream] Video element ref updated:', !!el);
    setVideoEl(el);
  }, []);

  const [status, setStatus] = useState<WhepUiStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const statusRef = useRef<WhepUiStatus>("idle");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const currentPlayerRef = useRef<WhepPlayer | null>(null);
  const lastProgressAtRef = useRef<number>(0);
  const lastMediaTimeRef = useRef<number>(0);
  const reconnectAttemptRef = useRef<number>(0);

  const restartTokenRef = useRef(0);
  const [restartToken, setRestartToken] = useState(0);
  
  const restart = useCallback(() => {
    const newToken = restartTokenRef.current + 1;
    console.log('[useWhepStream] 🔄 Manual restart triggered, token:', newToken);
    restartTokenRef.current = newToken;
    setRestartToken(newToken);
  }, []);

  const stop = useCallback(async () => {
    console.log('[useWhepStream] 🛑 Manual stop requested');
    const p = currentPlayerRef.current;
    currentPlayerRef.current = null;
    try {
      await p?.stop();
    } catch (e) {
      console.error('[useWhepStream] Error during stop:', e);
    }
  }, []);

  const ensureAutoplay = useCallback(async (v: HTMLVideoElement) => {
    console.log('[useWhepStream] Ensuring autoplay configuration...');
    v.muted = true;
    v.playsInline = true;
    try {
      await v.play();
      console.log('[useWhepStream] ✅ Autoplay successful');
    } catch (e: any) {
      console.warn('[useWhepStream] Autoplay failed:', e.message);
    }
  }, []);

  useEffect(() => {
    console.log('[useWhepStream] ⚙️ Effect triggered:', {
      enabled,
      whepUrl,
      hasVideoEl: !!videoEl,
      restartToken,
    });

    // Stop conditions
    if (!enabled || !whepUrl) {
      log(!enabled ? "disabled → stop" : "no URL → stop");
      console.log('[useWhepStream] Stopping due to:', !enabled ? 'disabled' : 'no URL');
      stop();
      setStatus("idle");
      setError(null);
      return;
    }

    if (!videoEl) {
      log("Waiting for video element...");
      console.log('[useWhepStream] Waiting for video element...');
      return;
    }

    if (pauseWhenHidden && document.hidden) {
      log("document hidden → stopped");
      console.log('[useWhepStream] Document hidden, stopping');
      stop();
      setStatus("stopped");
      setError(null);
      return;
    }

    const url = whepUrl;
    const v = videoEl;

    const abort = new AbortController();
    let active = true;
    let myPlayer: WhepPlayer | null = null;

    const setSafeStatus = (s: WhepUiStatus) => {
      if (active) {
        console.log(`[useWhepStream] Status update: ${s}`);
        setStatus(s);
      }
    };
    
    const setSafeError = (e: string | null) => {
      if (active) {
        console.error(`[useWhepStream] Error update: ${e}`);
        setError(e);
      }
    };

    const stopLocal = async () => {
      console.log('[useWhepStream] Stopping local player...');
      const p = myPlayer;
      myPlayer = null;

      if (currentPlayerRef.current === p) currentPlayerRef.current = null;

      try {
        await p?.stop();
      } catch (e) {
        console.error('[useWhepStream] Error stopping player:', e);
      }
    };

    const onProgress = () => {
      const now = Date.now();
      const timeSinceLastProgress = now - lastProgressAtRef.current;
      
      lastProgressAtRef.current = now;

      if (Number.isFinite(v.currentTime) && v.currentTime > lastMediaTimeRef.current) {
        const delta = v.currentTime - lastMediaTimeRef.current;
        console.log('[useWhepStream] 📊 Media progress:', {
          currentTime: v.currentTime.toFixed(2),
          delta: delta.toFixed(2),
          timeSinceLastProgress,
        });
        lastMediaTimeRef.current = v.currentTime;
      }

      if (statusRef.current !== "playing") {
        console.log('[useWhepStream] Transitioning to playing state');
        setSafeStatus("playing");
      }
    };

    v.addEventListener("timeupdate", onProgress);
    v.addEventListener("playing", onProgress);
    v.addEventListener("canplay", onProgress);
    v.addEventListener("loadeddata", onProgress);

    // Additional video events for debugging
    v.addEventListener("loadstart", () => console.log('[useWhepStream] 🎬 Video: loadstart'));
    v.addEventListener("loadedmetadata", () => console.log('[useWhepStream] 🎬 Video: loadedmetadata'));
    v.addEventListener("waiting", () => console.log('[useWhepStream] ⏳ Video: waiting'));
    v.addEventListener("stalled", () => console.warn('[useWhepStream] ⚠️ Video: stalled'));
    v.addEventListener("error", (e) => console.error('[useWhepStream] ❌ Video error:', e));

    const onVis = () => {
      if (!pauseWhenHidden) return;

      if (document.hidden) {
        log("visibilitychange → hidden → stop");
        console.log('[useWhepStream] Document hidden, stopping stream');
        stopLocal();
        setSafeStatus("stopped");
        return;
      }

      lastProgressAtRef.current = 0;
      log("visibilitychange → visible");
      console.log('[useWhepStream] Document visible, allowing recovery');
    };

    document.addEventListener("visibilitychange", onVis);

    async function startOnce() {
      console.log('[useWhepStream] 🚀 Starting stream attempt...');
      
      setSafeError(null);
      setSafeStatus("starting");

      reconnectAttemptRef.current = 0;
      lastProgressAtRef.current = Date.now();
      lastMediaTimeRef.current = v.currentTime || 0;

      await ensureAutoplay(v);

      console.log('[useWhepStream] 🔧 Creating WhepPlayer instance...');
      
      const p = new WhepPlayer({
        whepUrl: url,
        videoEl: v,
        audio,
        rtcConfig,
        onStatus: (s) => {
          log(`player status: ${s}`);
          console.log(`[useWhepStream] 📊 WhepPlayer status: ${s}`);
          if (!active) return;

          if (s === "playing") setSafeStatus("playing");
          else if (s === "stopped") setSafeStatus("stopped");
          else if (s === "error") setSafeStatus("error");
          else if (s === "connecting" || s === "negotiating" || s === "starting") setSafeStatus("starting");
        },
        onDebug: (m, ex) => {
          log(`[WhepPlayer] ${m}`, ex);
          console.log(`[useWhepStream] 🔍 WhepPlayer debug: ${m}`, ex || '');
        },
        onError: (err) => {
          console.error('[useWhepStream] ❌ WhepPlayer error:', err);
          setSafeError(err.message);
          setSafeStatus("error");
        },
      });

      myPlayer = p;
      currentPlayerRef.current = p;

      console.log('[useWhepStream] ⏱️ Starting player with timeout protection...', {
        url,
        timeout: startTimeoutMs,
        hasVideo: !!v,
        videoReadyState: v.readyState,
      });
      
      try {
        await Promise.race([
          p.start(),
          (async () => {
            await sleep(startTimeoutMs, abort.signal);
            throw new Error(`WHEP start timeout after ${startTimeoutMs}ms`);
          })(),
        ]);
        console.log('[useWhepStream] ✅ WhepPlayer.start() completed successfully');
      } catch (err: any) {
        console.error('[useWhepStream] ❌ WhepPlayer.start() failed:', err);
        throw err;
      }

      lastProgressAtRef.current = Date.now();
      await ensureAutoplay(v);
      
      console.log('[useWhepStream] ✅ Stream started successfully');
    }

    async function run() {
      console.log('[useWhepStream] 🎬 Main run loop starting...');
      
      await stopLocal();

      try {
        await startOnce();
      } catch (e: any) {
        console.error('[useWhepStream] Initial start failed:', e);
        setSafeError(e?.message ?? String(e));
        setSafeStatus("error");
      }

      console.log('[useWhepStream] Entering monitoring loop...');
      
      while (active && !abort.signal.aborted) {
        try {
          await sleep(1000, abort.signal);
        } catch {
          break;
        }

        if (pauseWhenHidden && document.hidden) {
          await stopLocal();
          setSafeStatus("stopped");
          continue;
        }

        const now = Date.now();
        const timeSinceProgress = now - lastProgressAtRef.current;
        const stale = timeSinceProgress > staleMs;

        const moved =
          Number.isFinite(v.currentTime) && v.currentTime > lastMediaTimeRef.current + 0.01;

        if (moved) {
          lastMediaTimeRef.current = v.currentTime;
          lastProgressAtRef.current = now;
          continue;
        }

        // Reconnection logic
        if (statusRef.current === "playing" && stale) {
          reconnectAttemptRef.current += 1;

          console.warn('[useWhepStream] ⚠️ Stream stalled, reconnecting...', {
            attempt: reconnectAttemptRef.current,
            timeSinceProgress,
            staleThreshold: staleMs,
          });

          if (reconnectAttemptRef.current > maxReconnectAttempts) {
            console.error('[useWhepStream] Max reconnect attempts reached');
            setSafeStatus("error");
            setSafeError("Stream stalled. Max reconnect attempts reached.");
            break;
          }

          setSafeStatus("reconnecting");

          const backoff = jitter(
            nextBackoff(reconnectAttemptRef.current, baseBackoffMs, maxBackoffMs)
          );

          log("stalled → reconnect", { attempt: reconnectAttemptRef.current, backoff });
          console.log(`[useWhepStream] Reconnecting with ${backoff}ms backoff...`);

          await stopLocal();
          try {
            await sleep(backoff, abort.signal);
          } catch {
            break;
          }

          try {
            await startOnce();
            reconnectAttemptRef.current = 0;
            console.log('[useWhepStream] ✅ Reconnection successful');
          } catch (e: any) {
            console.error('[useWhepStream] Reconnection failed:', e);
            setSafeError(e?.message ?? String(e));
            setSafeStatus("error");
          }
        }
      }
      
      console.log('[useWhepStream] Main run loop exited');
    }

    run();

    return () => {
      console.log('[useWhepStream] 🧹 Cleanup triggered');
      active = false;
      abort.abort();

      document.removeEventListener("visibilitychange", onVis);

      v.removeEventListener("timeupdate", onProgress);
      v.removeEventListener("playing", onProgress);
      v.removeEventListener("canplay", onProgress);
      v.removeEventListener("loadeddata", onProgress);

      stopLocal();
    };
  }, [
    enabled,
    whepUrl,
    videoEl,
    restartToken,
    audio,
    rtcConfig,
    staleMs,
    maxReconnectAttempts,
    baseBackoffMs,
    maxBackoffMs,
    pauseWhenHidden,
    startTimeoutMs,
    ensureAutoplay,
    stop,
    log,
  ]);

  return { videoRef, status, error, restart, stop };
}