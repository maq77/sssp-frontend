import { useMemo } from "react";
import type { IncidentResponse, IncidentStatus, IncidentSeverity, IncidentType } from "@/types";

export type IncidentFilters = {
  searchTerm: string;
  statusFilter: IncidentStatus | "all";
  severityFilter: IncidentSeverity | "all";
  typeFilter: IncidentType | "all";
  timeRange?: Date | null;
};

export function useIncidentFilters(
  incidents: IncidentResponse[],
  filters: IncidentFilters
): IncidentResponse[] {
  return useMemo(() => {
    let filtered = incidents;

    // Time range
    if (filters.timeRange) {
      filtered = filtered.filter(
        (i) => Date.parse(i.timestamp) >= filters.timeRange!.getTime()
      );
    }

    // Search
    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.timestamp.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          String(i.id).includes(q)
      );
    }

    // Status
    if (filters.statusFilter !== "all") {
      filtered = filtered.filter((i) => i.status === filters.statusFilter);
    }

    // Severity
    if (filters.severityFilter !== "all") {
      filtered = filtered.filter((i) => i.severity === filters.severityFilter);
    }

    // Type
    if (filters.typeFilter !== "all") {
      filtered = filtered.filter((i) => i.type === filters.typeFilter);
    }

    return filtered;
  }, [incidents, filters]);
}