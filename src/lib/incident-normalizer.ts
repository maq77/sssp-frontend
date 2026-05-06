import type { IncidentResponse } from "@/types";

export function normalizeIncident(raw: any): IncidentResponse {
  // if it already looks camelCase, keep it
  if (raw && typeof raw === "object" && "id" in raw) return raw as IncidentResponse;

  // otherwise convert PascalCase -> camelCase for the fields we use
  return {
    id: raw?.Id,
    title: raw?.Title ?? "",
    description: raw?.Description ?? undefined,
    type: raw?.Type,
    severity: raw?.Severity,
    status: raw?.Status,
    source: raw?.Source,
    operatorId: raw?.OperatorId ?? undefined,
    location: raw?.Location ?? undefined,
    assignedToUserId: raw?.AssignedToUserId ?? undefined,
    timestamp: raw?.Timestamp,
    assignedAt: raw?.AssignedAt ?? undefined,
    startedAt: raw?.StartedAt ?? undefined,
    resolvedAt: raw?.ResolvedAt ?? undefined,
    closedAt: raw?.ClosedAt ?? undefined,
  };
}

export function normalizeIncidents(rawList: any[]): IncidentResponse[] {
  return Array.isArray(rawList) ? rawList.map(normalizeIncident) : [];
}
