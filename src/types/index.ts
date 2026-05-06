// ==================== ENUMS ====================

export enum UserRole {
  Admin = 1,
  Operator = 2,
  User = 3,
}

export enum IncidentType {
  Waste = 1,
  Fighting = 2,
  UnauthorizedAccess = 3,
  Weapon = 4,
  AirQuality = 5,
  Vandalism = 6,
  Other = 99,
}

export enum IncidentSeverity {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export enum IncidentStatus {
  Open = 0,
  Assigned = 1,
  InProgress = 2,
  Resolved = 3,
  Closed = 4,
}

export enum IncidentSource {
  Manual = 1,
  AIDetection = 2,
  Sensor = 3,
  CitizenReport = 4,
}

export enum OperatorType {
  Airport = 1,
  Hospital = 2,
  University = 3,
  Factory = 4,
  Urban = 5,
}

export enum SensorType {
  AirQuality = 1,
  Temperature = 2,
  Humidity = 3,
  Motion = 4,
}

export enum CameraAICapabilities {
  None = 0,
  Face = 1,
  Object = 2,
  Behavior = 4,
  All = 7,
}

export enum CameraRecognitionMode {
  Disabled = 0,
  ObserveOnly = 1,
  Normal = 2,
  Strict = 3,
  Relaxed = 4,
}

export type CameraInferenceMode =
  | "face_only"
  | "behavior_only"
  | "zone_only"
  | "face_behavior"
  | "full_analytics";

export type CameraSourceProfile =
  | "auto"
  | "phone"
  | "cctv"
  | "webcam"
  | "test_video";

export enum ZoneType {
  Public = 0,
  Restricted = 1,
  Private = 2,
  Closed = 3,
}

export enum AccessType {
  Deny = 0,
  Allow = 1,
}

// ==================== VALUE OBJECTS ====================

export interface Location {
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
}

export type BoundingBox = {
  X: number;
  Y: number;
  Width: number;
  Height: number;
};

export type FaceQuality = {
  OverallScore: number;
  Sharpness: number;
  Brightness: number;
  Contrast: number;
};

// ==================== USER & AUTH ====================

export interface User {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  role: UserRole;
  operatorId?: number | null;
  isActive: boolean;
  isWatchlisted?: boolean;
  watchlistReason?: string | null;
  watchlistAddedAt?: string | null;
  watchlistAddedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface TokenDto {
  Token: string;
}

export interface RegisterUserDto {
  fullName: string;
  email: string;
  password: string;
  operatorId?: string | null;
  role: string;
}

export interface CreateUserWithRoleDTO {
  fullName: string;
  email: string;
  password: string;
  operatorId?: number | null;
  role: UserRole;
}

export interface UpdateUserDTO {
  fullName?: string;
  operatorId?: number | null;
  isActive?: boolean;
  role?: UserRole;
  isWatchlisted?: boolean;
  watchlistReason?: string | null;
  watchlistUpdatedBy?: string | null;
}

export interface UserResponseDTO {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserFaceProfileSummary {
  id: string;
  description?: string | null;
  isPrimary: boolean;
  createdAt: string;
  previewUrl?: string | null;
}

export interface UserZoneRestrictionSummary {
  id: number;
  zoneId: number;
  zoneName: string;
  reason: string;
  restrictedAt: string;
  expiresAt?: string | null;
  isActive: boolean;
  notes?: string | null;
}

export interface UserSecurityProfile {
  user: User;
  faceProfiles: UserFaceProfileSummary[];
  restrictions: UserZoneRestrictionSummary[];
}

export interface RoleSummary {
  id: string;
  name: string;
}

export interface Zone {
  id: number;
  zoneCode: string;
  name: string;
  description?: string | null;
  zoneType: ZoneType;
  operatorId?: number | null;
  isActive: boolean;
  createdAt?: string | null;
  cameras?: CameraDTO[];
}

// ==================== INCIDENT ====================

export interface Incident {
  id: number;
  title: string;
  description?: string | null;
  type: IncidentType;
  source: IncidentSource;
  severity: IncidentSeverity;
  status: IncidentStatus;
  operatorId?: number | null;
  location?: Location | null;
  payloadJson?: string | null;
  assignedToUserId?: string | null;
  timestamp: string;
  assignedAt?: string | null;
  startedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface CreateIncidentRequest {
  title: string;
  description?: string;
  type: IncidentType;
  source: IncidentSource;
  operatorId?: number;
  location?: Location;
  payloadJson?: string;
}

export interface IncidentResponse {
  id: number;
  title: string;
  description?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  operatorId?: number;
  location?: Location;
  assignedToUserId?: string;
  timestamp: string;
  assignedAt?: string;
  startedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface EvidenceSnapshot {
  snapshotId?: string | null;
  url?: string | null;
  takenAtUtc?: string | null;
  sourceCameraId?: number | null;
  sourceRuntime?: string | null;
}

export interface AlertPersonEvidence {
  userId?: string | null;
  faceProfileId?: string | null;
  displayName?: string | null;
  profilePhotoUrl?: string | null;
  watchlistReason?: string | null;
}

export interface SecurityAlert {
  incidentId: number;
  title: string;
  description?: string | null;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  alertCategory: string;
  sourceRuntime?: string | null;
  reason?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
  cameraId?: number | null;
  cameraName?: string | null;
  streamKey?: string | null;
  confidence?: number | null;
  similarity?: number | null;
  occurredAtUtc: string;
  person?: AlertPersonEvidence | null;
  snapshot?: EvidenceSnapshot | null;
}

// ==================== CAMERA ====================

export interface Camera {
  id: number;
  name: string;
  operatorId?: number | null;
  rtspUrl: string;
  location?: Location | null;
  isActive: boolean;
  createdAt?: string | null;
  lastSeenAt?: string | null;
  zoneId: string;
  capabilities: CameraAICapabilities;
  recognitionMode: CameraRecognitionMode;
  matchThresholdOverride?: number | null;
}

export interface CameraDTO {
  id: number;
  name: string;
  rtspUrl: string;
  isActive: boolean;
  capabilities: CameraAICapabilities;
  recognitionMode: CameraRecognitionMode;
  matchThresholdOverride?: number | null;
  inferenceMode?: CameraInferenceMode;
  sourceProfile?: CameraSourceProfile;
  expectedWidth?: number | null;
  expectedHeight?: number | null;
  expectedFps?: number | null;
  StreamKey?: string | null;
  zoneId?: number | null;
  zoneName?: string | null;
  operatorId?: number | null;
  useFace?: boolean;
  useObject?: boolean;
  useBehavior?: boolean;
}

export interface CreateZoneRequest {
  zoneCode: string;
  name: string;
  description?: string | null;
  zoneType: ZoneType;
  operatorId?: number | null;
}

export interface UpdateZoneRequest {
  name: string;
  description?: string | null;
  zoneType: ZoneType;
  isActive: boolean;
}

export interface ZonePolicy {
  id: number;
  zoneId: number;
  roleId?: string | null;
  userId?: string | null;
  accessType: AccessType;
  priority: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string | null;
  description?: string | null;
  role?: RoleSummary | null;
  user?: User | null;
}

export interface UserZoneRestriction {
  id: number;
  userId: string;
  zoneId: number;
  reason: string;
  restrictedAt: string;
  restrictedBy?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  notes?: string | null;
  user?: User | null;
  zone?: Zone | null;
}

export interface AccessDecision {
  isAllowed: boolean;
  reason: string;
  appliedPolicyId?: number | null;
  appliedRestrictionId?: number | null;
}

export interface CreateCameraRequest {
  name: string;
  rtspUrl: string;
  capabilities: CameraAICapabilities;
  recognitionMode: CameraRecognitionMode;
  matchThresholdOverride?: number;
  inferenceMode?: CameraInferenceMode;
  sourceProfile?: CameraSourceProfile;
  expectedWidth?: number | null;
  expectedHeight?: number | null;
  expectedFps?: number | null;
  zoneId?: number | null;
  useFace?: boolean;
  useObject?: boolean;
  useBehavior?: boolean;
}

export interface UpdateCameraRequest {
  name?: string;
  rtspUrl?: string;
  isActive: boolean;
  capabilities: CameraAICapabilities;
  recognitionMode: CameraRecognitionMode;
  matchThresholdOverride?: number | null;
  inferenceMode?: CameraInferenceMode;
  sourceProfile?: CameraSourceProfile;
  expectedWidth?: number | null;
  expectedHeight?: number | null;
  expectedFps?: number | null;
  zoneId?: number | null;
  useFace?: boolean;
  useObject?: boolean;
  useBehavior?: boolean;
}

export interface StartCameraRequest {
  rtspUrl?: string;
}

export interface CameraMonitoringStatus {
  cameraId: number;
  rtspUrl: string;
  startedAt: string;
  isRunning: boolean;
}

// ==================== FACE RECOGNITION ====================

export interface FaceProfile {
  id: string;
  userId: string;
  isPrimary: boolean;
  description?: string;
  createdAt: string;
}

export interface FaceEmbedding {
  id: number;
  faceProfileId: string;
  vector: string; // base64 encoded
  sourceCameraId?: string;
  createdAt?: string;
}

export interface EnrollFaceRequest {
  userId: string;
  image: File;
  description?: string;
}

export interface VerifyFaceRequest {
  cameraId: string;
  image: File;
}

export interface FaceMatchResponse {
  isMatch: boolean;
  userId?: string;
  faceProfileId?: string;
  similarity: number;
}

export interface MultiFaceMatchResponse {
  faceId?: number;
  boundingBox: BoundingBox;
  overallQuality: number;
  isMatch: boolean;
  userId?: string;
  faceProfileId?: string;
  similarity: number;
}

// ==================== OPERATOR ====================

export interface Operator {
  id: number;
  name: string;
  type: OperatorType;
  location: string;
  createdAt?: string;
  isActive: boolean;
}

// ==================== SENSOR ====================

export interface Sensor {
  id: number;
  name: string;
  operatorId: number;
  type: SensorType;
  location: Location;
  isActive: boolean;
  createdAt: string;
  lastReadingAt?: string;
}

// ==================== TRACKING ====================

export interface UserTrackingSession {
  userId: string;
  faceProfileId: string;
  lastSeenUtc: string;
  lastCameraId?: string;
  seenCameras: string[];
  visitedZones: Record<string, string>;
  similarityHistory: number[];
  avgSimilarity: number;
}

// ==================== SIGNALR REAL-TIME EVENTS ====================

export type RealtimeEnvelope<T = unknown> = {
  Topic: string;
  Event: string;
  Data: T;
  TsUtc: string; // ISO string
  MessageId?: string | null;
  CorrelationId?: string | null;
};

export type FaceRecognizedPayload = {
  CameraId: string;
  FrameId: string;
  UserId?: string | null;
  FaceProfileId?: string | null;
  DisplayName?: string | null;
  Similarity: number;
  Confidence: number;
  BBox: BoundingBox;
  Quality?: FaceQuality | null;
  TrackingId?: string | null;
  TsUtc: string; // ISO string
  SourceWidth?: number | null;
  SourceHeight?: number | null;
};

export type BehaviorAlertPayload = {
  CameraId: string;
  StreamKey: string;
  FrameId: string;
  TrackId: number;
  ActionType: string;
  Confidence: number;
  AlertLevel: string;
  AlertMessage?: string | null;
  BBox: BoundingBox;
  SourceWidth?: number | null;
  SourceHeight?: number | null;
  TsUtc: string;
};

export type ZoneIntrusionPayload = {
  CameraId: string;
  StreamKey: string;
  ZoneId: string;
  ZoneName: string;
  Status: string;
  ObjectCount: number;
  UnauthorizedAccess: boolean;
  AlertLevel: string;
  TsUtc: string;
};

export type AnomalyDetectedPayload = {
  CameraId: string;
  StreamKey: string;
  FrameId: string;
  TrackId: number;
  AnomalyType: string;
  Confidence: number;
  AlertLevel: string;
  Description?: string | null;
  BBox: BoundingBox;
  SourceWidth?: number | null;
  SourceHeight?: number | null;
  TsUtc: string;
};

export type ObjectDetectedPayload = {
  CameraId: string;
  StreamKey: string;
  FrameId: string;
  TrackId: number;
  ClassLabel: string;
  ClassId: number;
  Confidence: number;
  BBox: BoundingBox;
  SourceWidth?: number | null;
  SourceHeight?: number | null;
  TsUtc: string;
};

export type WatchlistDetectedPayload = {
  CameraId: string;
  StreamKey: string;
  FrameId: string;
  TrackId?: number | string | null;
  IncidentId?: number | null;
  UserId: string;
  FaceProfileId: string;
  UserName?: string | null;
  FullName?: string | null;
  WatchlistReason?: string | null;
  Similarity: number;
  Confidence: number;
  BBox: BoundingBox;
  SourceWidth?: number | null;
  SourceHeight?: number | null;
  SnapshotId?: string | null;
  SnapshotUrl?: string | null;
  ProfilePhotoUrl?: string | null;
  TsUtc: string;
  WatchlistAddedAt: string;
};

export type BBoxTrackPayload = {
  CameraId: string;
  TrackId: number;
  FrameId: number;
  X: number;
  Y: number;
  W: number;
  H: number;
  PersonName: string | null;
  PersonId: string | null;
  IdentityConfidence: number;
  BehaviorLabel: string | null;
  Severity: string;
  IdentityLocked: boolean;
  SourceWidth: number;
  SourceHeight: number;
  TsMs: number;
};

export type CameraOverlayEvent =
  | {
      kind: "face";
      id: string;
      label: string;
      sublabel?: string;
      trackId?: string | number | null;
      severity?: "info" | "warning" | "critical";
      bbox: BoundingBox;
      confidence?: number | null;
      similarity?: number | null;
      sourceWidth?: number | null;
      sourceHeight?: number | null;
    }
  | {
      kind: "object";
      id: string;
      label: string;
      sublabel?: string;
      trackId?: string | number | null;
      severity?: "info" | "warning";
      bbox: BoundingBox;
      confidence?: number | null;
      sourceWidth?: number | null;
      sourceHeight?: number | null;
    }
  | {
      kind: "behavior";
      id: string;
      label: string;
      sublabel?: string;
      trackId?: string | number | null;
      severity?: "info" | "warning" | "critical";
      bbox: BoundingBox;
      confidence?: number | null;
      sourceWidth?: number | null;
      sourceHeight?: number | null;
    }
  | {
      kind: "anomaly";
      id: string;
      label: string;
      sublabel?: string;
      trackId?: string | number | null;
      severity?: "warning" | "critical";
      bbox: BoundingBox;
      confidence?: number | null;
      sourceWidth?: number | null;
      sourceHeight?: number | null;
    };

export type CameraSecurityRealtimeEvent =
  | { kind: "face"; payload: FaceRecognizedPayload; topic: string; event: string }
  | { kind: "object"; payload: ObjectDetectedPayload; topic: string; event: string }
  | { kind: "behavior"; payload: BehaviorAlertPayload; topic: string; event: string }
  | { kind: "zone"; payload: ZoneIntrusionPayload; topic: string; event: string }
  | { kind: "anomaly"; payload: AnomalyDetectedPayload; topic: string; event: string }
  | { kind: "watchlist"; payload: WatchlistDetectedPayload; topic: string; event: string };

export interface CameraTrackingPayload {
  CameraId: string;
  UserId: string;
  FaceProfileId: string;
  DisplayName: string;
  AvgSimilarity: number;
  TotalSightings: number;
  SeenCameras: string[];
  VisitedZones: Record<string, string>;
  FirstSeenUtc: string;
  LastSeenUtc: string;
}

export type CameraStatusPayload = {
  CameraId: string;
  IsOnline: boolean;
  Fps?: number | null;
  Message?: string | null;
  // TsUtc: string; // only if you add it to backend envelope; otherwise remove
};


export interface SensorAlertPayload {
  sensorId: string;
  sensorType: string;
  location: string;
  value: number;
  unit: string;
  severity: string;
  message: string;
  tsUtc: string;
}

export interface SystemNotificationPayload {
  level: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  tsUtc: string;
}

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PlatformDataSummary {
  users: number;
  operators: number;
  zones: number;
  cameras: number;
  policies: number;
  restrictions: number;
  incidents: number;
  faceProfiles: number;
}

export interface AiControlOption {
  value: string;
  label: string;
}

export interface AiControlField {
  key: string;
  label: string;
  type: "boolean" | "number" | "select";
  value: boolean | number | string | null;
  description?: string | null;
  requiresRestart: boolean;
  min?: number | null;
  max?: number | null;
  step?: number | null;
  unit?: string | null;
  options?: AiControlOption[] | null;
}

export interface AiControlGroup {
  key: string;
  title: string;
  description: string;
  fields: AiControlField[];
}

export interface AiControlDocument {
  kind: "live" | "startup";
  title: string;
  description: string;
  requiresRestart: boolean;
  groups: AiControlGroup[];
}

export interface AiControlScope {
  id: "deepstream" | "legacy-ai" | string;
  name: string;
  description: string;
  documents: AiControlDocument[];
}

export interface AiControlSnapshot {
  generatedAtUtc: string;
  scopes: AiControlScope[];
}

export type CameraRuntimeStatus = {
  CameraId: number;
  IsRunning: boolean;
  Fps?: number;
  TargetFps?: number;
  QueueDepth?: number;
  QueueCapacity?: number;
  DroppedFrames?: number;
  AvgAiMs?: number;
  AvgMatchMs?: number;
  AvgTotalMs?: number;
  LastFrameUtc?: string;
  StartedAtUtc?: string;
  UpTimeSeconds?: number;
  LastError?: string;
};

export type RuntimeMetrics = {
  fps: number;
  queueDepth: number;
  droppedFrames: number;
  avgAiMs: number;
  avgMatchMs: number;
  avgTotalMs: number;
  uptime: string;
  lastFrame: string;
  lastError: string;
  isOnline: boolean;
};

export type RuntimeHistoryPoint = {
  timestamp: string;
  fps: number;
  queueDepth: number;
  droppedFrames: number;
  aiLatency: number;
  matchLatency: number;
  totalLatency: number;
};

export type TabKey = "live" | "metrics" | "events" | "settings";

export type CameraEditForm = {
  name: string;
  rtspUrl: string;
  isActive: boolean;
  capabilities: number;
  recognitionMode: number;
  matchThresholdOverride: number | null;
  inferenceMode?: CameraInferenceMode;
  sourceProfile?: CameraSourceProfile;
  expectedWidth?: number | null;
  expectedHeight?: number | null;
  expectedFps?: number | null;
  zoneId?: number | null;
  useFace?: boolean;
  useObject?: boolean;
  useBehavior?: boolean;
};

export interface CameraStreamStatus {
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
}

export type DetectionEvent = {
  id: string;
  displayName: string;
  userId: string | null;
  confidence: number;
  similarity: number;
  trackingId: string | null;
  frameId: string | null;
  timestamp: string;
  isUnknown: boolean;
};

// ==================== DEEPSTREAM ====================

export type PipelineReadyState =
  | "INITIALIZING"
  | "WARMING"
  | "READY_HOT"
  | "RUNNING"
  | "DEGRADED"
  | string;

export type DeepStreamReadyPayload = {
  InstanceId: string;
  PipelineVersion: string;
  ReadyState: PipelineReadyState;
  ActiveCameras: number;
  IdleSourceSlots: number;
  StatusDetail: string | null;
};

export type BehaviorBoundingBox = {
  X: number;
  Y: number;
  W: number;
  H: number;
  Confidence: number;
};

export type DeepStreamBehaviorAlertPayload = {
  CameraDbId: number;
  StreamKey: string;
  TrackId: number;
  FrameId: number;
  Action: string;
  Confidence: number;
  AlertLevel: "INFO" | "WARNING" | "CRITICAL" | string;
  AlertMessage: string | null;
  Bbox: BehaviorBoundingBox | null;
  PipelineVersion: string;
  TsUtc: string;
};

// ==================== ABP (Abnormal Behavior Prediction) ====================

// Matches SuspicionAlertPayload.cs (SignalR realtime event from backend)
// PascalCase to match .NET serialization convention (see FaceRecognizedPayload).
export type SuspicionAlertPayload = {
  EventId: string;       // UUID for feedback correlation
  CameraId: string;
  TrackId: number;
  SuspicionScore: number;  // sigmoid [0,1]
  IsSuspicious: boolean;
  Threshold: number;
  FeatureVector: number[]; // 6 values: [behavior, pose, motion, temporal, zone_risk, ir]
  TsUtc: string;
  ClipUrl?: string;        // null when clip not available
};

// For displaying ABP events in the UI (from GET /api/abp/events).
// camelCase because this comes from a JSON REST endpoint (see SecurityAlert).
export interface ABPSuspicionEvent {
  id: number;
  eventId: string;
  cameraId: string;
  trackId: number;
  suspicionScore: number;
  isSuspicious: boolean;
  featureVector: number[];
  occurredAtUtc: string;
  hasFeedback: boolean;
  incidentId?: number;
  clipUrl?: string;
}

// From GET /api/abp/weights
export interface ABPWeightsSnapshot {
  enabled: boolean;
  threshold: number;
  weights: number[];        // current working weights
  feedbackCount: number;
  weightsVersion: string;
  bestWeights: number[];    // champion weights (auto-reverted to when current degrades)
  bestScore: number;        // champion balanced accuracy [0,1]
  driftCount: number;       // ADWIN concept drift detections since startup
  zoneWeights: Record<string, { weights: number[]; bestScore: number }>;
}

// For POST /api/abp/proactive request
export interface ABPProactiveRequest {
  cameraId: string;
  actionType: string;
  isAbnormal: boolean;
  frameWindow: number;
  zoneId?: string;
}

// For POST /api/abp/proactive response
export interface ABPProactiveResult {
  eventId: string;
  featureVector: number[];
  suspicionScore: number;
  gaTriggered: boolean;
  feedbackStoreSize: number;
}

// ==================== INTERACTIVE MAP ====================

export interface MapZoneDto {
  Id: number;
  ZoneCode: string;
  Name: string;
  Description?: string | null;
  ZoneType: ZoneType;
  IsActive: boolean;
  LayoutX?: number | null;
  LayoutY?: number | null;
  LayoutW?: number | null;
  LayoutH?: number | null;
  FloorId?: string | null;
  CameraCount: number;
  ActivePolicyCount: number;
}

export interface MapCameraDto {
  Id: number;
  Name: string;
  ZoneId?: number | null;
  ZoneName?: string | null;
  IsActive: boolean;
  LayoutX?: number | null;
  LayoutY?: number | null;
  FovHeadingDeg?: number | null;
  FovAngleDeg?: number | null;
  FovRangeUnits?: number | null;
  StreamKey: string;
  RtspUrl?: string | null;
}

export interface MapEdgeDto {
  FromCameraId: number;
  ToCameraId: number;
  TravelSeconds: number;
}

export interface MapLayoutDto {
  Zones: MapZoneDto[];
  Cameras: MapCameraDto[];
  Edges: MapEdgeDto[];
  Floors: string[];
}

export interface ActivePersonDto {
  UserId: string;
  FaceProfileId: string;
  DisplayName?: string | null;
  UserName?: string | null;
  LastCameraId?: string | null;
  LastZoneId?: string | null;
  AvgSimilarity: number;
  FirstSeenUtc: string;
  LastSeenUtc: string;
  SeenCameras: string[];
  VisitedZones: Record<string, string>;
}

export type PersonExpiredPayload = {
  UserId: string;
  DisplayName?: string | null;
  TsUtc: string;
};

export type CrossCameraReIdPayload = {
  UserId: string;
  DisplayName: string;
  FromCameraId: string;
  ToCameraId: string;
  ZoneId: string;
  TravelSeconds: number;
  Similarity: number;
  TsUtc: string;
};

export type MapViewMode = '2d' | '3d';

export type PersonStatus = 'known' | 'unknown' | 'watchlist' | 'unauthorized';

export interface MapPersonPosition {
  x: number;
  y: number;
}

export interface MapPersonTrailPoint {
  x: number;
  y: number;
  t: number;
}

export interface MapPerson {
  id: string;
  userId?: string | null;
  faceProfileId?: string | null;
  displayName: string;
  status: PersonStatus;
  currentCameraId?: string | null;
  currentZoneId?: number | null;
  position: MapPersonPosition;
  targetPosition: MapPersonPosition;
  trail: MapPersonTrailPoint[];
  avgSimilarity: number;
  isWatchlist: boolean;
  firstSeenUtc: string;
  lastSeenUtc: string;
  lastEventAt: number;
}

export interface MapCameraRuntime {
  cameraId: number;
  isOnline: boolean;
  hasActiveIncident: boolean;
  lastEventAt: number;
}

export interface MapIncident {
  id: number;
  cameraId?: number | null;
  zoneId?: number | null;
  severity: IncidentSeverity;
  type: IncidentType;
  title: string;
  status: IncidentStatus;
  timestamp: string;
}

export interface MapFilters {
  zoneTypes: Set<ZoneType>;
  personStatuses: Set<PersonStatus>;
  minSeverity: IncidentSeverity;
  hideOfflineCameras: boolean;
  floorId: string | null;
}
