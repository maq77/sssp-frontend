import { http } from "./http";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SensorReading {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  pressure: number;
  dewPoint: number;
  timestampMs: number;
}

export interface AqiHorizonPrediction {
  horizonHours: number;
  aqi: number;
  category: string;
  categoryShort: string;
  colorHex: string;
  colorR: number;
  colorG: number;
  colorB: number;
  dominantPollutant: string;
  confidence: number;
  predictedAtMs: number;
}

export interface AqiForecastResponse {
  success: boolean;
  errorMessage?: string;
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  currentAqi: number;
  currentCategory: string;
  currentColorHex: string;
  currentDominantPollutant: string;
  forecasts: AqiHorizonPrediction[];
  trend: "improving" | "worsening" | "stable";
  trendDelta: number;
  inferenceMs: number;
}

export interface AqiMultiStationResponse {
  success: boolean;
  errorMessage?: string;
  stations: AqiForecastResponse[];
  totalInferenceMs: number;
}

export interface GovernmentRecommendation {
  priority: string;
  domain: string;
  action: string;
  rationale: string;
}

export interface CitizenRecommendation {
  icon: string;
  group: string;
  advisory: string;
  detail: string;
}

export interface AqiRecommendations {
  currentAqi: number;
  category: string;
  trend: string;
  governmentPolicies: GovernmentRecommendation[];
  citizenAdvisories: CitizenRecommendation[];
  generatedAt: string;
}

export interface AqiModelInfo {
  isReady: boolean;
  modelName: string;
  modelVersion: string;
  device: string;
  inputFeatures: number;
  sequenceLength: number;
  numLayers: number;
  hiddenSizes: number[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const aqiApi = {
  getDemoData(): Promise<AqiMultiStationResponse> {
    return http.get<AqiMultiStationResponse>("/api/aqi/demo").then((r) => r.data);
  },

  getRecommendations(
    aqi: number,
    trend: string,
    category: string
  ): Promise<AqiRecommendations> {
    return http
      .get<AqiRecommendations>("/api/aqi/recommendations", {
        params: { aqi, trend, category },
      })
      .then((r) => r.data);
  },

  getModelInfo(): Promise<AqiModelInfo> {
    return http.get<AqiModelInfo>("/api/aqi/model-info").then((r) => r.data);
  },

  forecastMulti(payload: {
    stations: {
      stationId: string;
      stationName: string;
      latitude: number;
      longitude: number;
      history: SensorReading[];
    }[];
    horizonsHours?: number[];
  }): Promise<AqiMultiStationResponse> {
    return http
      .post<AqiMultiStationResponse>("/api/aqi/forecast/multi", payload)
      .then((r) => r.data);
  },
};
