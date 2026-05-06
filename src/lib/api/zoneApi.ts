import apiClient from "@/lib/api-client";
import cameraApi from "@/lib/api/cameraApi";
import type {
  AccessDecision,
  AccessType,
  CameraDTO,
  CreateZoneRequest,
  RoleSummary,
  UpdateZoneRequest,
  UserZoneRestriction,
  Zone,
  ZonePolicy,
} from "@/types";

function mapZone(raw: any): Zone {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    zoneCode: String(raw?.zoneCode ?? raw?.ZoneCode ?? ""),
    name: String(raw?.name ?? raw?.Name ?? ""),
    description: raw?.description ?? raw?.Description ?? null,
    zoneType: Number(raw?.zoneType ?? raw?.ZoneType ?? 0) as Zone["zoneType"],
    operatorId: raw?.operatorId ?? raw?.OperatorId ?? null,
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
    createdAt: raw?.createdAt ?? raw?.CreatedAt ?? null,
    cameras: Array.isArray(raw?.cameras ?? raw?.Cameras) ? (raw.cameras ?? raw.Cameras) : undefined,
  };
}

function mapRole(raw: any): RoleSummary {
  return {
    id: String(raw?.id ?? raw?.Id ?? raw?.name ?? raw?.Name ?? ""),
    name: String(raw?.name ?? raw?.Name ?? ""),
  };
}

function mapPolicy(raw: any): ZonePolicy {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    zoneId: Number(raw?.zoneId ?? raw?.ZoneId ?? 0),
    roleId: raw?.roleId ?? raw?.RoleId ?? null,
    userId: raw?.userId ?? raw?.UserId ?? null,
    accessType: Number(raw?.accessType ?? raw?.AccessType ?? 0) as ZonePolicy["accessType"],
    priority: Number(raw?.priority ?? raw?.Priority ?? 0),
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
    createdAt: String(raw?.createdAt ?? raw?.CreatedAt ?? ""),
    expiresAt: raw?.expiresAt ?? raw?.ExpiresAt ?? null,
    description: raw?.description ?? raw?.Description ?? null,
    role: raw?.role ?? raw?.Role ? mapRole(raw.role ?? raw.Role) : null,
    user: raw?.user ?? raw?.User ?? null,
  };
}

function mapRestriction(raw: any): UserZoneRestriction {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    userId: String(raw?.userId ?? raw?.UserId ?? ""),
    zoneId: Number(raw?.zoneId ?? raw?.ZoneId ?? 0),
    reason: String(raw?.reason ?? raw?.Reason ?? ""),
    restrictedAt: String(raw?.restrictedAt ?? raw?.RestrictedAt ?? ""),
    restrictedBy: raw?.restrictedBy ?? raw?.RestrictedBy ?? null,
    expiresAt: raw?.expiresAt ?? raw?.ExpiresAt ?? null,
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
    notes: raw?.notes ?? raw?.Notes ?? null,
    user: raw?.user ?? raw?.User ?? null,
    zone: raw?.zone ?? raw?.Zone ? mapZone(raw.zone ?? raw.Zone) : null,
  };
}

function mapAccessDecision(raw: any): AccessDecision {
  return {
    isAllowed: Boolean(raw?.isAllowed ?? raw?.IsAllowed ?? false),
    reason: String(raw?.reason ?? raw?.Reason ?? ""),
    appliedPolicyId: raw?.appliedPolicyId ?? raw?.AppliedPolicyId ?? null,
    appliedRestrictionId: raw?.appliedRestrictionId ?? raw?.AppliedRestrictionId ?? null,
  };
}

type AddUserPolicyRequest = {
  zoneId: number;
  userId: string;
  accessType: AccessType;
  priority?: number;
  description?: string | null;
  expiresAt?: string | null;
};

type AddRolePolicyRequest = {
  zoneId: number;
  roleId: string;
  accessType: AccessType;
  priority?: number;
  description?: string | null;
  expiresAt?: string | null;
};

type RestrictUserRequest = {
  userId: string;
  zoneId: number;
  reason: string;
  expiresAt?: string | null;
  notes?: string | null;
};

export const zoneApi = {
  async list(activeOnly = true) {
    const raw = await apiClient.get<any[]>("/zones", { activeOnly });
    return Array.isArray(raw) ? raw.map(mapZone) : [];
  },

  create(payload: CreateZoneRequest) {
    return apiClient.post<Zone, CreateZoneRequest>("/zones", payload);
  },

  update(id: number, payload: UpdateZoneRequest) {
    return apiClient.put<void, UpdateZoneRequest>(`/zones/${id}`, payload);
  },

  listCameras(id: number) {
    return apiClient.get<CameraDTO[]>(`/zones/${id}/cameras`);
  },

  async listPolicies(zoneId: number) {
    const raw = await apiClient.get<any[]>(`/zone-policies/zone/${zoneId}`);
    return Array.isArray(raw) ? raw.map(mapPolicy) : [];
  },

  async listRestrictions(zoneId: number) {
    const raw = await apiClient.get<any[]>(`/zone-policies/zone/${zoneId}/restrictions`);
    return Array.isArray(raw) ? raw.map(mapRestriction) : [];
  },

  addUserPolicy(payload: AddUserPolicyRequest) {
    return apiClient.post<ZonePolicy, AddUserPolicyRequest>("/zone-policies/user", payload);
  },

  addRolePolicy(payload: AddRolePolicyRequest) {
    return apiClient.post<ZonePolicy, AddRolePolicyRequest>("/zone-policies/role", payload);
  },

  restrictUser(payload: RestrictUserRequest) {
    return apiClient.post<UserZoneRestriction, RestrictUserRequest>("/zone-policies/restrict-user", payload);
  },

  removePolicy(policyId: number) {
    return apiClient.delete<void>(`/zone-policies/${policyId}`);
  },

  removeRestriction(restrictionId: number) {
    return apiClient.delete<void>(`/zone-policies/restrictions/${restrictionId}`);
  },

  async checkAccess(userId: string, zoneId: number) {
    const raw = await apiClient.post<any, { userId: string; zoneId: number }>("/zone-policies/check-access", { userId, zoneId });
    return mapAccessDecision(raw);
  },

  async listRoles() {
    const raw = await apiClient.get<any[]>("/admin/roles");
    return Array.isArray(raw) ? raw.map(mapRole) : [];
  },

  async listAssignableCameras() {
    return cameraApi.list();
  },

  async assignCamera(cameraId: number, zoneId: number | null) {
    await apiClient.put<void, { zoneId: number | null }>(`/camera/${cameraId}/zone`, { zoneId });
  },
};
