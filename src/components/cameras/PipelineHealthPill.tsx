import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useWhepFrameHealth } from "@/hooks/useWhepStream2";

type PipelineHealthPillProps = {
  cameraId: string;
};

type DeepStreamCameraHealthResponse = {
  CameraId: number;
  IngestFresh: boolean;
  HeartbeatFresh: boolean;
  FacePipelineHealthy: boolean;
  BehaviorPipelineHealthy: boolean;
  LastIngestUtc?: string | null;
  LastHeartbeatUtc?: string | null;
  LastFaceUtc?: string | null;
  LastBehaviorUtc?: string | null;
  DegradeReasons?: string[] | null;
};

type Segment = {
  key: string;
  label: string;
  healthy: boolean;
  lastEventUtc: string | null | undefined;
  reasons?: string[] | null;
};

function formatLastEvent(lastEventUtc: string | null | undefined) {
  if (!lastEventUtc) {
    return "No recent signal";
  }

  return new Date(lastEventUtc).toLocaleString();
}

function segmentTitle(segment: Segment) {
  const lines = [
    `${segment.label}: ${segment.healthy ? "Healthy" : "Degraded"}`,
    `Last signal: ${formatLastEvent(segment.lastEventUtc)}`,
  ];

  if (segment.reasons && segment.reasons.length > 0) {
    lines.push(`Reasons: ${segment.reasons.join(", ")}`);
  }

  return lines.join("\n");
}

function segmentReasons(
  reasons: string[] | null | undefined,
  predicate: (reason: string) => boolean
) {
  return (reasons ?? []).filter(predicate);
}

export function PipelineHealthPill({ cameraId }: PipelineHealthPillProps) {
  const whepFrameHealth = useWhepFrameHealth(cameraId);

  const { data } = useQuery({
    queryKey: ["deepstream-camera-health", cameraId],
    queryFn: () =>
      apiClient.get<DeepStreamCameraHealthResponse>(
        `/health/deepstream/${cameraId}`,
        undefined,
        { cache: false }
      ),
    refetchInterval: 5000,
    staleTime: 0,
  });

  const segments: Segment[] = [
    {
      key: "whep",
      label: "WHEP",
      healthy: whepFrameHealth.frameFresh,
      lastEventUtc: whepFrameHealth.lastFrameAtUtc,
    },
    {
      key: "ingest",
      label: "Ingest",
      healthy: Boolean(data?.IngestFresh && data?.HeartbeatFresh),
      lastEventUtc: data?.LastIngestUtc ?? data?.LastHeartbeatUtc,
      reasons: segmentReasons(data?.DegradeReasons, (reason) => reason.includes("ingest") || reason.includes("heartbeat")),
    },
    {
      key: "face",
      label: "Face",
      healthy: Boolean(data?.FacePipelineHealthy),
      lastEventUtc: data?.LastFaceUtc ?? data?.LastIngestUtc,
      reasons: segmentReasons(data?.DegradeReasons, (reason) => reason.includes("face")),
    },
    {
      key: "behavior",
      label: "Behavior",
      healthy: Boolean(data?.BehaviorPipelineHealthy),
      lastEventUtc: data?.LastBehaviorUtc ?? data?.LastIngestUtc,
      reasons: segmentReasons(data?.DegradeReasons, (reason) => reason.includes("behavior")),
    },
  ];

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-border/60 bg-muted/20 shadow-sm">
      {segments.map((segment, index) => (
        <div
          key={segment.key}
          title={segmentTitle(segment)}
          className={[
            "px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
            segment.healthy
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/15 text-rose-300",
            index > 0 ? "border-l border-border/60" : "",
          ].join(" ")}
        >
          {segment.label}
        </div>
      ))}
    </div>
  );
}
