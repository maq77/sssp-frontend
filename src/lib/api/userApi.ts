import apiClient from "@/lib/api-client";
import type { CreateUserWithRoleDTO, UpdateUserDTO, User, UserFaceProfileSummary, UserSecurityProfile, UserZoneRestrictionSummary } from "@/types";

function mapUser(raw: any): User {
  return {
    id: String(raw?.id ?? raw?.Id ?? ""),
    userName: String(raw?.userName ?? raw?.UserName ?? raw?.email ?? raw?.Email ?? ""),
    email: String(raw?.email ?? raw?.Email ?? ""),
    fullName: String(raw?.fullName ?? raw?.FullName ?? ""),
    role: Number(raw?.role ?? raw?.Role ?? 3) as User["role"],
    operatorId: raw?.operatorId ?? raw?.OperatorId ?? null,
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
    isWatchlisted: Boolean(raw?.isWatchlisted ?? raw?.IsWatchlisted ?? false),
    watchlistReason: raw?.watchlistReason ?? raw?.WatchlistReason ?? null,
    watchlistAddedAt: raw?.watchlistAddedAt ?? raw?.WatchlistAddedAt ?? null,
    watchlistAddedBy: raw?.watchlistAddedBy ?? raw?.WatchlistAddedBy ?? null,
    createdAt: String(raw?.createdAt ?? raw?.CreatedAt ?? ""),
    updatedAt: raw?.updatedAt ?? raw?.UpdatedAt ?? undefined,
  };
}

function mapFaceProfile(raw: any): UserFaceProfileSummary {
  return {
    id: String(raw?.id ?? raw?.Id ?? ""),
    description: raw?.description ?? raw?.Description ?? null,
    isPrimary: Boolean(raw?.isPrimary ?? raw?.IsPrimary ?? false),
    createdAt: String(raw?.createdAt ?? raw?.CreatedAt ?? ""),
    previewUrl: raw?.previewUrl ?? raw?.PreviewUrl ?? null,
  };
}

function mapRestriction(raw: any): UserZoneRestrictionSummary {
  return {
    id: Number(raw?.id ?? raw?.Id ?? 0),
    zoneId: Number(raw?.zoneId ?? raw?.ZoneId ?? 0),
    zoneName: String(raw?.zoneName ?? raw?.ZoneName ?? ""),
    reason: String(raw?.reason ?? raw?.Reason ?? ""),
    restrictedAt: String(raw?.restrictedAt ?? raw?.RestrictedAt ?? ""),
    expiresAt: raw?.expiresAt ?? raw?.ExpiresAt ?? null,
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? false),
    notes: raw?.notes ?? raw?.Notes ?? null,
  };
}

function mapSecurityProfile(raw: any): UserSecurityProfile {
  return {
    user: mapUser(raw?.user ?? raw?.User ?? {}),
    faceProfiles: Array.isArray(raw?.faceProfiles ?? raw?.FaceProfiles)
      ? (raw.faceProfiles ?? raw.FaceProfiles).map(mapFaceProfile)
      : [],
    restrictions: Array.isArray(raw?.restrictions ?? raw?.Restrictions)
      ? (raw.restrictions ?? raw.Restrictions).map(mapRestriction)
      : [],
  };
}

export const userApi = {
  async getAll(): Promise<User[]> {
    const raw = await apiClient.get<any[]>("/user");
    return Array.isArray(raw) ? raw.map(mapUser) : [];
  },

  async getWatchlist(): Promise<User[]> {
    const raw = await apiClient.get<any[]>("/user/watchlist");
    return Array.isArray(raw) ? raw.map(mapUser) : [];
  },

  async getById(id: string): Promise<User> {
    const raw = await apiClient.get<any>(`/user/${id}`);
    return mapUser(raw);
  },

  async getSecurityProfile(id: string): Promise<UserSecurityProfile> {
    const raw = await apiClient.get<any>(`/user/${id}/security-profile`);
    return mapSecurityProfile(raw);
  },

  async create(payload: CreateUserWithRoleDTO): Promise<User> {
    const raw = await apiClient.post<any, CreateUserWithRoleDTO>("/admin/users", payload);
    return mapUser(raw);
  },

  async update(id: string, payload: UpdateUserDTO): Promise<void> {
    await apiClient.put<void, UpdateUserDTO>(`/user/${id}`, payload);
  },

  async updateWatchlist(id: string, payload: UpdateUserDTO): Promise<void> {
    await apiClient.put<void, UpdateUserDTO>(`/user/${id}/watchlist`, payload);
  },

  async uploadPhoto(id: string, file: File): Promise<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append("photo", file);
    const raw = await apiClient.postFormData<any>(`/user/${id}/photo`, formData);
    return { photoUrl: String(raw?.photoUrl ?? raw?.PhotoUrl ?? `/api/user/${id}/photo`) };
  },

  async deletePhoto(id: string): Promise<void> {
    await apiClient.delete<void>(`/user/${id}/photo`);
  },

  getPhotoUrl(id: string) {
    return `${window.location.origin}/api/user/${id}/photo`;
  },
};
