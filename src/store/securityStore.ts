import { create } from "zustand";
import { FaceRecognizedPayload } from "@/types";

type SecurityState = {
  storm: boolean;
  lastUnknown?: FaceRecognizedPayload;
  unknownCountWindow: number;
  windowStartedAt: number;

  pushDetection: (d: FaceRecognizedPayload) => void;
  clearStorm: () => void;
};

const WINDOW_MS = 30_000;
const STORM_THRESHOLD = 5; // tweak

export const useSecurityStore = create<SecurityState>((set, get) => ({
  storm: false,
  unknownCountWindow: 0,
  windowStartedAt: Date.now(),

  pushDetection: (d) => {
    const now = Date.now();
    const s = get();

    // only count unknowns
    if (d.UserId) return;

    // rotate window
    let count = s.unknownCountWindow;
    let start = s.windowStartedAt;

    if (now - start > WINDOW_MS) {
      start = now;
      count = 0;
    }

    count += 1;

    const storm = count >= STORM_THRESHOLD;

    set({
      lastUnknown: d,
      unknownCountWindow: count,
      windowStartedAt: start,
      storm,
    });
  },

  clearStorm: () => set({ storm: false, unknownCountWindow: 0, windowStartedAt: Date.now() }),
}));
