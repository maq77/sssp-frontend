import { useMemo } from "react";
import type { IncidentResponse } from "@/types";

export type IncidentMetrics = {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  avgResolutionTime: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  trendPercentage: number;
};

export function useIncidentMetrics(
  incidents: IncidentResponse[],
  timeRange?: Date
): IncidentMetrics {
  return useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status === 0).length;
    const assigned = incidents.filter((i) => i.status === 1).length;
    const inProgress = incidents.filter((i) => i.status === 2).length;
    const resolved = incidents.filter((i) => i.status === 3).length;
    const closed = incidents.filter((i) => i.status === 4).length;

    const criticalCount = incidents.filter((i) => i.severity === 4).length;
    const highCount = incidents.filter((i) => i.severity === 3).length;
    const mediumCount = incidents.filter((i) => i.severity === 2).length;
    const lowCount = incidents.filter((i) => i.severity === 1).length;

    // Avg resolution time
    const resolvedIncidents = incidents.filter((i) => i.resolvedAt);
    const totalResolutionTime = resolvedIncidents.reduce((acc, i) => {
      const start = Date.parse(i.timestamp);
      const end = Date.parse(i.resolvedAt!);
      return acc + (end - start) / 1000;
    }, 0);
    const avgResolutionTime =
      resolvedIncidents.length > 0
        ? totalResolutionTime / resolvedIncidents.length
        : 0;

    // Trend calculation (if timeRange provided)
    let trendPercentage = 0;
    if (timeRange) {
      const periodDuration = Date.now() - timeRange.getTime();
      const previousCutoff = new Date(timeRange.getTime() - periodDuration);
      const previousCount = incidents.filter(
        (i) =>
          Date.parse(i.timestamp) >= previousCutoff.getTime() &&
          Date.parse(i.timestamp) < timeRange.getTime()
      ).length;
      trendPercentage =
        previousCount === 0 ? 0 : ((total - previousCount) / previousCount) * 100;
    }

    return {
      total,
      open,
      assigned,
      inProgress,
      resolved,
      closed,
      avgResolutionTime,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      trendPercentage,
    };
  }, [incidents, timeRange]);
}