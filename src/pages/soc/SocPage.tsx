import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Activity, Camera, AlertTriangle, User, Eye, X,
  Clock, Radio, TrendingUp,
  Package, MapPin, AlertOctagon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SecurityBadge } from "@/components/ui/security-badge";
import { LiveBadge } from "@/components/ui/live-badge";
import { cn } from "@/lib/utils";

import signalRService from "@/lib/signalr-service";
import { cameraApi } from "@/lib/api/cameraApi";
import { useSecurityStore } from "@/store/securityStore";

import type { FaceRecognizedPayload, CameraDTO } from "@/types";
import type { CameraRuntimeStatus } from "@/types/runtime";

// ── Types ─────────────────────────────────────────────────────────────────────
type EventKind = "face" | "behavior" | "watchlist" | "zone" | "object" | "anomaly";
type Severity  = "critical" | "high" | "medium" | "low" | "info";

interface LiveEvent {
  id: string;
  kind: EventKind;
  severity: Severity;
  title: string;
  description: string;
  cameraId?: string;
  tsUtc: string;
  icon: React.ElementType;
}

interface CameraStatus {
  cam: CameraDTO;
  online: boolean;
  fps: number;
  runtime?: CameraRuntimeStatus;
  unknownRecent: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function nowIso() { return new Date().toISOString(); }
function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
  catch { return "--"; }
}
function secondsAgo(iso?: string) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : (Date.now() - t) / 1000;
}

const kindColor: Record<EventKind, string> = {
  face:      "text-blue-400   bg-blue-500/15",
  behavior:  "text-amber-400  bg-amber-500/15",
  watchlist: "text-red-400    bg-red-500/15",
  zone:      "text-cyan-400   bg-cyan-500/15",
  object:    "text-sky-400    bg-sky-500/15",
  anomaly:   "text-purple-400 bg-purple-500/15",
};

const severityBorder: Record<Severity, string> = {
  critical: "border-l-red-500",
  high:     "border-l-orange-500",
  medium:   "border-l-yellow-500",
  low:      "border-l-emerald-500",
  info:     "border-l-cyan-500",
};

const severityVariant: Record<Severity, "critical" | "high" | "medium" | "low" | "info"> = {
  critical: "critical",
  high:     "high",
  medium:   "medium",
  low:      "low",
  info:     "info",
};

// ── SocPage ──────────────────────────────────────────────────────────────────
export function SocPage() {
  const nav    = useNavigate();
  const storm  = useSecurityStore(s => s.storm);
  const clearStorm = useSecurityStore(s => s.clearStorm);

  const [events,   setEvents]   = useState<LiveEvent[]>([]);
  const [cameras,  setCameras]  = useState<CameraStatus[]>([]);
  const [selected, setSelected] = useState<LiveEvent | null>(null);
  const [filterKind, setFilterKind] = useState<EventKind | "all">("all");

  const feedRef   = useRef<HTMLDivElement>(null);
  const pollerRef = useRef<number | null>(null);

  // ── Push event ──────────────────────────────────────────────────────────
  const pushEvent = useCallback((evt: LiveEvent) => {
    setEvents(prev => {
      const next = [evt, ...prev].slice(0, 200);
      return next;
    });
  }, []);

  // ── Load cameras ─────────────────────────────────────────────────────────
  useEffect(() => {
    cameraApi.list().then(cams => {
      setCameras(cams.map(cam => ({ cam, online: false, fps: 0, runtime: undefined, unknownRecent: false })));
    }).catch(() => {});

    // Runtime poll
    pollerRef.current = window.setInterval(async () => {
      try {
        const all = await cameraApi.runtimeAll();
        setCameras(prev => {
          const map = new Map<number, CameraRuntimeStatus>();
          for (const r of all) map.set((r as any).cameraId ?? (r as any).CameraId ?? r.CameraId, r);
          return prev.map(cs => {
            const runtime = map.get(cs.cam.id);
            const secs    = secondsAgo(runtime?.LastFrameUtc ?? (runtime as any)?.LastFrameUtc);
            const online  = Boolean((runtime as any)?.isRunning ?? (runtime as any)?.IsRunning ?? runtime?.IsRunning) && secs < 10;
            return { ...cs, runtime, online, fps: runtime?.Fps ?? cs.fps };
          });
        });
      } catch { /* silent */ }
    }, 3000);

    return () => { if (pollerRef.current) window.clearInterval(pollerRef.current); };
  }, []);

  // ── SignalR listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const onFace = (envelope: any) => {
      const d: FaceRecognizedPayload = envelope.Data;
      const isUnknown = !d.UserId;
      pushEvent({
        id:          `face-${d.FrameId ?? Date.now()}-${d.TrackingId ?? Math.random()}`,
        kind:        "face",
        severity:    isUnknown ? "high" : "low",
        title:       isUnknown ? "Unknown Person" : (d.DisplayName ?? "Known Person"),
        description: `Conf ${(d.Confidence * 100).toFixed(1)}% · Sim ${(d.Similarity * 100).toFixed(1)}% · Cam ${d.CameraId}`,
        cameraId:    String(d.CameraId),
        tsUtc:       d.TsUtc ?? nowIso(),
        icon:        User,
      });
      setCameras(prev => prev.map(cs =>
        String(cs.cam.id) === String(d.CameraId) ? { ...cs, unknownRecent: isUnknown } : cs
      ));
    };

    const onBehavior = (envelope: any) => {
      const p = envelope.Data;
      pushEvent({
        id:          `behavior-${p.FrameId ?? Date.now()}-${Math.random()}`,
        kind:        "behavior",
        severity:    p.AlertLevel?.toLowerCase() === "critical" ? "critical" : "medium",
        title:       p.ActionType ?? "Behavior Alert",
        description: `Conf ${(p.Confidence * 100).toFixed(1)}% · Track ${p.TrackId}`,
        cameraId:    String(p.CameraId),
        tsUtc:       p.TsUtc ?? nowIso(),
        icon:        Activity,
      });
    };

    const onWatchlist = (envelope: any) => {
      const p = envelope.Data;
      pushEvent({
        id:          `watchlist-${p.IncidentId ?? Date.now()}-${Math.random()}`,
        kind:        "watchlist",
        severity:    "critical",
        title:       `Watchlist Hit — ${p.FullName ?? p.UserName ?? "Unknown"}`,
        description: `Conf ${(p.Confidence * 100).toFixed(1)}% · ${p.WatchlistReason ?? "No reason"}`,
        cameraId:    String(p.CameraId),
        tsUtc:       p.TsUtc ?? nowIso(),
        icon:        ShieldAlert,
      });
    };

    const onZone = (envelope: any) => {
      const p = envelope.Data;
      pushEvent({
        id:          `zone-${p.ZoneId ?? Date.now()}-${Math.random()}`,
        kind:        "zone",
        severity:    p.UnauthorizedAccess ? "high" : "info",
        title:       `Zone ${p.Status ?? "Event"} — ${p.ZoneName ?? p.ZoneId}`,
        description: `Objects: ${p.ObjectCount} · Unauthorized: ${p.UnauthorizedAccess ? "Yes" : "No"}`,
        cameraId:    String(p.CameraId),
        tsUtc:       p.TsUtc ?? nowIso(),
        icon:        MapPin,
      });
    };

    const onAnomaly = (envelope: any) => {
      const p = envelope.Data;
      pushEvent({
        id:          `anomaly-${p.FrameId ?? Date.now()}-${Math.random()}`,
        kind:        "anomaly",
        severity:    "high",
        title:       `Anomaly — ${p.AnomalyType ?? "Unknown"}`,
        description: `Conf ${(p.Confidence * 100).toFixed(1)}%${p.Description ? ` · ${p.Description}` : ""}`,
        cameraId:    String(p.CameraId),
        tsUtc:       p.TsUtc ?? nowIso(),
        icon:        AlertOctagon,
      });
    };

    const onStatus = (envelope: any) => {
      const s = envelope.Data as { CameraId: string; IsOnline: boolean; Fps?: number };
      setCameras(prev => prev.map(cs =>
        String(cs.cam.id) === String(s.CameraId) ? { ...cs, online: s.IsOnline, fps: s.Fps ?? cs.fps } : cs
      ));
    };

    signalRService.on("ReceiveFaceRecognized"  as any, onFace);
    signalRService.on("ReceiveBehaviorAlert"   as any, onBehavior);
    signalRService.on("ReceiveWatchlistHit"    as any, onWatchlist);
    signalRService.on("ReceiveZoneEvent"       as any, onZone);
    signalRService.on("ReceiveAnomalyEvent"    as any, onAnomaly);
    signalRService.on("ReceiveCameraStatus"    as any, onStatus);

    return () => {
      signalRService.off("ReceiveFaceRecognized"  as any, onFace);
      signalRService.off("ReceiveBehaviorAlert"   as any, onBehavior);
      signalRService.off("ReceiveWatchlistHit"    as any, onWatchlist);
      signalRService.off("ReceiveZoneEvent"       as any, onZone);
      signalRService.off("ReceiveAnomalyEvent"    as any, onAnomaly);
      signalRService.off("ReceiveCameraStatus"    as any, onStatus);
    };
  }, [pushEvent]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    filterKind === "all" ? events : events.filter(e => e.kind === filterKind),
    [events, filterKind]
  );

  const counts = useMemo(() => {
    const c: Partial<Record<EventKind, number>> = {};
    for (const e of events) c[e.kind] = (c[e.kind] ?? 0) + 1;
    return c;
  }, [events]);

  const kpis = useMemo(() => ({
    total:    events.length,
    critical: events.filter(e => e.severity === "critical" || e.severity === "high").length,
    online:   cameras.filter(c => c.online).length,
    total_cam:cameras.length,
    unknown:  cameras.filter(c => c.unknownRecent).length,
  }), [events, cameras]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-5 h-full"
    >
      {/* Header */}
      <div className="glass-panel rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 rounded-xl bg-red-500/15"><ShieldAlert className="w-5 h-5 text-red-400" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security Operations</h1>
            <p className="text-sm text-muted-foreground">Real-time threat detection and camera fleet monitoring.</p>
          </div>
          <LiveBadge label="LIVE" color="green" />
          {storm && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold animate-threat-pulse"
            >
              <ShieldAlert className="w-3 h-3" />
              STORM MODE
              <button onClick={clearStorm} className="ml-1 hover:text-red-300"><X className="w-3 h-3" /></button>
            </motion.div>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono">{new Date().toLocaleString()}</div>
      </div>

      {/* KPI ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Events",   value: kpis.total,     icon: Radio,        bg: "bg-surface-2",        color: "text-foreground"   },
          { label: "Alerts",   value: kpis.critical,  icon: AlertTriangle, bg: kpis.critical > 0 ? "bg-red-500/10" : "bg-surface-2", color: kpis.critical > 0 ? "text-red-400" : "text-muted-foreground" },
          { label: "Cameras",  value: `${kpis.online}/${kpis.total_cam}`, icon: Camera, bg: "bg-surface-2", color: "text-foreground" },
          { label: "Unknown",  value: kpis.unknown,   icon: User,         bg: kpis.unknown > 0 ? "bg-red-500/10" : "bg-surface-2", color: kpis.unknown > 0 ? "text-red-400" : "text-muted-foreground" },
          { label: "Watchlist",value: counts.watchlist ?? 0, icon: ShieldAlert, bg: (counts.watchlist ?? 0) > 0 ? "bg-red-500/10" : "bg-surface-2", color: (counts.watchlist ?? 0) > 0 ? "text-red-400" : "text-muted-foreground" },
        ].map(k => (
          <div key={k.label} className={cn("glass-card rounded-xl px-4 py-3 flex items-center gap-3", k.bg)}>
            <k.icon className={cn("w-5 h-5 shrink-0", k.color)} />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</div>
              <div className={cn("text-2xl font-bold tabular font-mono leading-tight", k.color)}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: event feed (left) + camera fleet (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

        {/* Event feed */}
        <Card className="glass-card flex flex-col">
          <CardHeader className="pb-0 pt-4 px-5 border-b border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-sm">Live Event Feed</div>
                <div className="text-xs text-muted-foreground">{events.length} events captured</div>
              </div>
              {filterKind !== "all" && (
                <button onClick={() => setFilterKind("all")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  <X className="w-3 h-3" />
                  Clear filter
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap pb-3">
              {([
                { key: "all" as const,       label: "All",       icon: Activity   },
                { key: "face" as const,      label: "Face",      icon: User       },
                { key: "behavior" as const,  label: "Behavior",  icon: Activity   },
                { key: "watchlist" as const, label: "Watchlist", icon: ShieldAlert },
                { key: "zone" as const,      label: "Zone",      icon: MapPin     },
                { key: "object" as const,    label: "Object",    icon: Package    },
                { key: "anomaly" as const,   label: "Anomaly",   icon: AlertOctagon },
              ]).map(f => {
                const count = f.key === "all" ? events.length : (counts[f.key] ?? 0);
                const active = filterKind === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilterKind(f.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                      active ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground bg-surface-2 border border-border/50"
                    )}
                  >
                    <f.icon className="w-3 h-3" />
                    {f.label}
                    {count > 0 && (
                      <span className={cn("rounded-full px-1.5 text-[10px] font-bold", active ? "bg-primary/30 text-primary" : "bg-muted/50 text-muted-foreground")}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="pt-3 px-5 pb-5 flex-1">
            <div
              ref={feedRef}
              className="space-y-1.5 max-h-[560px] overflow-y-auto scrollbar-thin pr-1"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/40 rounded-xl text-muted-foreground">
                    <Radio className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">Monitoring… no events yet</p>
                  </div>
                ) : (
                  filtered.map(e => (
                    <motion.div
                      key={e.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => setSelected(selected?.id === e.id ? null : e)}
                      className={cn(
                        "flex gap-3 rounded-xl border-l-[3px] pl-3 pr-4 py-2.5 border border-border/40 cursor-pointer transition-colors",
                        severityBorder[e.severity],
                        selected?.id === e.id ? "bg-surface-3" : "bg-surface-1 hover:bg-surface-2"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-lg h-fit mt-0.5 shrink-0", kindColor[e.kind])}>
                        <e.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-sm truncate">{e.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <SecurityBadge variant={severityVariant[e.severity]}>{e.severity}</SecurityBadge>
                            <span className="text-[10px] text-muted-foreground tabular font-mono">{fmtTime(e.tsUtc)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{e.description}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Right panel: context + camera fleet */}
        <div className="flex flex-col gap-4">

          {/* Selected event context */}
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Event Detail</div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className={cn("flex items-center gap-2 mb-3 p-2.5 rounded-xl border-l-[3px]", severityBorder[selected.severity], "bg-surface-2 border border-border/40")}>
                  <div className={cn("p-1.5 rounded-lg shrink-0", kindColor[selected.kind])}>
                    <selected.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{selected.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{selected.description}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono">{fmtTime(selected.tsUtc)}</span>
                  </div>
                  {selected.cameraId && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span>Camera {selected.cameraId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <SecurityBadge variant={severityVariant[selected.severity]}>{selected.severity}</SecurityBadge>
                    <SecurityBadge variant="neutral">{selected.kind}</SecurityBadge>
                  </div>
                </div>

                {selected.cameraId && (
                  <button
                    onClick={() => nav(`/app/cameras/${selected.cameraId}`)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/15"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Open Camera View
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty-ctx"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center py-8 border-dashed"
              >
                <Eye className="w-6 h-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Click an event to view details</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera fleet grid */}
          <Card className="glass-card flex-1">
            <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
              <div className="font-semibold text-sm">Camera Fleet</div>
              <div className="text-xs text-muted-foreground">{kpis.online}/{kpis.total_cam} online</div>
            </CardHeader>
            <CardContent className="pt-3 px-5 pb-5">
              <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                <AnimatePresence>
                  {cameras.map((cs, i) => {
                    const fps = Math.round(cs.fps ?? 0);
                    const hasUnknown = cs.unknownRecent;
                    return (
                      <motion.button
                        key={cs.cam.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => nav(`/app/cameras/${cs.cam.id}`)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:bg-surface-3 group",
                          hasUnknown ? "bg-red-500/10 border-red-500/25" : "bg-surface-2 border-border/40 hover:border-border"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", cs.online ? "bg-emerald-400 animate-pulse" : "bg-red-400")}>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-xs truncate">{cs.cam.name}</span>
                            {hasUnknown && <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">{fps} fps · {cs.online ? "Online" : "Offline"}</div>
                        </div>
                        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
                {cameras.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">No cameras configured.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Severity breakdown */}
          <Card className="glass-card">
            <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
              <div className="font-semibold text-sm">Event Severity</div>
            </CardHeader>
            <CardContent className="pt-3 px-5 pb-5 space-y-2">
              {([
                { key: "critical" as Severity, label: "Critical",  color: "bg-red-500"     },
                { key: "high"     as Severity, label: "High",      color: "bg-orange-500"  },
                { key: "medium"   as Severity, label: "Medium",    color: "bg-yellow-500"  },
                { key: "low"      as Severity, label: "Low",       color: "bg-emerald-500" },
                { key: "info"     as Severity, label: "Info",      color: "bg-cyan-500"    },
              ]).map(s => {
                const count = events.filter(e => e.severity === s.key).length;
                const pct   = events.length > 0 ? (count / events.length) * 100 : 0;
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0 uppercase tracking-wide">{s.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", s.color)}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
