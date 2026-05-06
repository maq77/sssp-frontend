import { useMemo } from "react";
import type { IncidentResponse } from "@/types";

export type ChartDataPoint = {
  name: string;
  value: number;
  timestamp?: string;
};

export function useIncidentTimelineChart(
  incidents: IncidentResponse[],
  timeRange: "1h" | "24h" | "7d" | "30d" | "all"
): ChartDataPoint[] {
  return useMemo(() => {
    const buckets: Record<string, number> = {};
    const now = new Date();

    // Generate buckets
    if (timeRange === "1h" || timeRange === "24h") {
      const hours = timeRange === "1h" ? 1 : 24;
      for (let i = 0; i < hours; i++) {
        const time = new Date(now.getTime() - i * 3600000);
        const key = time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        buckets[key] = 0;
      }
    } else if (timeRange !== "all") {
      const days = timeRange === "7d" ? 7 : 30;
      for (let i = 0; i < days; i++) {
        const time = new Date(now.getTime() - i * 86400000);
        const key = time.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
        buckets[key] = 0;
      }
    }

    // Fill buckets
    incidents.forEach((i) => {
      const time = new Date(i.timestamp);
      let key: string;
      if (timeRange === "1h" || timeRange === "24h") {
        key = time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        key = time.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      }
      if (buckets[key] !== undefined) {
        buckets[key]++;
      }
    });

    return Object.entries(buckets)
      .map(([name, value]) => ({ name, value }))
      .reverse();
  }, [incidents, timeRange]);
}

export function useIncidentTypeChart(
  incidents: IncidentResponse[]
): ChartDataPoint[] {
  return useMemo(() => {
    const typeLabels: Record<number, string> = {
      1: "Waste",
      2: "Fighting",
      3: "Unauthorized Access",
      4: "Weapon",
      5: "Air Quality",
      6: "Vandalism",
      99: "Other",
    };

    const counts: Record<number, number> = {};
    incidents.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });

    return Object.entries(counts).map(([type, value]) => ({
      name: typeLabels[Number(type)] || "Unknown",
      value,
    }));
  }, [incidents]);
}

export function useIncidentSeverityChart(
  incidents: IncidentResponse[]
): ChartDataPoint[] {
  return useMemo(() => {
    const severityLabels = ["", "Low", "Medium", "High", "Critical"];
    const counts: Record<number, number> = {};
    
    incidents.forEach((i) => {
      counts[i.severity] = (counts[i.severity] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([severity]) => Number(severity) > 0)
      .map(([severity, value]) => ({
        name: severityLabels[Number(severity)],
        value,
      }));
  }, [incidents]);
}

export function useIncidentStatusChart(
  incidents: IncidentResponse[]
): ChartDataPoint[] {
  return useMemo(() => {
    const statusLabels = ["Open", "Assigned", "In Progress", "Resolved", "Closed"];
    const counts: Record<number, number> = {};
    
    incidents.forEach((i) => {
      counts[i.status] = (counts[i.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, value]) => ({
      name: statusLabels[Number(status)],
      value,
    }));
  }, [incidents]);
}