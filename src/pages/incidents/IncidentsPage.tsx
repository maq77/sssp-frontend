import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Plus,
  RefreshCcw,
  BarChart3,
  Activity,
  Zap,
  Shield,
  AlertCircle,
  MapPin,
  Calendar,
  Eye,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import apiClient from "@/lib/api-client";
import securityAlertApi from "@/lib/api/securityAlertApi";
import signalRService from "@/lib/signalr-service";

import type {
  IncidentResponse,
  IncidentStatus,
  IncidentSeverity,
  IncidentType,
  IncidentSource,
  Location,
  CreateIncidentRequest,
  SecurityAlert,
} from "@/types";

// ==================== TIME RANGE ====================

const TIME_RANGES = ["1h", "24h", "7d", "30d", "all"] as const;
type TimeRange = (typeof TIME_RANGES)[number];

function isTimeRange(v: string): v is TimeRange {
  return (TIME_RANGES as readonly string[]).includes(v);
}

// ==================== LABELS / COLORS ====================

const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  1: "Waste",
  2: "Fighting",
  3: "Unauthorized Access",
  4: "Weapon",
  5: "Air Quality",
  6: "Vandalism",
  99: "Other",
};

const INCIDENT_SOURCE_LABELS: Record<IncidentSource, string> = {
  1: "Manual",
  2: "AI Detection",
  3: "Sensor",
  4: "Citizen Report",
};

const SEVERITY_LABELS = ["", "Low", "Medium", "High", "Critical"] as const;
const STATUS_LABELS = ["Open", "Assigned", "In Progress", "Resolved", "Closed"] as const;

const SEVERITY_COLORS: Record<number, string> = {
  1: "#3b82f6",
  2: "#eab308",
  3: "#f97316",
  4: "#ef4444",
};

const STATUS_COLORS: Record<number, string> = {
  0: "#3b82f6",
  1: "#eab308",
  2: "#f97316",
  3: "#22c55e",
  4: "#6b7280",
};

function incidentTypeLabel(type: IncidentType): string {
  return INCIDENT_TYPE_LABELS[type] ?? "Unknown";
}

// ==================== TYPES ====================

type IncidentMetrics = {
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

type ChartDataPoint = { name: string; value: number };

type RealtimeEnvelope<T> = { Event: string; Data: T };

// ==================== NORMALIZATION (NO ANY LEAKS) ====================

function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const r = raw as any;
  const maybe = r?.data ?? r?.Data ?? r?.items ?? r?.Items ?? r?.result ?? r?.Result;
  return Array.isArray(maybe) ? (maybe as T[]) : [];
}

function normalizeIncident(x: unknown): IncidentResponse {
  const a = x as any;

  const ts =
    a?.timestamp ??
    a?.Timestamp ??
    a?.tsUtc ??
    a?.TsUtc ??
    a?.createdAt ??
    a?.CreatedAt ??
    "";

  // NOTE: this assumes IncidentResponse fields are camelCase in FE type.
  // We map from either camelCase or PascalCase from backend.
  return {
    id: Number(a?.id ?? a?.Id ?? 0),
    title: String(a?.title ?? a?.Title ?? ""),
    description: (a?.description ?? a?.Description ?? undefined) as string | undefined,

    type: Number(a?.type ?? a?.Type ?? 99) as IncidentType,
    severity: Number(a?.severity ?? a?.Severity ?? 2) as IncidentSeverity,
    status: Number(a?.status ?? a?.Status ?? 0) as IncidentStatus,
    source: Number(a?.source ?? a?.Source ?? 1) as IncidentSource,

    operatorId: (a?.operatorId ?? a?.OperatorId ?? undefined) as number | undefined,
    assignedToUserId: (a?.assignedToUserId ?? a?.AssignedToUserId ?? undefined) as
      | string
      | undefined,

    timestamp: String(ts ?? ""),
    assignedAt: (a?.assignedAt ?? a?.AssignedAt ?? undefined) as string | undefined,
    startedAt: (a?.startedAt ?? a?.StartedAt ?? undefined) as string | undefined,
    resolvedAt: (a?.resolvedAt ?? a?.ResolvedAt ?? undefined) as string | undefined,
    closedAt: (a?.closedAt ?? a?.ClosedAt ?? undefined) as string | undefined,

    location: (a?.location ?? a?.Location ?? undefined) as Location | undefined,
  };
}

function normalizeIncidents(raw: unknown): IncidentResponse[] {
  const arr = unwrapArray<unknown>(raw);
  return arr.map(normalizeIncident).filter((x) => x.id > 0 && x.title.length > 0);
}

// ==================== UTILITIES ====================

function safeLower(s: unknown): string {
  return (typeof s === "string" ? s : "").toLowerCase();
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

function formatRelativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "—";

  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 10) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatLocalDateTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleString();
}

function getTimeRangeFilter(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "1h":
      return new Date(now.getTime() - 3600000);
    case "24h":
      return new Date(now.getTime() - 86400000);
    case "7d":
      return new Date(now.getTime() - 604800000);
    case "30d":
      return new Date(now.getTime() - 2592000000);
    default:
      return null;
  }
}

function chipStyle(hex: string) {
  return {
    borderColor: hex,
    color: hex,
    backgroundColor: `${hex}14`,
  } as const;
}

function formatLocation(loc?: Location | null) {
  if (!loc) return "—";
  if (loc.address) return loc.address;
  const lat = loc.latitude ?? null;
  const lng = loc.longitude ?? null;
  if (lat == null || lng == null) return "—";
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

function exportIncidentsCsv(rows: IncidentResponse[], fileName: string) {
  const headers = [
    "id",
    "title",
    "description",
    "timestamp",
    "status",
    "severity",
    "type",
    "source",
    "operatorId",
    "assignedToUserId",
    "assignedAt",
    "startedAt",
    "resolvedAt",
    "closedAt",
    "location.address",
    "location.latitude",
    "location.longitude",
  ];

  const csvLines = [
    headers.join(","),
    ...rows.map((i) => {
      const loc = i.location ?? null;
      const data = [
        i.id,
        i.title,
        i.description ?? "",
        i.timestamp,
        STATUS_LABELS[i.status] ?? String(i.status),
        SEVERITY_LABELS[i.severity] ?? String(i.severity),
        INCIDENT_TYPE_LABELS[i.type] ?? String(i.type),
        INCIDENT_SOURCE_LABELS[i.source] ?? String(i.source),
        i.operatorId ?? "",
        i.assignedToUserId ?? "",
        i.assignedAt ?? "",
        i.startedAt ?? "",
        i.resolvedAt ?? "",
        i.closedAt ?? "",
        loc?.address ?? "",
        loc?.latitude ?? "",
        loc?.longitude ?? "",
      ];

      return data.map((v) => `"${String(v ?? "").replaceAll(`"`, `""`)}"`).join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function severityMeta(sev: number) {
  const label = SEVERITY_LABELS[sev] || "Unknown";
  const color = SEVERITY_COLORS[sev] ?? "#6b7280";
  const icon =
    sev >= 4 ? (
      <Zap className="w-4 h-4" />
    ) : sev === 3 ? (
      <AlertTriangle className="w-4 h-4" />
    ) : sev === 2 ? (
      <AlertCircle className="w-4 h-4" />
    ) : (
      <CheckCircle className="w-4 h-4" />
    );

  return { label, color, icon };
}

function statusMeta(status: number) {
  const label = STATUS_LABELS[status] || "Unknown";
  const color = STATUS_COLORS[status] ?? "#6b7280";
  const icon =
    status === 0 ? (
      <AlertCircle className="w-4 h-4" />
    ) : status === 1 ? (
      <Users className="w-4 h-4" />
    ) : status === 2 ? (
      <Activity className="w-4 h-4" />
    ) : status === 3 ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <XCircle className="w-4 h-4" />
    );

  return { label, color, icon };
}

// ==================== MAIN ====================

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all");

  const [selectedIncident, setSelectedIncident] = useState<IncidentResponse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const pollTimerRef = useRef<number | null>(null);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const raw = await apiClient.get<unknown>("/Incident/open");
      const normalized = normalizeIncidents(raw);
      setIncidents(normalized);
    } catch (e: any) {
      toast.error("Failed to load incidents", { description: e?.message ?? "Error" });
    } finally {
      setLoading(false);
    }
  };

  // SignalR + polling
  useEffect(() => {
    loadIncidents();

    const onIncident = (envelope: RealtimeEnvelope<unknown> | unknown) => {
      // accept both envelope and direct incident
      const maybeEnv = envelope as any;
      const rawIncident = maybeEnv?.Data ?? maybeEnv?.data ?? envelope;
      const incident = normalizeIncident(rawIncident);

      if (!incident?.id) return;

      setIncidents((prev) => {
        const exists = prev.some((x) => x.id === incident.id);
        return exists ? prev.map((x) => (x.id === incident.id ? incident : x)) : [incident, ...prev];
      });

      toast.info(`Incident ${maybeEnv?.Event ?? "Update"}`, {
        description: `#${incident.id}: ${incident.title}`,
      });
    };

    signalRService.on("ReceiveIncident", onIncident);

    pollTimerRef.current = window.setInterval(loadIncidents, 30000);

    return () => {
      signalRService.off("ReceiveIncident", onIncident);
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtering
  const filteredIncidents = useMemo(() => {
    let filtered = incidents;

    const cutoff = getTimeRangeFilter(timeRange);
    if (cutoff) {
      filtered = filtered.filter((i) => {
        const t = Date.parse(i.timestamp);
        if (!Number.isFinite(t)) return true;
        return t >= cutoff.getTime();
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((i) => {
        return (
          safeLower(i.title).includes(q) ||
          safeLower(i.description).includes(q) ||
          String(i.id).includes(q) ||
          safeLower(incidentTypeLabel(i.type)).includes(q)
        );
      });
    }

    if (statusFilter !== "all") filtered = filtered.filter((i) => i.status === statusFilter);
    if (severityFilter !== "all") filtered = filtered.filter((i) => i.severity === severityFilter);
    if (typeFilter !== "all") filtered = filtered.filter((i) => i.type === typeFilter);

    return [...filtered].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }, [incidents, timeRange, searchTerm, statusFilter, severityFilter, typeFilter]);

  // Metrics
  const metrics = useMemo((): IncidentMetrics => {
    const total = filteredIncidents.length;

    const open = filteredIncidents.filter((i) => i.status === 0).length;
    const assigned = filteredIncidents.filter((i) => i.status === 1).length;
    const inProgress = filteredIncidents.filter((i) => i.status === 2).length;
    const resolved = filteredIncidents.filter((i) => i.status === 3).length;
    const closed = filteredIncidents.filter((i) => i.status === 4).length;

    const criticalCount = filteredIncidents.filter((i) => i.severity === 4).length;
    const highCount = filteredIncidents.filter((i) => i.severity === 3).length;
    const mediumCount = filteredIncidents.filter((i) => i.severity === 2).length;
    const lowCount = filteredIncidents.filter((i) => i.severity === 1).length;

    const resolvedIncidents = filteredIncidents.filter((i) => i.resolvedAt);
    const totalResolutionTime = resolvedIncidents.reduce((acc, i) => {
      const start = Date.parse(i.timestamp);
      const end = i.resolvedAt ? Date.parse(i.resolvedAt) : NaN;
      if (!Number.isFinite(start) || !Number.isFinite(end)) return acc;
      return acc + (end - start) / 1000;
    }, 0);

    const avgResolutionTime =
      resolvedIncidents.length > 0 ? totalResolutionTime / resolvedIncidents.length : 0;

    const cutoff = getTimeRangeFilter(timeRange);
    if (cutoff) {
      const periodDuration = Date.now() - cutoff.getTime();
      const previousCutoff = new Date(cutoff.getTime() - periodDuration);

      const previousCount = incidents.filter((i) => {
        const ts = Date.parse(i.timestamp);
        return ts >= previousCutoff.getTime() && ts < cutoff.getTime();
      }).length;

      const trendPercentage =
        previousCount === 0 ? 0 : ((total - previousCount) / previousCount) * 100;

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
      trendPercentage: 0,
    };
  }, [filteredIncidents, timeRange, incidents]);

  // Charts
  const severityData: ChartDataPoint[] = [
    { name: "Critical", value: metrics.criticalCount },
    { name: "High", value: metrics.highCount },
    { name: "Medium", value: metrics.mediumCount },
    { name: "Low", value: metrics.lowCount },
  ];

  const statusData: ChartDataPoint[] = [
    { name: "Open", value: metrics.open },
    { name: "Assigned", value: metrics.assigned },
    { name: "In Progress", value: metrics.inProgress },
    { name: "Resolved", value: metrics.resolved },
    { name: "Closed", value: metrics.closed },
  ];

  const timelineData = useMemo((): ChartDataPoint[] => {
    if (filteredIncidents.length === 0) return [];

    const cutoff = getTimeRangeFilter(timeRange);
    const now = new Date();

    // all => monthly buckets
    if (!cutoff) {
      const buckets: Record<string, number> = {};
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString([], { month: "short", year: "2-digit" });
        buckets[key] = 0;
      }

      filteredIncidents.forEach((i) => {
        const d = new Date(i.timestamp);
        const key = new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString([], {
          month: "short",
          year: "2-digit",
        });
        if (buckets[key] !== undefined) buckets[key]++;
      });

      return Object.entries(buckets)
        .map(([name, value]) => ({ name, value }))
        .reverse();
    }

    // hourly
    if (timeRange === "1h" || timeRange === "24h") {
      const hours = timeRange === "1h" ? 1 : 24;
      const buckets: Record<string, number> = {};
      for (let i = 0; i < hours; i++) {
        const t = new Date(now.getTime() - i * 3600000);
        const key = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        buckets[key] = 0;
      }

      filteredIncidents.forEach((i) => {
        const t = new Date(i.timestamp);
        const key = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (buckets[key] !== undefined) buckets[key]++;
      });

      return Object.entries(buckets)
        .map(([name, value]) => ({ name, value }))
        .reverse();
    }

    // daily
    const days = timeRange === "7d" ? 7 : 30;
    const buckets: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const t = new Date(now.getTime() - i * 86400000);
      const key = t.toLocaleDateString([], { month: "short", day: "numeric" });
      buckets[key] = 0;
    }

    filteredIncidents.forEach((i) => {
      const t = new Date(i.timestamp);
      const key = t.toLocaleDateString([], { month: "short", day: "numeric" });
      if (buckets[key] !== undefined) buckets[key]++;
    });

    return Object.entries(buckets)
      .map(([name, value]) => ({ name, value }))
      .reverse();
  }, [filteredIncidents, timeRange]);

  const typeData = useMemo((): ChartDataPoint[] => {
    const counts: Record<number, number> = {};
    filteredIncidents.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([t, value]) => ({
        name: incidentTypeLabel(Number(t) as IncidentType),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredIncidents]);

  const resolutionBySeverity = useMemo(() => {
    const data: Record<number, { total: number; count: number }> = {};
    filteredIncidents
      .filter((i) => i.resolvedAt)
      .forEach((i) => {
        const duration = (Date.parse(i.resolvedAt!) - Date.parse(i.timestamp)) / 1000;
        if (!Number.isFinite(duration) || duration < 0) return;
        if (!data[i.severity]) data[i.severity] = { total: 0, count: 0 };
        data[i.severity].total += duration;
        data[i.severity].count++;
      });

    return Object.entries(data).map(([sev, { total, count }]) => ({
      name: SEVERITY_LABELS[Number(sev)] || "Unknown",
      value: Math.round(total / Math.max(count, 1)),
    }));
  }, [filteredIncidents]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Incident Management</h1>
            <p className="text-muted-foreground mt-1">
              Real-time monitoring and analytics for security incidents
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadIncidents} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Incident
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total"
          value={metrics.total}
          icon={<BarChart3 className="w-5 h-5" />}
          trend={metrics.trendPercentage}
        />
        <KpiCard title="Open" value={metrics.open} icon={<AlertCircle className="w-5 h-5" />} color="blue" />
        <KpiCard title="In Progress" value={metrics.inProgress} icon={<Activity className="w-5 h-5" />} color="orange" />
        <KpiCard title="Resolved" value={metrics.resolved} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <KpiCard title="Critical" value={metrics.criticalCount} icon={<Zap className="w-5 h-5" />} color="red" />
        <KpiCard title="Avg Resolution" value={formatDuration(metrics.avgResolutionTime)} icon={<Clock className="w-5 h-5" />} isTime />
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="py-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search incidents..."
                className="pl-10"
              />
            </div>

            <Select
              value={timeRange}
              onValueChange={(v) => {
                if (isTimeRange(v)) setTimeRange(v);
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => exportIncidentsCsv(filteredIncidents, `incidents-${timeRange}.csv`)}
              disabled={filteredIncidents.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="Status"
              value={statusFilter}
              options={[
                { value: "all", label: "All" },
                ...STATUS_LABELS.map((label, i) => ({ value: i, label })),
              ]}
              onChange={(v) => setStatusFilter(v as any)}
            />
            <FilterPill
              label="Severity"
              value={severityFilter}
              options={[
                { value: "all", label: "All" },
                ...SEVERITY_LABELS.slice(1).map((label, i) => ({ value: i + 1, label })),
              ]}
              onChange={(v) => setSeverityFilter(v as any)}
            />
            <FilterPill
              label="Type"
              value={typeFilter}
              options={[
                { value: "all", label: "All" },
                ...Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => ({
                  value: Number(value),
                  label,
                })),
              ]}
              onChange={(v) => setTypeFilter(v as any)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Incident Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIncidents)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(STATUS_COLORS)[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Severity Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${(entry as any).name}: ${(entry as any).value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {severityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(SEVERITY_COLORS)[3 - index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Incident Types
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {resolutionBySeverity.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Avg Resolution Time by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resolutionBySeverity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  formatter={(value: unknown) => formatDuration(Number(value))}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Recent Incidents ({filteredIncidents.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredIncidents.slice(0, 10).map((incident, idx) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  index={idx}
                  onClick={() => setSelectedIncident(incident)}
                />
              ))}
            </AnimatePresence>

            {filteredIncidents.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No incidents found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <IncidentDetailsModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onRefresh={loadIncidents}
      />

      <CreateIncidentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setIncidents((prev) => [created, ...prev]);
          setSelectedIncident(created);
        }}
      />
    </motion.div>
  );
}

// ==================== SUB COMPONENTS ====================

function KpiCard({
  title,
  value,
  icon,
  trend,
  color = "primary",
  isTime = false,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  color?: "primary" | "blue" | "green" | "orange" | "red";
  isTime?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    primary: "text-primary",
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
    red: "text-red-400",
  };

  return (
    <Card className="glass">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
            {trend !== undefined && !isTime && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  trend > 0 ? "text-red-400" : trend < 0 ? "text-green-400" : "text-muted-foreground"
                }`}
              >
                {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          <div className={colorClasses[color]}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: any;
  options: { value: any; label: string }[];
  onChange: (value: any) => void;
}) {
  const stringValue = value === "all" ? "all" : String(value);

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="rounded-full">
        <Filter className="w-3 h-3 mr-1" />
        {label}
      </Badge>

      <Select
        value={stringValue}
        onValueChange={(v) => {
          if (v === "all") return onChange("all");
          const asNum = Number(v);
          onChange(Number.isFinite(asNum) ? asNum : v);
        }}
      >
        <SelectTrigger className="h-8 w-full sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem
              key={`${label}-${String(o.value)}`}
              value={o.value === "all" ? "all" : String(o.value)}
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function IncidentCard({
  incident,
  index,
  onClick,
}: {
  incident: IncidentResponse;
  index: number;
  onClick: () => void;
}) {
  const sev = severityMeta(Number(incident.severity));
  const st = statusMeta(Number(incident.status));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className="rounded-2xl border border-border/60 bg-card/40 hover:bg-card/60 transition cursor-pointer p-4"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border"
              style={chipStyle(sev.color)}
              title={sev.label}
            >
              {sev.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-semibold truncate">{incident.title}</div>
                <Badge variant="secondary" className="rounded-full">
                  #{incident.id}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(incident.timestamp)}
              </div>
            </div>
          </div>

          {incident.description && (
            <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {incident.description}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="rounded-full" style={chipStyle(st.color)}>
              <span className="inline-flex items-center gap-1">
                {st.icon}
                {st.label}
              </span>
            </Badge>

            <Badge className="rounded-full" style={chipStyle(sev.color)}>
              {sev.label}
            </Badge>

            <Badge variant="outline" className="rounded-full">
              {incidentTypeLabel(incident.type)}
            </Badge>

            {incident.location && (
              <Badge variant="outline" className="rounded-full">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {formatLocation(incident.location)}
                </span>
              </Badge>
            )}
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <div className="text-xs text-muted-foreground">Created</div>
          <div className="text-sm font-medium">{formatLocalDateTime(incident.timestamp)}</div>
          {incident.resolvedAt && (
            <div className="text-xs text-muted-foreground mt-1">
              Resolved: {formatLocalDateTime(incident.resolvedAt)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function IncidentDetailsModal({
  incident,
  onClose,
  onRefresh,
}: {
  incident: IncidentResponse | null;
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [alertDetails, setAlertDetails] = useState<SecurityAlert | null>(null);

  const sev = incident ? severityMeta(Number(incident.severity)) : null;
  const st = incident ? statusMeta(Number(incident.status)) : null;

  useEffect(() => {
    if (!incident) return;
    setUserId(""); // reset per open
    setAlertDetails(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [incident, onClose]);

  useEffect(() => {
    if (!incident) return;
    let active = true;
    void securityAlertApi
      .getByIncidentId(incident.id)
      .then((result) => {
        if (active) setAlertDetails(result);
      })
      .catch(() => {
        if (active) setAlertDetails(null);
      });

    return () => {
      active = false;
    };
  }, [incident]);

  const run = async (fn: () => Promise<void>, successMsg: string) => {
    setActionLoading(true);
    try {
      await fn();
      toast.success(successMsg);
      await onRefresh();
      onClose();
    } catch (e: any) {
      toast.error("Action failed", { description: e?.message ?? "Error" });
    } finally {
      setActionLoading(false);
    }
  };

  const exportOne = () => {
    if (!incident) return;
    exportIncidentsCsv([incident], `incident-${incident.id}.csv`);
  };

  const mustHaveUserId = (): string | null => {
    const v = userId.trim();
    // backend route uses {userId:guid}, so at least validate non-empty
    if (!v) return null;
    return v;
  };

  return (
    <AnimatePresence>
      {incident && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="relative w-[min(980px,92vw)] max-h-[88vh] overflow-auto rounded-2xl border border-border bg-background shadow-xl"
          >
            <div className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold truncate">{incident.title}</h2>
                  <Badge variant="secondary" className="rounded-full">
                    #{incident.id}
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {st && (
                    <Badge className="rounded-full" style={chipStyle(st.color)}>
                      <span className="inline-flex items-center gap-1">
                        {st.icon}
                        {st.label}
                      </span>
                    </Badge>
                  )}
                  {sev && (
                    <Badge className="rounded-full" style={chipStyle(sev.color)}>
                      <span className="inline-flex items-center gap-1">
                        {sev.icon}
                        {sev.label}
                      </span>
                    </Badge>
                  )}
                  <Badge variant="outline" className="rounded-full">
                    {incidentTypeLabel(incident.type)}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {INCIDENT_SOURCE_LABELS[incident.source] ?? "Unknown"}
                  </Badge>
                </div>

                <div className="mt-3 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created: {formatLocalDateTime(incident.timestamp)}
                  </span>

                  {incident.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {formatLocation(incident.location)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" onClick={exportOne}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {incident.description ? (
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {incident.description}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-sm text-muted-foreground italic">No description provided.</div>
              )}

              {alertDetails && (
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Alert Evidence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
                      <div className="space-y-3">
                        <div className="aspect-[4/5] overflow-hidden rounded-2xl border bg-muted/20">
                          {alertDetails.person?.profilePhotoUrl ? (
                            <img
                              src={alertDetails.person.profilePhotoUrl}
                              alt={alertDetails.person.displayName || "Profile"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              No profile photo
                            </div>
                          )}
                        </div>
                        <div className="rounded-xl border p-3 text-sm">
                          <div className="text-muted-foreground">Identity</div>
                          <div className="mt-1 font-semibold">
                            {alertDetails.person?.displayName || "Unknown person"}
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            {alertDetails.person?.watchlistReason || alertDetails.reason || "No policy note"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <Row label="Alert Category" value={alertDetails.alertCategory} />
                          <Row label="Runtime" value={alertDetails.sourceRuntime ?? "Unknown"} />
                          <Row label="Zone" value={alertDetails.zoneName ?? alertDetails.zoneId ?? "Unassigned"} />
                          <Row label="Camera" value={alertDetails.cameraName ?? alertDetails.streamKey ?? "Unknown"} />
                          <Row
                            label="Confidence"
                            value={
                              alertDetails.confidence != null
                                ? `${(alertDetails.confidence * 100).toFixed(1)}%`
                                : "N/A"
                            }
                          />
                          <Row
                            label="Similarity"
                            value={
                              alertDetails.similarity != null
                                ? `${(alertDetails.similarity * 100).toFixed(1)}%`
                                : "N/A"
                            }
                          />
                        </div>

                        <div className="rounded-xl border p-3 text-sm">
                          <div className="text-muted-foreground">Operational reason</div>
                          <div className="mt-1 font-medium">
                            {alertDetails.reason || alertDetails.description || "No reason provided"}
                          </div>
                        </div>

                        <div className="rounded-xl border p-3 text-sm">
                          <div className="mb-3 text-muted-foreground">Surveillance snapshot</div>
                          <div className="aspect-video overflow-hidden rounded-2xl border bg-muted/20">
                            {alertDetails.snapshot?.url ? (
                              <img
                                src={alertDetails.snapshot.url}
                                alt={`Snapshot for incident ${incident.id}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-muted-foreground">
                                Snapshot evidence will appear here when available.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="glass">
                  <CardContent className="py-4 space-y-2 text-sm">
                    <Row label="Operator Id" value={incident.operatorId ?? "—"} />
                    <Row label="Assigned To User" value={incident.assignedToUserId ?? "—"} />
                    <Row label="Assigned At" value={incident.assignedAt ? formatLocalDateTime(incident.assignedAt) : "—"} />
                    <Row label="Started At" value={incident.startedAt ? formatLocalDateTime(incident.startedAt) : "—"} />
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardContent className="py-4 space-y-2 text-sm">
                    <Row label="Resolved At" value={incident.resolvedAt ? formatLocalDateTime(incident.resolvedAt) : "—"} />
                    <Row label="Closed At" value={incident.closedAt ? formatLocalDateTime(incident.closedAt) : "—"} />
                    <Row label="Status" value={STATUS_LABELS[incident.status] ?? incident.status} />
                    <Row label="Severity" value={SEVERITY_LABELS[incident.severity] ?? incident.severity} />
                  </CardContent>
                </Card>
              </div>

              <Card className="glass">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        UserId (GUID) required for Assign / Start / Resolve
                      </div>
                      <Input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="e.g. 2f1c3d2e-...."
                      />
                    </div>

                    <div className="flex items-end justify-end gap-2">
                      <Button
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => run(onRefresh as any, "Refreshed")}
                      >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${actionLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>

                      <Button
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() =>
                          run(
                            async () => {
                              await apiClient.post(`/Incident/${incident.id}/close`);
                            },
                            "Incident closed"
                          )
                        }
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Close
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => {
                        const uid = mustHaveUserId();
                        if (!uid) return toast.error("UserId is required");
                        return run(
                          async () => {
                            await apiClient.post(`/Incident/${incident.id}/assign/${uid}`);
                          },
                          "Incident assigned"
                        );
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Assign
                    </Button>

                    <Button
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => {
                        const uid = mustHaveUserId();
                        if (!uid) return toast.error("UserId is required");
                        return run(
                          async () => {
                            await apiClient.post(`/Incident/${incident.id}/start/${uid}`);
                          },
                          "Work started"
                        );
                      }}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Start Work
                    </Button>

                    <Button
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => {
                        const uid = mustHaveUserId();
                        if (!uid) return toast.error("UserId is required");
                        return run(
                          async () => {
                            await apiClient.post(`/Incident/${incident.id}/resolve/${uid}`);
                          },
                          "Incident resolved"
                        );
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium truncate">{String(value ?? "—")}</span>
    </div>
  );
}

function CreateIncidentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (incident: IncidentResponse) => void;
}) {
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [type, setType] = useState<IncidentType>(99 as IncidentType);
  const [severity, setSeverity] = useState<IncidentSeverity>(2 as IncidentSeverity);
  const [source, setSource] = useState<IncidentSource>(1 as IncidentSource);

  const [operatorId, setOperatorId] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setType(99 as IncidentType);
    setSeverity(2 as IncidentSeverity);
    setSource(1 as IncidentSource);
    setOperatorId("");
    setAddress("");
  }, [open]);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const parsedOperatorId = operatorId.trim() === "" ? undefined : Number(operatorId);
      const location: Location | undefined =
        address.trim() ? ({ latitude: null, longitude: null, address: address.trim() } as any) : undefined;

      // Your backend expects request.Type + request.Severity + request.Source etc.
      const payload: CreateIncidentRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        severity,
        source,
        operatorId: Number.isFinite(parsedOperatorId as number) ? (parsedOperatorId as number) : undefined,
        location,
        payloadJson: undefined,
      } as any;

      const createdRaw = await apiClient.post<unknown>("/Incident", payload);
      const created = normalizeIncident(createdRaw);

      toast.success("Incident created");
      onCreated(created);
      onClose();
    } catch (e: any) {
      toast.error("Failed to create incident", { description: e?.message ?? "Error" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="relative w-[min(760px,92vw)] rounded-2xl border border-border bg-background shadow-xl"
        >
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <div className="font-bold text-lg">Create Incident</div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Title</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short incident title..." />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened?"
                className="w-full min-h-[110px] rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Type</div>
                <Select value={String(type)} onValueChange={(v) => setType(Number(v) as IncidentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INCIDENT_TYPE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Severity</div>
                <Select value={String(severity)} onValueChange={(v) => setSeverity(Number(v) as IncidentSeverity)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                    <SelectItem value="4">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Source</div>
                <Select value={String(source)} onValueChange={(v) => setSource(Number(v) as IncidentSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INCIDENT_SOURCE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Operator Id (optional)</div>
                <Input
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder="e.g. 1"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Address (optional)</div>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address / Zone..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
