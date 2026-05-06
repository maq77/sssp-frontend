import { create } from "zustand";
import * as THREE from "three";

export type AirportPhase = "idle" | "walking" | "scanning" | "alert" | "responding" | "exiting" | "resolved";
export type POV = "default" | "overhead" | "gate";

export type MarkerSet = {
  entry?: THREE.Vector3;
  scan?: THREE.Vector3;
  exit?: THREE.Vector3;
  camOverhead?: THREE.Vector3;
  camGate?: THREE.Vector3;
};

type AirportStore = {
  phase: AirportPhase;
  isPlaying: boolean;
  progress: number; // 0..100
  pov: POV;

  matchConfidence: number;
  responseTime: string;

  markers: MarkerSet;
  markersReady: boolean;

  setMarkers: (m: MarkerSet) => void;
  setMarkersReady: (v: boolean) => void;

  setPhase: (p: AirportPhase) => void;
  setPlaying: (v: boolean) => void;
  setProgress: (v: number) => void;
  setPOV: (p: POV) => void;

  reset: () => void;
};

export const useAirportState = create<AirportStore>((set) => ({
  phase: "idle",
  isPlaying: false,
  progress: 0,
  pov: "default",

  matchConfidence: 87,
  responseTime: "2.3s",

  markers: {},
  markersReady: false,

  setMarkers: (m) => set({ markers: m }),
  setMarkersReady: (v) => set({ markersReady: v }),

  setPhase: (phase) => set({ phase }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (progress) => set({ progress: Math.max(0, Math.min(100, progress)) }),
  setPOV: (pov) => set({ pov }),

  reset: () =>
    set({
      phase: "idle",
      isPlaying: false,
      progress: 0,
      pov: "default",
      matchConfidence: 87,
      responseTime: "2.3s",
    }),
}));
