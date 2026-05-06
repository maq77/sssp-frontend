import apiClient from "@/lib/api-client";

export type DemoSummary = {
  users: number;
  operators: number;
  zones: number;
  cameras: number;
  policies: number;
  restrictions: number;
  incidents: number;
  faceProfiles: number;
};

export type DemoSeedResult = {
  message: string;
  operator: { id: number; name: string };
  zones: Array<{ id: number; name: string; zoneCode: string }>;
  users: Array<{ id: string; email: string; fullName: string; role: number; isWatchlisted: boolean }>;
  cameras: Array<{ id: number; name: string; zoneId: number | null; streamKey: string }>;
  policyChanges: number;
  incidentChanges: number;
  suggestedPasswords: string[];
};

function mapSummary(raw: any): DemoSummary {
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

export const demoApi = {
  async getSummary(): Promise<DemoSummary> {
    const raw = await apiClient.get<any>("/demo/summary", undefined, { cacheTTL: 5000 });
    return mapSummary(raw);
  },
  async seed(): Promise<DemoSeedResult> {
    return apiClient.post<DemoSeedResult>("/demo/seed");
  },
};
