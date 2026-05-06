/**
 * Incident alert store — Zustand.
 * Manages the lifecycle: pending → active (shown, max 3) → acknowledged/dismissed → history.
 */

import { create } from "zustand";
import { v4 as uuid } from "uuid";

export type IncidentAlertSeverity = "info" | "warning" | "critical";

export type IncidentAlertType =
  | "watchlist_hit"
  | "unknown_restricted"
  | "behavior_fighting"
  | "behavior_loitering"
  | "behavior_weapon"
  | "zone_breach"
  | "system";

export type IncidentAlertStatus = "pending" | "active" | "acknowledged" | "dismissed";

export interface IncidentAlert {
  id: string;
  type: IncidentAlertType;
  severity: IncidentAlertSeverity;
  cameraId: string;
  cameraName: string;
  timestamp: number; // ms epoch
  personName: string | null;
  faceCropUrl: string | null;
  behaviorLabel: string | null;
  trackId: number | null;
  message: string;
  status: IncidentAlertStatus;
  shownAt: number | null;
  autoDismissMs: number; // Infinity for critical
  signature: string; // dedup key: "${type}:${cameraId}:${personName ?? trackId}"
}

const MAX_ACTIVE = 3;
const MAX_HISTORY = 50;
const DEDUP_WINDOW_MS = 30_000;

interface IncidentStoreState {
  pending: IncidentAlert[];
  active: IncidentAlert[];
  history: IncidentAlert[];

  // dedup — signature → timestamp last seen
  _signatures: Map<string, number>;

  enqueue: (
    input: Omit<IncidentAlert, "id" | "status" | "shownAt" | "signature"> & {
      signature?: string;
    },
  ) => void;
  acknowledge: (id: string) => void;
  dismiss: (id: string) => void;
  autoDismiss: (id: string) => void;
  clearHistory: () => void;
}

function promote(state: IncidentStoreState): Partial<IncidentStoreState> {
  if (state.active.length >= MAX_ACTIVE || state.pending.length === 0) {
    return {};
  }
  const [next, ...rest] = state.pending;
  const promoted: IncidentAlert = { ...next, status: "active", shownAt: Date.now() };
  return {
    pending: rest,
    active: [...state.active, promoted],
  };
}

function removeFromActive(
  state: IncidentStoreState,
  id: string,
  status: IncidentAlertStatus,
): Partial<IncidentStoreState> {
  const alert = state.active.find((a) => a.id === id);
  if (!alert) return {};
  const history = [{ ...alert, status }, ...state.history].slice(0, MAX_HISTORY);
  const active = state.active.filter((a) => a.id !== id);
  const next = { active, history };
  const promoted = promote({ ...state, ...next });
  return { ...next, ...promoted };
}

export const useIncidentStore = create<IncidentStoreState>((set, get) => ({
  pending: [],
  active: [],
  history: [],
  _signatures: new Map(),

  enqueue(input) {
    const sig =
      input.signature ??
      `${input.type}:${input.cameraId}:${input.personName ?? input.trackId ?? "unknown"}`;

    const sigs = get()._signatures;
    const lastSeen = sigs.get(sig);
    if (lastSeen !== undefined && Date.now() - lastSeen < DEDUP_WINDOW_MS) {
      return;
    }

    const alert: IncidentAlert = {
      ...input,
      id: uuid(),
      status: "pending",
      shownAt: null,
      signature: sig,
    };

    sigs.set(sig, Date.now());

    set((state) => {
      const pending = [...state.pending, alert];
      const next = { pending, _signatures: sigs };
      const promoted = promote({ ...state, ...next });
      return { ...next, ...promoted };
    });
  },

  acknowledge(id) {
    set((state) => removeFromActive(state, id, "acknowledged") as IncidentStoreState);
  },

  dismiss(id) {
    set((state) => removeFromActive(state, id, "dismissed") as IncidentStoreState);
  },

  autoDismiss(id) {
    set((state) => removeFromActive(state, id, "dismissed") as IncidentStoreState);
  },

  clearHistory() {
    set({ history: [] });
  },
}));
