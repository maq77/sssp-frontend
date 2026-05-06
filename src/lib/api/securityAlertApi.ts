import apiClient from "@/lib/api-client";
import type { SecurityAlert } from "@/types";

type SecurityAlertServer = {
  IncidentId: number;
  Title: string;
  Description?: string | null;
  Type: number;
  Severity: number;
  Status: number;
  Source: number;
  AlertCategory: string;
  SourceRuntime?: string | null;
  Reason?: string | null;
  ZoneId?: string | null;
  ZoneName?: string | null;
  CameraId?: number | null;
  CameraName?: string | null;
  StreamKey?: string | null;
  Confidence?: number | null;
  Similarity?: number | null;
  OccurredAtUtc: string;
  Person?: {
    UserId?: string | null;
    FaceProfileId?: string | null;
    DisplayName?: string | null;
    ProfilePhotoUrl?: string | null;
    WatchlistReason?: string | null;
  } | null;
  Snapshot?: {
    SnapshotId?: string | null;
    Url?: string | null;
    TakenAtUtc?: string | null;
    SourceCameraId?: number | null;
    SourceRuntime?: string | null;
  } | null;
};

function mapAlert(server: SecurityAlertServer): SecurityAlert {
  return {
    incidentId: server.IncidentId,
    title: server.Title,
    description: server.Description ?? null,
    type: server.Type,
    severity: server.Severity,
    status: server.Status,
    source: server.Source,
    alertCategory: server.AlertCategory,
    sourceRuntime: server.SourceRuntime ?? null,
    reason: server.Reason ?? null,
    zoneId: server.ZoneId ?? null,
    zoneName: server.ZoneName ?? null,
    cameraId: server.CameraId ?? null,
    cameraName: server.CameraName ?? null,
    streamKey: server.StreamKey ?? null,
    confidence: server.Confidence ?? null,
    similarity: server.Similarity ?? null,
    occurredAtUtc: server.OccurredAtUtc,
    person: server.Person
      ? {
          userId: server.Person.UserId ?? null,
          faceProfileId: server.Person.FaceProfileId ?? null,
          displayName: server.Person.DisplayName ?? null,
          profilePhotoUrl: server.Person.ProfilePhotoUrl ?? null,
          watchlistReason: server.Person.WatchlistReason ?? null,
        }
      : null,
    snapshot: server.Snapshot
      ? {
          snapshotId: server.Snapshot.SnapshotId ?? null,
          url: server.Snapshot.Url ?? null,
          takenAtUtc: server.Snapshot.TakenAtUtc ?? null,
          sourceCameraId: server.Snapshot.SourceCameraId ?? null,
          sourceRuntime: server.Snapshot.SourceRuntime ?? null,
        }
      : null,
  };
}

export const securityAlertApi = {
  async listOpen(): Promise<SecurityAlert[]> {
    const rows = await apiClient.get<SecurityAlertServer[]>("/security-alerts/open");
    return (Array.isArray(rows) ? rows : []).map(mapAlert);
  },

  async getByIncidentId(incidentId: number): Promise<SecurityAlert> {
    const row = await apiClient.get<SecurityAlertServer>(`/security-alerts/${incidentId}`);
    return mapAlert(row);
  },
};

export default securityAlertApi;
