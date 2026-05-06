import type { IncidentStatus, IncidentSeverity } from "@/types";

export function getIncidentStatusColor(status: IncidentStatus): string {
  const colors = {
    0: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Open
    1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", // Assigned
    2: "bg-orange-500/20 text-orange-400 border-orange-500/30", // In Progress
    3: "bg-green-500/20 text-green-400 border-green-500/30", // Resolved
    4: "bg-gray-500/20 text-gray-400 border-gray-500/30", // Closed
  };
  return colors[status as keyof typeof colors] || colors[0];
}

export function getIncidentSeverityColor(severity: IncidentSeverity): string {
  const colors = {
    1: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Low
    2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", // Medium
    3: "bg-orange-500/20 text-orange-400 border-orange-500/30", // High
    4: "bg-red-500/20 text-red-400 border-red-500/30", // Critical
  };
  return colors[severity as keyof typeof colors] || colors[1];
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = Date.parse(iso);
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

export function calculateResolutionTime(
  timestamp: string,
  resolvedAt?: string
): number {
  if (!resolvedAt) return 0;
  return (Date.parse(resolvedAt) - Date.parse(timestamp)) / 1000;
}