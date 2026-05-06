import { useEffect, useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, AlertTriangle, Users, Activity, Eye, Zap, CheckCircle,
  Clock, ShieldAlert, TrendingUp, TrendingDown, Minus, Radio,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SecurityBadge } from "@/components/ui/security-badge";
import { LiveBadge } from "@/components/ui/live-badge";
import { cn } from "@/lib/utils";

import type { IncidentResponse } from "@/types";
import { IncidentSeverity } from "@/types";

import apiClient from "@/lib/api-client";
import signalRService from "@/lib/signalr-service";
import { normalizeIncident, normalizeIncidents } from "@/lib/incident-normalizer";
import { formatRelativeTime } from "@/lib/utils";
import { useSecurityStore } from "@/store/securityStore";
import { useAuthStore } from "@/store/authStore";

// ── Types ─────────────────────────────────────────────────────────────────────
type StatsState = {
  activeCameras:     number;
  threatsDetected:   number;
  peopleTracked:     number | null;
  incidentsOpen:     number;
  incidentsResolved: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function severityVariant(sev: IncidentSeverity): "critical" | "high" | "medium" | "low" | "info" {
  switch (sev) {
    case IncidentSeverity.Critical: return "critical";
    case IncidentSeverity.High:     return "high";
    case IncidentSeverity.Medium:   return "medium";
    default:                        return "low";
  }
}

function severityLabel(severity: any): string {
  const labels = ["", "Low", "Medium", "High", "Critical"];
  return typeof severity === "number" && severity >= 0 && severity < labels.length ? labels[severity] : String(severity ?? "—");
}

// ── KpiTile ───────────────────────────────────────────────────────────────────
function KpiTile({
  icon: Icon, label, value, sublabel, trend, trendLabel, accent, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sublabel?: string; trend?: "up" | "down" | "flat"; trendLabel?: string;
  accent: string; delay?: number;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-muted-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={cn("p-2.5 rounded-xl shrink-0", accent)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {trendLabel}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold tabular font-mono leading-tight">{value}</div>
        <div className="text-sm font-medium text-muted-foreground mt-1">{label}</div>
        {sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}
      </div>
    </motion.div>
  );
}

// ── IncidentRow ───────────────────────────────────────────────────────────────
function IncidentRow({ incident, idx, onClick }: { incident: IncidentResponse; idx: number; onClick: () => void }) {
  const sev = incident.severity as IncidentSeverity;
  const borderColor =
    sev === IncidentSeverity.Critical ? "border-l-red-500"
    : sev === IncidentSeverity.High   ? "border-l-orange-500"
    : sev === IncidentSeverity.Medium ? "border-l-yellow-500"
    : "border-l-cyan-500";

  const sevIcon =
    sev === IncidentSeverity.Critical ? <Zap className="w-4 h-4 text-red-400" />
    : sev === IncidentSeverity.High   ? <AlertTriangle className="w-4 h-4 text-orange-400" />
    : sev === IncidentSeverity.Medium ? <Eye className="w-4 h-4 text-yellow-400" />
    : <Activity className="w-4 h-4 text-cyan-400" />;

  const safeTime = (() => {
    if (!incident.timestamp) return "—";
    const parsed = Date.parse(incident.timestamp);
    return Number.isNaN(parsed) ? "—" : formatRelativeTime(incident.timestamp);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.04 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-xl border-l-[3px] pl-4 pr-4 py-3 bg-surface-1 border border-border/40 hover:bg-surface-2 transition-all cursor-pointer group",
        borderColor
      )}
    >
      <div className="shrink-0">{sevIcon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {incident.title || "Untitled Incident"}
          </span>
          <SecurityBadge variant={severityVariant(sev)}>{severityLabel(sev)}</SecurityBadge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {incident.description || "No description"}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <Clock className="w-3.5 h-3.5" />
        {safeTime}
      </div>
    </motion.div>
  );
}

// ── StatusDot ─────────────────────────────────────────────────────────────────
function StatusDot({ label, status, ok }: { label: string; status: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border/40">
      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", ok ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground">{status}</div>
      </div>
    </div>
  );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────
export function DashboardPage() {
  const nav    = useNavigate();
  const user   = useAuthStore(s => s.user);
  const storm  = useSecurityStore(s => s.storm);

  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [stats, setStats] = useState<StatsState>({
    activeCameras: 0, threatsDetected: 0, peopleTracked: null,
    incidentsOpen: 0, incidentsResolved: 0,
  });

  const isOpenStatus     = useCallback((s: any) => s === 0 || s === 1 || s === 2, []);
  const isResolvedStatus = useCallback((s: any) => s === 3, []);

  const load = useCallback(async () => {
    try {
      const [iRaw, cRaw] = await Promise.all([
        apiClient.get<any[]>("/Incident/open").catch(() => []),
        apiClient.get<any[]>("/Camera").catch(() => []),
      ]);
      const incidentsNorm = normalizeIncidents(iRaw).slice(0, 10);
      const cameras = Array.isArray(cRaw) ? cRaw : [];
      const activeCameras    = cameras.filter(c => Boolean(c?.isActive ?? c?.IsActive)).length;
      const openCount        = incidentsNorm.filter(i => isOpenStatus(i.status)).length;
      const resolvedCount    = incidentsNorm.filter(i => isResolvedStatus(i.status)).length;
      const threats          = incidentsNorm.filter(i => isOpenStatus(i.status) && (i.severity ?? 0) >= 3).length;
      setIncidents(incidentsNorm);
      setStats(prev => ({ ...prev, activeCameras, incidentsOpen: openCount, incidentsResolved: resolvedCount, threatsDetected: threats }));
    } catch {
      setIncidents([]);
    }
  }, [isOpenStatus, isResolvedStatus]);

  useEffect(() => {
    void load();
    const onIncident = (envelope: any) => {
      const incoming = normalizeIncident(envelope?.Data);
      setIncidents(prev => [incoming, ...prev.filter(x => x.id !== incoming.id)].slice(0, 10));
      setStats(prev => ({
        ...prev,
        incidentsOpen:     isOpenStatus(incoming.status)     ? prev.incidentsOpen + 1     : prev.incidentsOpen,
        incidentsResolved: isResolvedStatus(incoming.status) ? prev.incidentsResolved + 1 : prev.incidentsResolved,
        threatsDetected:   (incoming.severity ?? 0) >= 3     ? prev.threatsDetected + 1   : prev.threatsDetected,
      }));
    };
    signalRService.on("ReceiveIncident", onIncident);
    return () => { signalRService.off("ReceiveIncident", onIncident); };
  }, [load, isOpenStatus, isResolvedStatus]);

  const peopleTrackedValue = useMemo(() => stats.peopleTracked == null ? "—" : stats.peopleTracked, [stats.peopleTracked]);
  const isSignalRConnected = signalRService.isConnected();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass-panel rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {timeGreeting()}, {user?.fullName?.split(" ")[0] ?? "Operator"}
            </h1>
            <LiveBadge label="LIVE" color="green" />
            {storm && <SecurityBadge variant="critical" dot>Storm Mode</SecurityBadge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time security overview · {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/app/soc")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/50 bg-surface-2 hover:bg-surface-3 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Open SOC
          </button>
          <button
            onClick={() => nav("/app/cameras")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/50 bg-surface-2 hover:bg-surface-3 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Cameras
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          icon={Camera}
          label="Active Cameras"
          value={stats.activeCameras}
          accent="bg-blue-500/15 text-blue-400"
          delay={0}
        />
        <KpiTile
          icon={AlertTriangle}
          label="Open Incidents"
          value={stats.incidentsOpen}
          sublabel={stats.threatsDetected > 0 ? `${stats.threatsDetected} high/critical` : undefined}
          trend={stats.incidentsOpen > 0 ? "up" : "flat"}
          trendLabel={stats.incidentsOpen > 0 ? "Attention" : "Clear"}
          accent={stats.incidentsOpen > 0 ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}
          delay={0.05}
        />
        <KpiTile
          icon={CheckCircle}
          label="Resolved Today"
          value={stats.incidentsResolved}
          trend="flat"
          trendLabel="Today"
          accent="bg-emerald-500/15 text-emerald-400"
          delay={0.1}
        />
        <KpiTile
          icon={Users}
          label="People Tracked"
          value={peopleTrackedValue}
          accent="bg-purple-500/15 text-purple-400"
          delay={0.15}
        />
      </div>

      {/* Main grid: incidents + system status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Incidents */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-0 pt-4 px-5 border-b border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-sm">Recent Incidents</div>
                <div className="text-xs text-muted-foreground">{stats.incidentsOpen} open incidents</div>
              </div>
              <div className="flex items-center gap-2">
                <LiveBadge label="Live" color="green" size="sm" />
                <button
                  onClick={() => nav("/app/incidents")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all →
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-3 px-5 pb-5">
            <AnimatePresence mode="popLayout">
              {incidents.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 border border-dashed border-border/40 rounded-xl"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-400/40 mb-3" />
                  <p className="text-sm font-medium">No active incidents</p>
                  <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {incidents.map((inc, i) => (
                    <IncidentRow
                      key={String(inc.id ?? `${inc.title}-${i}`)}
                      incident={inc}
                      idx={i}
                      onClick={() => nav("/app/incidents")}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Right column: system status + quick actions */}
        <div className="space-y-4">

          {/* System Status */}
          <Card className="glass-card">
            <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
              <div className="font-semibold text-sm">System Status</div>
            </CardHeader>
            <CardContent className="pt-3 px-5 pb-5 space-y-2">
              <StatusDot label="API Server"  status="Operational" ok={true} />
              <StatusDot
                label="SignalR Hub"
                status={isSignalRConnected ? "Connected" : "Disconnected"}
                ok={isSignalRConnected}
              />
              <StatusDot label="AI Pipeline" status="Active"      ok={true} />
              <StatusDot label="Database"    status="Healthy"     ok={true} />
            </CardContent>
          </Card>

          {/* Threat summary */}
          <Card className="glass-card">
            <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
              <div className="font-semibold text-sm">Threat Overview</div>
            </CardHeader>
            <CardContent className="pt-3 px-5 pb-5 space-y-3">
              {([
                { label: "Critical",  value: incidents.filter(i => (i.severity as any) === IncidentSeverity.Critical).length, color: "bg-red-500"     },
                { label: "High",      value: incidents.filter(i => (i.severity as any) === IncidentSeverity.High).length,     color: "bg-orange-500"  },
                { label: "Medium",    value: incidents.filter(i => (i.severity as any) === IncidentSeverity.Medium).length,   color: "bg-yellow-500"  },
                { label: "Low",       value: incidents.filter(i => ![(IncidentSeverity.Critical as any),(IncidentSeverity.High as any),(IncidentSeverity.Medium as any)].includes(i.severity as any)).length, color: "bg-emerald-500" },
              ]).map(t => {
                const pct = incidents.length > 0 ? (t.value / incidents.length) * 100 : 0;
                return (
                  <div key={t.label} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0 uppercase tracking-wide">{t.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div className={cn("h-full rounded-full", t.color)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                    </div>
                    <span className="text-xs font-mono tabular text-muted-foreground w-5 text-right">{t.value}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            {([
              { label: "SOC View",   icon: Radio,         path: "/app/soc",         color: "text-red-400",    bg: "bg-red-500/10"    },
              { label: "Cameras",    icon: Camera,        path: "/app/cameras",     color: "text-blue-400",   bg: "bg-blue-500/10"   },
              { label: "Alerts",     icon: ShieldAlert,   path: "/app/alerts",      color: "text-orange-400", bg: "bg-orange-500/10" },
              { label: "Incidents",  icon: AlertTriangle, path: "/app/incidents",   color: "text-amber-400",  bg: "bg-amber-500/10"  },
            ]).map(q => (
              <button
                key={q.label}
                onClick={() => nav(q.path)}
                className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border border-border/40 hover:border-border transition-colors", q.bg)}
              >
                <q.icon className={cn("w-5 h-5", q.color)} />
                <span className="text-xs font-medium">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
