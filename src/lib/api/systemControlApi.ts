import apiClient from "@/lib/api-client";
import type { AiControlDocument, AiControlField, AiControlGroup, AiControlScope, AiControlSnapshot } from "@/types";

function mapField(raw: any): AiControlField {
  return {
    key: String(raw?.key ?? raw?.Key ?? ""),
    label: String(raw?.label ?? raw?.Label ?? ""),
    type: String(raw?.type ?? raw?.Type ?? "number") as AiControlField["type"],
    value: raw?.value ?? raw?.Value ?? null,
    description: raw?.description ?? raw?.Description ?? null,
    requiresRestart: Boolean(raw?.requiresRestart ?? raw?.RequiresRestart ?? false),
    min: raw?.min ?? raw?.Min ?? null,
    max: raw?.max ?? raw?.Max ?? null,
    step: raw?.step ?? raw?.Step ?? null,
    unit: raw?.unit ?? raw?.Unit ?? null,
    options: Array.isArray(raw?.options ?? raw?.Options)
      ? (raw.options ?? raw.Options).map((option: any) => ({
          value: String(option?.value ?? option?.Value ?? ""),
          label: String(option?.label ?? option?.Label ?? ""),
        }))
      : null,
  };
}

function mapGroup(raw: any): AiControlGroup {
  return {
    key: String(raw?.key ?? raw?.Key ?? ""),
    title: String(raw?.title ?? raw?.Title ?? ""),
    description: String(raw?.description ?? raw?.Description ?? ""),
    fields: Array.isArray(raw?.fields ?? raw?.Fields) ? (raw.fields ?? raw.Fields).map(mapField) : [],
  };
}

function mapDocument(raw: any): AiControlDocument {
  return {
    kind: String(raw?.kind ?? raw?.Kind ?? "live") as AiControlDocument["kind"],
    title: String(raw?.title ?? raw?.Title ?? ""),
    description: String(raw?.description ?? raw?.Description ?? ""),
    requiresRestart: Boolean(raw?.requiresRestart ?? raw?.RequiresRestart ?? false),
    groups: Array.isArray(raw?.groups ?? raw?.Groups) ? (raw.groups ?? raw.Groups).map(mapGroup) : [],
  };
}

function mapScope(raw: any): AiControlScope {
  return {
    id: String(raw?.id ?? raw?.Id ?? ""),
    name: String(raw?.name ?? raw?.Name ?? ""),
    description: String(raw?.description ?? raw?.Description ?? ""),
    documents: Array.isArray(raw?.documents ?? raw?.Documents) ? (raw.documents ?? raw.Documents).map(mapDocument) : [],
  };
}

function mapSnapshot(raw: any): AiControlSnapshot {
  return {
    generatedAtUtc: String(raw?.generatedAtUtc ?? raw?.GeneratedAtUtc ?? new Date().toISOString()),
    scopes: Array.isArray(raw?.scopes ?? raw?.Scopes) ? (raw.scopes ?? raw.Scopes).map(mapScope) : [],
  };
}

export const systemControlApi = {
  async getAiSnapshot(): Promise<AiControlSnapshot> {
    const raw = await apiClient.get<any>("/system-control/ai", undefined, { cache: false });
    return mapSnapshot(raw);
  },

  async updateAiDocument(scopeId: string, kind: "live" | "startup", values: Record<string, unknown>) {
    return apiClient.put(`/system-control/ai/${scopeId}/${kind}`, { values });
  },
};
