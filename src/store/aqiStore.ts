import { create } from "zustand";
import type {
  AqiForecastResponse,
  AqiRecommendations,
  AqiMultiStationResponse,
} from "@/lib/api/aqiApi";

interface AqiState {
  multiStationData: AqiMultiStationResponse | null;
  selectedStationId: string | null;
  recommendations: AqiRecommendations | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  alertDismissed: boolean;

  setMultiStationData: (data: AqiMultiStationResponse) => void;
  setSelectedStation: (id: string) => void;
  setRecommendations: (recs: AqiRecommendations) => void;
  setLoading: (v: boolean) => void;
  dismissAlert: () => void;
}

export const useAqiStore = create<AqiState>((set) => ({
  multiStationData: null,
  selectedStationId: null,
  recommendations: null,
  isLoading: false,
  lastUpdated: null,
  alertDismissed: false,

  setMultiStationData: (data) =>
    set({ multiStationData: data, lastUpdated: new Date() }),
  setSelectedStation: (id) => set({ selectedStationId: id }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  setLoading: (v) => set({ isLoading: v }),
  dismissAlert: () => set({ alertDismissed: true }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectSelectedStation = (state: AqiState): AqiForecastResponse | null => {
  if (!state.multiStationData || !state.selectedStationId) return null;
  return (
    state.multiStationData.stations.find(
      (s) => s.stationId === state.selectedStationId
    ) ?? state.multiStationData.stations[0] ?? null
  );
};

export const selectWorstStation = (state: AqiState): AqiForecastResponse | null => {
  if (!state.multiStationData?.stations.length) return null;
  return state.multiStationData.stations.reduce((worst, s) =>
    s.currentAqi > worst.currentAqi ? s : worst
  );
};
