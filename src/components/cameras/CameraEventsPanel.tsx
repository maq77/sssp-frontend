import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, Activity, MapPin, AlertOctagon, ShieldAlert, Download,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { CameraSecurityRealtimeEvent, FaceRecognizedPayload } from "@/types";
import { cn } from "@/lib/utils";

type FilterKind = "all" | "face" | "object" | "behavior" | "zone" | "anomaly" | "watchlist";

const FILTERS: { key: FilterKind; label: string; icon: React.ElementType }[] = [
  { key: "all",       label: "All",       icon: Activity   },
  { key: "face",      label: "Face",      icon: User       },
  { key: "behavior",  label: "Behavior",  icon: Activity   },
  { key: "watchlist", label: "Watchlist", icon: ShieldAlert },
  { key: "zone",      label: "Zone",      icon: MapPin     },
  { key: "object",    label: "Object",    icon: Package    },
  { key: "anomaly",   label: "Anomaly",   icon: AlertOctagon },
];

type UnifiedEvent = {
  id: string;
  kind: FilterKind;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  meta: string;
  tsUtc: string;
  extra?: string;
};

function buildFaceEvent(d: FaceRecognizedPayload, idx: number): UnifiedEvent {
  const isKnown = !!d.UserId;
  return {
    id: `face-${d.FrameId ?? idx}-${d.TrackingId ?? idx}`,
    kind: "face",
    severity: isKnown ? "low" : "high",
    title: isKnown ? (d.DisplayName ?? "Known Person") : "Unknown Person",
    description: `Conf ${(d.Confidence * 100).toFixed(1)}%  ·  Sim ${(d.Similarity * 100).toFixed(1)}%  ·  Track ${d.TrackingId ?? "—"}`,
    meta: d.TsUtc ? new Date(d.TsUtc).toLocaleTimeString() : "--",
    tsUtc: d.TsUtc,
  };
}

function buildSecurityEvent(e: CameraSecurityRealtimeEvent, idx: number): UnifiedEvent {
  switch (e.kind) {
    case "behavior": {
      const p = e.payload;
      const level = p.AlertLevel?.toLowerCase();
      return {
        id: `behavior-${p.FrameId}-${idx}`,
        kind: "behavior",
        severity: level === "critical" ? "critical" : level === "info" ? "info" : "medium",
        title: p.ActionType ?? "Behavior Alert",
        description: `Conf ${(p.Confidence * 100).toFixed(1)}%  ·  Track ${p.TrackId}${p.AlertMessage ? `  ·  ${p.AlertMessage}` : ""}`,
        meta: p.TsUtc ? new Date(p.TsUtc).toLocaleTimeString() : "--",
        tsUtc: p.TsUtc,
      };
    }
    case "watchlist": {
      const p = e.payload;
      return {
        id: `watchlist-${p.IncidentId ?? p.FrameId}-${idx}`,
        kind: "watchlist",
        severity: "critical",
        title: `Watchlist Hit — ${p.FullName ?? p.UserName ?? "Unknown"}`,
        description: `Conf ${(p.Confidence * 100).toFixed(1)}%  ·  Sim ${(p.Similarity * 100).toFixed(1)}%  ·  ${p.WatchlistReason ?? "No reason"}`,
        meta: p.TsUtc ? new Date(p.TsUtc).toLocaleTimeString() : "--",
        tsUtc: p.TsUtc,
        extra: p.IncidentId != null ? `Incident #${p.IncidentId}` : undefined,
      };
    }
    case "zone": {
      const p = e.payload;
      return {
        id: `zone-${p.ZoneId}-${idx}`,
        kind: "zone",
        severity: p.UnauthorizedAccess ? "high" : "info",
        title: `Zone ${p.Status ?? "Event"} — ${p.ZoneName ?? p.ZoneId}`,
        description: `Objects: ${p.ObjectCount}  ·  Unauthorized: ${p.UnauthorizedAccess ? "Yes" : "No"}`,
        meta: p.TsUtc ? new Date(p.TsUtc).toLocaleTimeString() : "--",
        tsUtc: p.TsUtc,
      };
    }
    case "object": {
      const p = e.payload;
      return {
        id: `object-${p.FrameId}-${p.TrackId}-${idx}`,
        kind: "object",
        severity: "info",
        title: `Object — ${p.ClassLabel ?? p.ClassId}`,
        description: `Conf ${(p.Confidence * 100).toFixed(1)}%  ·  Track ${p.TrackId}`,
        meta: p.TsUtc ? new Date(p.TsUtc).toLocaleTimeString() : "--",
        tsUtc: p.TsUtc,
      };
    }
    case "anomaly": {
      const p = e.payload;
      return {
        id: `anomaly-${p.FrameId}-${idx}`,
        kind: "anomaly",
        severity: "high",
        title: `Anomaly — ${p.AnomalyType}`,
        description: `Conf ${(p.Confidence * 100).toFixed(1)}%${p.Description ? `  ·  ${p.Description}` : ""}`,
        meta: p.TsUtc ? new Date(p.TsUtc).toLocaleTimeString() : "--",
        tsUtc: p.TsUtc,
      };
    }
    default:
      return {
        id: `evt-${idx}`,
        kind: "all",
        severity: "info",
        title: "Event",
        description: "",
        meta: "--",
        tsUtc: new Date().toISOString(),
      };
  }
}

const severityBorder: Record<string, string> = {
  critical: "border-l-red-500",
  high:     "border-l-orange-500",
  medium:   "border-l-yellow-500",
  low:      "border-l-green-500",
  info:     "border-l-cyan-500",
};

const kindIcon: Partial<Record<FilterKind, React.ElementType>> = {
  face:      User,
  behavior:  Activity,
  watchlist: ShieldAlert,
  zone:      MapPin,
  object:    Package,
  anomaly:   AlertOctagon,
};

const kindIconBg: Partial<Record<FilterKind, string>> = {
  face:      "bg-blue-500/15 text-blue-400",
  behavior:  "bg-amber-500/15 text-amber-400",
  watchlist: "bg-red-500/15 text-red-400",
  zone:      "bg-cyan-500/15 text-cyan-400",
  object:    "bg-sky-500/15 text-sky-400",
  anomaly:   "bg-purple-500/15 text-purple-400",
};

function EventCard({ event }: { event: UnifiedEvent }) {
  const Icon = kindIcon[event.kind] ?? Activity;
  const iconBg = kindIconBg[event.kind] ?? "bg-muted/40 text-muted-foreground";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "flex gap-3 rounded-xl border-l-[3px] pl-3 pr-4 py-2.5 bg-surface-1 border border-border/40 hover:bg-surface-2 transition-colors",
        severityBorder[event.severity]
      )}
    >
      <div className={cn("p-1.5 rounded-lg h-fit mt-0.5 shrink-0", iconBg)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm truncate">{event.title}</span>
          <span className="text-[10px] text-muted-foreground tabular shrink-0">{event.meta}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
        {event.extra && (
          <span className="mt-1 inline-block text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">{event.extra}</span>
        )}
      </div>
    </motion.div>
  );
}

interface CameraEventsPanelProps {
  detections: FaceRecognizedPayload[];
  securityEvents: CameraSecurityRealtimeEvent[];
}

export function CameraEventsPanel({ detections, securityEvents }: CameraEventsPanelProps) {
  const [filter, setFilter] = useState<FilterKind>("all");

  const allEvents = useMemo(() => {
    const face = detections.map(buildFaceEvent);
    const sec  = securityEvents.map(buildSecurityEvent);
    return [...face, ...sec].sort((a, b) => Date.parse(b.tsUtc) - Date.parse(a.tsUtc)).slice(0, 100);
  }, [detections, securityEvents]);

  const filtered = useMemo(() =>
    filter === "all" ? allEvents : allEvents.filter(e => e.kind === filter),
    [allEvents, filter]
  );

  const counts = useMemo(() => {
    const c: Partial<Record<FilterKind, number>> = {};
    for (const e of allEvents) {
      c[e.kind] = (c[e.kind] ?? 0) + 1;
    }
    return c;
  }, [allEvents]);

  const exportCsv = useCallback(() => {
    const rows = [["Time", "Kind", "Severity", "Title", "Description"]];
    filtered.forEach(e => rows.push([e.meta, e.kind, e.severity, e.title, e.description]));
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `camera-events-${Date.now()}.csv`;
    a.click();
  }, [filtered]);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-0 pt-4 px-5 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-sm">Events Timeline</div>
            <div className="text-xs text-muted-foreground">{allEvents.length} events recorded</div>
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-surface-3 border border-transparent hover:border-border/50"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap pb-3">
          {FILTERS.map(f => {
            const count = f.key === "all" ? allEvents.length : (counts[f.key] ?? 0);
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  filter === f.key
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground bg-surface-2 border border-border/50 hover:border-border"
                )}
              >
                <f.icon className="w-3 h-3" />
                {f.label}
                {count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0 text-[10px] font-bold",
                    filter === f.key ? "bg-primary/30 text-primary" : "bg-muted/50 text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-3 px-5 pb-5">
        <div className="space-y-1.5 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-12 border border-dashed border-border/40 rounded-xl">
                No {filter === "all" ? "" : filter} events yet
              </div>
            ) : (
              filtered.map(e => <EventCard key={e.id} event={e} />)
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
