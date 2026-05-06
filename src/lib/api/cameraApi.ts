import apiClient from "@/lib/api-client";
import type { CameraDTO, CameraStreamStatus, CreateCameraRequest, UpdateCameraRequest } from "@/types";
import type { CameraRuntimeStatus } from "@/types/runtime";

/**
 * Server DTO (PascalCase) returned by ASP.NET.
 */
type CameraDtoServer = {
  Id: number;
  Name: string;
  RtspUrl: string;
  IsActive: boolean;
  Capabilities: number;
  RecognitionMode: number;
  MatchThresholdOverride: number | null;
  InferenceMode?: string | null;
  SourceProfile?: string | null;
  ExpectedWidth?: number | null;
  ExpectedHeight?: number | null;
  ExpectedFps?: number | null;
  StreamKey?: string | null;
  ZoneId?: number | null;
  ZoneName?: string | null;
  OperatorId?: number | null;
  UseFace?: boolean | null;
  UseObject?: boolean | null;
  UseBehavior?: boolean | null;
};

/**
 * Tolerate camelCase too (if serializer policy changes).
 */
type CameraDtoClientShape = {
  id: number;
  name: string;
  rtspUrl: string;
  isActive: boolean;
  capabilities: number;
  recognitionMode: number;
  matchThresholdOverride: number | null;
  inferenceMode?: string | null;
  sourceProfile?: string | null;
  expectedWidth?: number | null;
  expectedHeight?: number | null;
  expectedFps?: number | null;
  streamKey?: string | null;
  zoneId?: number | null;
  zoneName?: string | null;
  operatorId?: number | null;
  useFace?: boolean | null;
  useObject?: boolean | null;
  useBehavior?: boolean | null;
};

type CameraStreamStatusServer = {
  CameraId: number;
  StreamKey: string;
  SourceRtspUrl: string;
  ProxyRtspUrl: string;
  WhepUrl: string;
  WhepEndpoint: string;
  MediaMtxApiBase: string;
  MediaMtxHealthEndpoint: string;
  MediaMtxReachable: boolean;
  PathConfigured: boolean;
  PathReady: boolean;
  SourceReady: boolean;
  State: string;
  Message: string;
  ConfiguredSource?: string | null;
  RuntimeSource?: string | null;
  ReaderCount?: number | null;
  LastTransportError?: string | null;
  ExpectedWidth?: number | null;
  ExpectedHeight?: number | null;
  ExpectedFps?: number | null;
  Orientation: "portrait" | "landscape" | "unknown";
  LastProbeUtc?: string | null;
  LastProbeSucceeded: boolean;
  LastProbeError?: string | null;
};

type CameraStreamStatusClientShape = {
  cameraId: number;
  streamKey: string;
  sourceRtspUrl: string;
  proxyRtspUrl: string;
  whepUrl: string;
  whepEndpoint: string;
  mediaMtxApiBase: string;
  mediaMtxHealthEndpoint: string;
  mediaMtxReachable: boolean;
  pathConfigured: boolean;
  pathReady: boolean;
  sourceReady: boolean;
  state: string;
  message: string;
  configuredSource?: string | null;
  runtimeSource?: string | null;
  readerCount?: number | null;
  lastTransportError?: string | null;
  expectedWidth?: number | null;
  expectedHeight?: number | null;
  expectedFps?: number | null;
  orientation: "portrait" | "landscape" | "unknown";
  lastProbeUtc?: string | null;
  lastProbeSucceeded: boolean;
  lastProbeError?: string | null;
};

type CameraDtoAny = CameraDtoServer | CameraDtoClientShape;

type CameraWriteRequestServer = {
  Name?: string;
  RtspUrl?: string;
  IsActive?: boolean;
  Capabilities: number;
  RecognitionMode: number;
  MatchThresholdOverride?: number | null;
  InferenceMode?: string;
  SourceProfile?: string;
  ExpectedWidth?: number | null;
  ExpectedHeight?: number | null;
  ExpectedFps?: number | null;
  ZoneId?: number | null;
  UseFace?: boolean;
  UseObject?: boolean;
  UseBehavior?: boolean;
};

export type RecentCameraEvent = {
  Topic: string;
  Event: string;
  PayloadJson: string;
  OccurredAtUtc: string;
};

function assertValidId(id: number) {
  if (!Number.isFinite(id) || id <= 0) throw new Error("Invalid camera id");
}

function isServerDto(x: any): x is CameraDtoServer {
  return !!x && typeof x === "object" && typeof x.Id === "number";
}

function mapCamera(s: CameraDtoAny): CameraDTO {
  if (isServerDto(s)) {
    return {
      id: s.Id,
      name: s.Name,
      rtspUrl: s.RtspUrl,
      isActive: s.IsActive,
      capabilities: s.Capabilities,
      recognitionMode: s.RecognitionMode,
      matchThresholdOverride: s.MatchThresholdOverride,
      inferenceMode: (s.InferenceMode ?? "full_analytics") as CameraDTO["inferenceMode"],
      sourceProfile: (s.SourceProfile ?? "auto") as CameraDTO["sourceProfile"],
      expectedWidth: s.ExpectedWidth ?? null,
      expectedHeight: s.ExpectedHeight ?? null,
      expectedFps: s.ExpectedFps ?? null,
      StreamKey: s.StreamKey ?? null,
      zoneId: s.ZoneId ?? null,
      zoneName: s.ZoneName ?? null,
      operatorId: s.OperatorId ?? null,
      useFace: s.UseFace ?? true,
      useObject: s.UseObject ?? true,
      useBehavior: s.UseBehavior ?? true,
    };
  }

  return {
    id: s.id,
    name: s.name,
    rtspUrl: s.rtspUrl,
    isActive: s.isActive,
    capabilities: s.capabilities,
    recognitionMode: s.recognitionMode,
    matchThresholdOverride: s.matchThresholdOverride,
    inferenceMode: (s.inferenceMode ?? "full_analytics") as CameraDTO["inferenceMode"],
    sourceProfile: (s.sourceProfile ?? "auto") as CameraDTO["sourceProfile"],
    expectedWidth: s.expectedWidth ?? null,
    expectedHeight: s.expectedHeight ?? null,
    expectedFps: s.expectedFps ?? null,
    StreamKey: s.streamKey ?? null,
    zoneId: s.zoneId ?? null,
    zoneName: s.zoneName ?? null,
    operatorId: s.operatorId ?? null,
    useFace: s.useFace ?? true,
    useObject: s.useObject ?? true,
    useBehavior: s.useBehavior ?? true,
  };
}

function toCameraWriteRequest(req: CreateCameraRequest | UpdateCameraRequest): CameraWriteRequestServer {
  return {
    Name: req.name,
    RtspUrl: req.rtspUrl,
    IsActive: "isActive" in req ? req.isActive : undefined,
    Capabilities: req.capabilities,
    RecognitionMode: req.recognitionMode,
    MatchThresholdOverride: req.matchThresholdOverride ?? null,
    InferenceMode: req.inferenceMode,
    SourceProfile: req.sourceProfile,
    ExpectedWidth: req.expectedWidth ?? null,
    ExpectedHeight: req.expectedHeight ?? null,
    ExpectedFps: req.expectedFps ?? null,
    ZoneId: req.zoneId ?? null,
    UseFace: req.useFace,
    UseObject: req.useObject,
    UseBehavior: req.useBehavior,
  };
}

function mapStreamStatus(input: CameraStreamStatusServer | CameraStreamStatusClientShape): CameraStreamStatus {
  const source = "CameraId" in input
    ? {
        cameraId: input.CameraId,
        streamKey: input.StreamKey,
        sourceRtspUrl: input.SourceRtspUrl,
        proxyRtspUrl: input.ProxyRtspUrl,
        whepUrl: input.WhepUrl,
        whepEndpoint: input.WhepEndpoint,
        mediaMtxApiBase: input.MediaMtxApiBase,
        mediaMtxHealthEndpoint: input.MediaMtxHealthEndpoint,
        mediaMtxReachable: input.MediaMtxReachable,
        pathConfigured: input.PathConfigured,
        pathReady: input.PathReady,
        sourceReady: input.SourceReady,
        state: input.State,
        message: input.Message,
        configuredSource: input.ConfiguredSource ?? null,
        runtimeSource: input.RuntimeSource ?? null,
        readerCount: input.ReaderCount ?? null,
        lastTransportError: input.LastTransportError ?? null,
        expectedWidth: input.ExpectedWidth ?? null,
        expectedHeight: input.ExpectedHeight ?? null,
        expectedFps: input.ExpectedFps ?? null,
        orientation: input.Orientation,
        lastProbeUtc: input.LastProbeUtc ?? null,
        lastProbeSucceeded: input.LastProbeSucceeded,
        lastProbeError: input.LastProbeError ?? null,
      }
    : input;

  return source;
}

export const cameraApi = {
  // -----------------------------
  // Queries
  // -----------------------------
  async list(): Promise<CameraDTO[]> {
    const data = await apiClient.get<CameraDtoAny[]>("/Camera");
    return (Array.isArray(data) ? data : []).map(mapCamera);
  },

  async get(id: number): Promise<CameraDTO> {
    assertValidId(id);
    const data = await apiClient.get<CameraDtoAny>(`/Camera/${id}`);
    return mapCamera(data);
  },

  async streamStatus(id: number): Promise<CameraStreamStatus> {
    assertValidId(id);
    const data = await apiClient.get<CameraStreamStatusServer | CameraStreamStatusClientShape>(`/Camera/${id}/stream-status`);
    return mapStreamStatus(data);
  },

  // -----------------------------
  // CRUD
  // -----------------------------
  async create(req: CreateCameraRequest): Promise<CameraDTO> {
    const created = await apiClient.post<CameraDtoAny, CameraWriteRequestServer>("/Camera", toCameraWriteRequest(req));
    apiClient.invalidateCache("/Camera");
    return mapCamera(created);
  },

  async update(id: number, req: UpdateCameraRequest): Promise<void> {
    assertValidId(id);
    // Your controller returns 204 NoContent
    await apiClient.put<void, CameraWriteRequestServer>(`/Camera/${id}`, toCameraWriteRequest(req));
    apiClient.invalidateCache("/Camera");
  },

  async remove(id: number): Promise<void> {
    assertValidId(id);
    await apiClient.delete<void>(`/Camera/${id}`);
  },

  async patchToggles(
    id: number,
    camera: CameraDTO,
    toggles: { useFace: boolean; useObject: boolean; useBehavior: boolean },
  ): Promise<void> {
    assertValidId(id);
    await cameraApi.update(id, {
      name: camera.name,
      rtspUrl: camera.rtspUrl,
      isActive: camera.isActive,
      capabilities: camera.capabilities,
      recognitionMode: camera.recognitionMode,
      matchThresholdOverride: camera.matchThresholdOverride ?? null,
      inferenceMode: camera.inferenceMode,
      sourceProfile: camera.sourceProfile,
      expectedWidth: camera.expectedWidth ?? null,
      expectedHeight: camera.expectedHeight ?? null,
      expectedFps: camera.expectedFps ?? null,
      zoneId: camera.zoneId ?? null,
      ...toggles,
    });
  },

  // -----------------------------
  // Monitoring controls
  // -----------------------------
    async start(id: number, rtspUrl?: string, mode: string = "deepstream-v2"): Promise<void> {
    assertValidId(id);
    await apiClient.post<void, { rtspUrl?: string }>(
      `/Camera/${id}/start?mode=${encodeURIComponent(mode)}`, 
      { rtspUrl }
    );
  },

  async stop(id: number, mode: string = "deepstream-v2"): Promise<void> {
    assertValidId(id);
    await apiClient.post<void>(`/Camera/${id}/stop?mode=${encodeURIComponent(mode)}`);
  },

  async restart(id: number, rtspUrl?: string, mode: string = "deepstream-v2"): Promise<void> {
    assertValidId(id);
    await apiClient.post<void, { rtspUrl?: string }>(
      `/Camera/${id}/restart?mode=${encodeURIComponent(mode)}`, 
      { rtspUrl }
    );
  },

  // -----------------------------
  // Runtime metrics
  // NOTE: backend returns 404 when no runtime exists yet.
  // Your UI should treat 404 as "null runtime" not as a fatal error.
  // -----------------------------
  async runtime(id: number): Promise<CameraRuntimeStatus> {
    assertValidId(id);
    return apiClient.get<CameraRuntimeStatus>(`/Camera/${id}/runtime`);
  },

  async runtimeAll(): Promise<CameraRuntimeStatus[]> {
    return apiClient.get<CameraRuntimeStatus[]>(`/Camera/runtime`);
  },

  async recentEvents(id: number, minutes = 15, limit = 50): Promise<RecentCameraEvent[]> {
    assertValidId(id);
    return apiClient.get<RecentCameraEvent[]>(
      `/Camera/${id}/events/recent?minutes=${minutes}&limit=${limit}`
    );
  },
};

export default cameraApi;
