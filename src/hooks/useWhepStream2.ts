import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { whepRegistry } from "@/lib/webrtc/whepRegistry";
import { WhepController } from "@/lib/webrtc/whepController";
import type { WhepState, WhepUiStatus as InternalStatus } from "@/lib/webrtc/whepTypes";
import type { WhepUiStatus as UiStatus } from "@/types/camera";

type WhepFrameHealthSnapshot = {
  frameFresh: boolean;
  lastFrameAtUtc: string | null;
};

type FrameCallbackVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: number, metadata: unknown) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

const defaultWhepFrameHealth: WhepFrameHealthSnapshot = {
  frameFresh: false,
  lastFrameAtUtc: null,
};

const whepFrameHealthByCamera = new Map<string, WhepFrameHealthSnapshot>();
const whepFrameHealthListeners = new Set<() => void>();

function emitWhepFrameHealth() {
  whepFrameHealthListeners.forEach((listener) => listener());
}

function setWhepFrameHealth(cameraId: string | undefined, frameFresh: boolean, lastFrameAtUtc?: string | null) {
  if (!cameraId) {
    return;
  }

  const current = whepFrameHealthByCamera.get(cameraId) ?? defaultWhepFrameHealth;
  const next: WhepFrameHealthSnapshot = {
    frameFresh,
    lastFrameAtUtc: lastFrameAtUtc === undefined ? current.lastFrameAtUtc : lastFrameAtUtc,
  };

  if (current.frameFresh === next.frameFresh && current.lastFrameAtUtc === next.lastFrameAtUtc) {
    return;
  }

  whepFrameHealthByCamera.set(cameraId, next);
  emitWhepFrameHealth();
}

function clearWhepFrameHealth(cameraId: string | undefined) {
  if (!cameraId) {
    return;
  }

  if (whepFrameHealthByCamera.delete(cameraId)) {
    emitWhepFrameHealth();
  }
}

export function useWhepFrameHealth(cameraId: string) {
  return useSyncExternalStore(
    (listener) => {
      whepFrameHealthListeners.add(listener);
      return () => {
        whepFrameHealthListeners.delete(listener);
      };
    },
    () => whepFrameHealthByCamera.get(cameraId) ?? defaultWhepFrameHealth,
    () => defaultWhepFrameHealth
  );
}

export type UseWhepStreamOptions = {
  enabled?: boolean;
  audio?: boolean;
  debug?: boolean;
  rtcConfig?: RTCConfiguration;
  pauseWhenHidden?: boolean;
  cameraId?: string;
};

function toUiStatus(s: InternalStatus): UiStatus {
  switch (s) {
    case "starting":
    case "negotiating":
    case "connecting":
      return "starting";
    case "stopping":
      return "stopped";
    case "reconnecting":
      return "reconnecting";
    case "playing":
      return "playing";
    case "stopped":
      return "stopped";
    case "error":
      return "error";
    default:
      return "idle";
  }
}

export function useWhepStream2(whepUrl: string | null, opts?: UseWhepStreamOptions) {
  const enabled = opts?.enabled ?? true;

  const controller = useMemo(() => {
    if (!whepUrl) return null;
    return whepRegistry.acquire(whepUrl, () => new WhepController({ whepUrl }));
  }, [whepUrl]);

  const [state, setState] = useState<WhepState>({
    status: "idle",
    error: null,
    sessionUrl: null,
    updatedAt: Date.now(),
  });

  const [frameFresh, setFrameFresh] = useState(false);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const lastFrameAt = useRef(0);
  const restartRequestedRef = useRef(false);
  const [attached, setAttached] = useState(false);

  const updateFrameFresh = useCallback(
    (fresh: boolean, lastFrameAtUtc?: string | null) => {
      setFrameFresh((current) => (current === fresh ? current : fresh));
      setWhepFrameHealth(opts?.cameraId, fresh, lastFrameAtUtc);
    },
    [opts?.cameraId]
  );

  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    console.log("[WHEP][Hook] videoRef called", { attached: !!el });
    videoElRef.current = el;
    controller?.attachVideo(el);
    setAttached(!!el);
  }, [controller]);

  useEffect(() => {
    if (!controller) return;
    controller.updateConfig({
      audio: opts?.audio ?? false,
      rtcConfig: opts?.rtcConfig,
      debug: opts?.debug ?? false,
      onLog: (msg, meta) => console.log(`[WHEP] ${msg}`, meta ?? ""),
    });
  }, [controller, opts?.audio, opts?.rtcConfig, opts?.debug]);

  useEffect(() => {
    if (!controller) return;
    return controller.state$.subscribe(setState);
  }, [controller]);

  useEffect(() => {
    const cameraId = opts?.cameraId;
    return () => {
      clearWhepFrameHealth(cameraId);
    };
  }, [opts?.cameraId]);

  useEffect(() => {
    if (!controller || !whepUrl) return;
    return () => {
      void controller.stop();
      void whepRegistry.release(whepUrl);
      clearWhepFrameHealth(opts?.cameraId);
    };
  }, [controller, whepUrl, opts?.cameraId]);

  useEffect(() => {
    console.log("[WHEP][Hook] start effect", {
      hasController: !!controller,
      enabled,
      attached,
      whepUrl,
    });

    if (!controller) return;

    if (!enabled || !attached) {
      console.log("[WHEP][Hook] => stop (not enabled or not attached)");
      updateFrameFresh(false);
      void controller.stop();
      return;
    }

    console.log("[WHEP][Hook] => start()");
    void controller.start();

    return () => {
      console.log("[WHEP][Hook] cleanup => stop()");
      updateFrameFresh(false);
      void controller.stop();
    };
  }, [attached, controller, enabled, updateFrameFresh, whepUrl]);

  useEffect(() => {
    if (!controller) return;
    if (!opts?.pauseWhenHidden) return;

    const onVis = () => {
      if (document.hidden) {
        updateFrameFresh(false);
        void controller.stop();
      } else if (enabled && attached) {
        void controller.start();
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [attached, controller, enabled, opts?.pauseWhenHidden, updateFrameFresh]);

  useEffect(() => {
    const video = videoElRef.current;
    if (!video || !controller) return;

    const frameVideo = video as FrameCallbackVideo;
    const supportsVideoFrameCallback = typeof frameVideo.requestVideoFrameCallback === "function";
    let videoFrameHandle: number | null = null;

    const markFrameSeen = () => {
      const wallClock = new Date();
      wallClock.setMilliseconds(0);
      lastFrameAt.current = performance.now();
      restartRequestedRef.current = false;
      updateFrameFresh(true, wallClock.toISOString());
      controller.reportProgress(video.currentTime);
    };

    const onProgress = () => {
      controller.reportProgress(video.currentTime);
      if (!supportsVideoFrameCallback) {
        markFrameSeen();
      }
    };

    if (supportsVideoFrameCallback) {
      const onVideoFrame = () => {
        markFrameSeen();
        videoFrameHandle = frameVideo.requestVideoFrameCallback?.(onVideoFrame) ?? null;
      };

      videoFrameHandle = frameVideo.requestVideoFrameCallback?.(onVideoFrame) ?? null;
    } else {
      video.addEventListener("timeupdate", onProgress);
    }

    video.addEventListener("playing", onProgress);
    video.addEventListener("canplay", onProgress);
    video.addEventListener("loadeddata", onProgress);

    return () => {
      if (videoFrameHandle !== null) {
        frameVideo.cancelVideoFrameCallback?.(videoFrameHandle);
      }

      if (!supportsVideoFrameCallback) {
        video.removeEventListener("timeupdate", onProgress);
      }

      video.removeEventListener("playing", onProgress);
      video.removeEventListener("canplay", onProgress);
      video.removeEventListener("loadeddata", onProgress);
    };
  }, [controller, updateFrameFresh, attached]);

  useEffect(() => {
    if (!controller) return;

    const interval = window.setInterval(() => {
      if (toUiStatus(state.status) !== "playing") {
        restartRequestedRef.current = false;
        updateFrameFresh(false);
        return;
      }

      if (lastFrameAt.current <= 0 || restartRequestedRef.current) {
        return;
      }

      if (performance.now() - lastFrameAt.current <= 15000) {
        return;
      }

      restartRequestedRef.current = true;
      updateFrameFresh(false);
      void controller.restart();
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [controller, state.status, updateFrameFresh]);

  useEffect(() => {
    if (toUiStatus(state.status) === "playing") {
      if (lastFrameAt.current <= 0) {
        lastFrameAt.current = performance.now();
      }
      return;
    }

    lastFrameAt.current = 0;
    restartRequestedRef.current = false;
  }, [state.status]);

  return {
    videoRef,
    status: toUiStatus(state.status),
    error: state.error ?? null,
    sessionUrl: state.sessionUrl,
    frameFresh,
    restart: () => controller?.restart(),
    stop: () => {
      updateFrameFresh(false);
      return controller?.stop();
    },
  };
}
