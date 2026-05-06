/**
 * useBBoxPredictor
 * Receives bbox updates at ~5-10 FPS from SignalR and outputs smooth 60-FPS
 * positions using a 3-sample velocity predictor + requestAnimationFrame loop.
 *
 * Key properties:
 * - No React state in the rAF loop (uses refs to avoid re-render overhead)
 * - Velocity computed from last 3 samples, weighted toward most-recent pair
 * - Extrapolation clamped to 500 ms past last update (freeze after that)
 * - Tracks fade out over 800 ms after disappearance (opacity 1 → 0)
 * - rAF loop pauses when no tracks are active
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Public types ────────────────────────────────────────────────────────────

export interface BBoxSample {
  x: number;
  y: number;
  w: number;
  h: number;
  t: number; // performance.now() at receipt
}

export interface TrackInput {
  trackId: number;
  bbox: { x: number; y: number; w: number; h: number };
  label: string;
  behavior: string | null;
  confidence: number;
  severity: "info" | "warning" | "critical";
  sourceWidth: number;
  sourceHeight: number;
  receivedAt: number; // performance.now()
}

export interface PredictedTrack {
  trackId: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  behavior: string | null;
  confidence: number;
  severity: "info" | "warning" | "critical";
  sourceWidth: number;
  sourceHeight: number;
  opacity: number;
  stale: boolean;
}

export type PredictedTracks = Map<number, PredictedTrack>;

// ─── Internal types ──────────────────────────────────────────────────────────

interface InternalTrackState {
  samples: BBoxSample[];
  lastInput: TrackInput;
  vx: number;
  vy: number;
  vw: number;
  vh: number;
  disappearedAt: number | null;
}

const MAX_VELOCITY_PX_MS = 3.0; // 3000 px/s cap
const EXTRAPOLATE_MAX_MS = 500;
const FADE_DURATION_MS = 800;

function clampVelocity(v: number): number {
  return Math.max(-MAX_VELOCITY_PX_MS, Math.min(MAX_VELOCITY_PX_MS, v));
}

function computeVelocities(samples: BBoxSample[]): {
  vx: number; vy: number; vw: number; vh: number;
} {
  if (samples.length < 2) return { vx: 0, vy: 0, vw: 0, vh: 0 };

  const s0 = samples[samples.length - 2];
  const s1 = samples[samples.length - 1];
  const dt01 = Math.max(1, s1.t - s0.t);

  const v01 = {
    x: (s1.x - s0.x) / dt01,
    y: (s1.y - s0.y) / dt01,
    w: (s1.w - s0.w) / dt01,
    h: (s1.h - s0.h) / dt01,
  };

  if (samples.length < 3) {
    return {
      vx: clampVelocity(v01.x),
      vy: clampVelocity(v01.y),
      vw: clampVelocity(v01.w),
      vh: clampVelocity(v01.h),
    };
  }

  const s_prev = samples[samples.length - 3];
  const dt_prev = Math.max(1, s0.t - s_prev.t);
  const v_prev = {
    x: (s0.x - s_prev.x) / dt_prev,
    y: (s0.y - s_prev.y) / dt_prev,
    w: (s0.w - s_prev.w) / dt_prev,
    h: (s0.h - s_prev.h) / dt_prev,
  };

  // Weight: 70% recent pair, 30% older pair
  return {
    vx: clampVelocity(0.3 * v_prev.x + 0.7 * v01.x),
    vy: clampVelocity(0.3 * v_prev.y + 0.7 * v01.y),
    vw: clampVelocity(0.3 * v_prev.w + 0.7 * v01.w),
    vh: clampVelocity(0.3 * v_prev.h + 0.7 * v01.h),
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBBoxPredictor(): {
  tracks: PredictedTracks;
  ingest: (input: TrackInput) => void;
  remove: (trackId: number) => void;
  clear: () => void;
} {
  const internalRef = useRef<Map<number, InternalTrackState>>(new Map());
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  // Single state tick — bumped by rAF to trigger consumer re-render
  const [, setTick] = useState(0);

  // Derived from internalRef on each render tick
  const tracksRef = useRef<PredictedTracks>(new Map());

  // ── rAF loop ──
  const startLoop = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    const loop = () => {
      const now = performance.now();
      const internal = internalRef.current;
      const next: PredictedTracks = new Map();

      for (const [id, state] of internal) {
        const { lastInput, vx, vy, vw, vh, disappearedAt } = state;
        const lastSample = state.samples[state.samples.length - 1];

        if (!lastSample) continue;

        let opacity = 1;

        if (disappearedAt !== null) {
          const fadeDt = now - disappearedAt;
          if (fadeDt >= FADE_DURATION_MS) {
            internal.delete(id);
            continue;
          }
          opacity = 1 - fadeDt / FADE_DURATION_MS;
          // Use frozen position (no extrapolation after disappear)
          next.set(id, {
            trackId: id,
            x: lastSample.x,
            y: lastSample.y,
            w: lastSample.w,
            h: lastSample.h,
            label: lastInput.label,
            behavior: lastInput.behavior,
            confidence: lastInput.confidence,
            severity: lastInput.severity,
            sourceWidth: lastInput.sourceWidth,
            sourceHeight: lastInput.sourceHeight,
            opacity,
            stale: true,
          });
          continue;
        }

        const dt = now - lastInput.receivedAt;
        const stale = dt > EXTRAPOLATE_MAX_MS;

        const x = stale ? lastSample.x : lastSample.x + vx * dt;
        const y = stale ? lastSample.y : lastSample.y + vy * dt;
        const w = stale ? lastSample.w : lastSample.w + vw * dt;
        const h = stale ? lastSample.h : lastSample.h + vh * dt;

        next.set(id, {
          trackId: id,
          x: Math.max(0, x),
          y: Math.max(0, y),
          w: Math.max(10, w),
          h: Math.max(10, h),
          label: lastInput.label,
          behavior: lastInput.behavior,
          confidence: lastInput.confidence,
          severity: lastInput.severity,
          sourceWidth: lastInput.sourceWidth,
          sourceHeight: lastInput.sourceHeight,
          opacity,
          stale,
        });
      }

      tracksRef.current = next;
      setTick((t) => (t + 1) & 0xffff);

      if (internal.size > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        runningRef.current = false;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── ingest ──
  const ingest = useCallback(
    (input: TrackInput) => {
      const internal = internalRef.current;
      let state = internal.get(input.trackId);

      if (!state) {
        state = {
          samples: [],
          lastInput: input,
          vx: 0,
          vy: 0,
          vw: 0,
          vh: 0,
          disappearedAt: null,
        };
        internal.set(input.trackId, state);
      }

      if (state.disappearedAt !== null) {
        state.disappearedAt = null;
      }

      const sample: BBoxSample = { ...input.bbox, t: input.receivedAt };
      state.samples.push(sample);
      if (state.samples.length > 3) state.samples.shift();

      const velocities = computeVelocities(state.samples);
      state.vx = velocities.vx;
      state.vy = velocities.vy;
      state.vw = velocities.vw;
      state.vh = velocities.vh;
      state.lastInput = input;

      startLoop();
    },
    [startLoop],
  );

  // ── remove ──
  const remove = useCallback((trackId: number) => {
    const state = internalRef.current.get(trackId);
    if (state && state.disappearedAt === null) {
      state.disappearedAt = performance.now();
    }
  }, []);

  // ── clear ──
  const clear = useCallback(() => {
    internalRef.current.clear();
    tracksRef.current = new Map();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      runningRef.current = false;
    };
  }, []);

  return { tracks: tracksRef.current, ingest, remove, clear };
}
