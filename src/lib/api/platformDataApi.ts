import apiClient from "@/lib/api-client";
import type { PlatformDataSummary } from "@/types";

function mapSummary(raw: any): PlatformDataSummary {
  return {
    users: Number(raw?.users ?? raw?.Users ?? 0),
    operators: Number(raw?.operators ?? raw?.Operators ?? 0),
    zones: Number(raw?.zones ?? raw?.Zones ?? 0),
    cameras: Number(raw?.cameras ?? raw?.Cameras ?? 0),
    policies: Number(raw?.policies ?? raw?.Policies ?? 0),
    restrictions: Number(raw?.restrictions ?? raw?.Restrictions ?? 0),
    incidents: Number(raw?.incidents ?? raw?.Incidents ?? 0),
    faceProfiles: Number(raw?.faceProfiles ?? raw?.FaceProfiles ?? 0),
  };
}

export const platformDataApi = {
  async getSummary(): Promise<PlatformDataSummary> {
    const raw = await apiClient.get<any>("/demo/summary", undefined, { cacheTTL: 5000 });
    return mapSummary(raw);
  },

  async initializeReferenceData(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/demo/seed");
  },
};
