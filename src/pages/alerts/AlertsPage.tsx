import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Camera, MapPin, RefreshCw, ShieldAlert, Siren, Eye, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SecurityBadge } from "@/components/ui/security-badge";
import { cn } from "@/lib/utils";
import securityAlertApi from "@/lib/api/securityAlertApi";
import { abpApi } from "@/lib/api/abpApi";
import { AdminFeedbackModal } from "@/components/abp/AdminFeedbackModal";
import type { SecurityAlert, ABPSuspicionEvent } from "@/types";

type AlertTab = "security" | "suspicion";

function severityVariant(sev?: number | null): "critical" | "high" | "medium" | "low" {
  if ((sev ?? 0) >= 4) return "critical";
  if ((sev ?? 0) >= 3) return "high";
  if ((sev ?? 0) >= 2) return "medium";
  return "low";
}
function suspicionVariant(score: number): "critical" | "high" | "medium" {
  if (score >= 0.8) return "critical";
  if (score >= 0.5) return "high";
  return "medium";
}
function relativeTime(value: string) {
  const diff = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function AlertsPage() {
  const [alerts,          setAlerts]          = useState<SecurityAlert[]>([]);
  const [selectedAlert,   setSelectedAlert]   = useState<SecurityAlert | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [activeTab,       setActiveTab]       = useState<AlertTab>("security");
  const [suspicionEvents, setSuspicionEvents] = useState<ABPSuspicionEvent[]>([]);
  const [suspicionLoading,setSuspicionLoading]= useState(false);
  const [feedbackTarget,  setFeedbackTarget]  = useState<ABPSuspicionEvent | null>(null);

  const summary = useMemo(() => ({
    total:     alerts.length,
    watchlist: alerts.filter(e => e.alertCategory === "watchlist").length,
    zone:      alerts.filter(e => e.alertCategory === "zone").length,
    behavior:  alerts.filter(e => e.alertCategory === "behavior").length,
  }), [alerts]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const rows = await securityAlertApi.listOpen();
      setAlerts(rows);
      setSelectedAlert(current => rows.find(e => e.incidentId === current?.incidentId) ?? rows[0] ?? null);
    } catch { toast.error("Failed to load security alerts"); }
    finally { setLoading(false); }
  }
  async function loadSuspicionEvents() {
    setSuspicionLoading(true);
    try { setSuspicionEvents(Array.isArray(await abpApi.getEvents()) ? await abpApi.getEvents() : []); }
    catch { setSuspicionEvents([]); }
    finally { setSuspicionLoading(false); }
  }

  useEffect(() => { void loadAlerts(); }, []);
  useEffect(() => { void loadSuspicionEvents(); }, []);

  const handleRefresh = () => activeTab === "security" ? void loadAlerts() : void loadSuspicionEvents();
  const handleFeedbackSubmitted = () => { setFeedbackTarget(null); void loadSuspicionEvents(); };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="glass-panel rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/15"><Siren className="w-5 h-5 text-red-400" /></div>
            <h1 className="text-2xl font-bold tracking-tight">Security Alerts</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            Live watchlist hits, unauthorized zone access, behavior alarms, and anomaly alerts.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || suspicionLoading}
          className="h-9 gap-1.5 text-xs border-border/60 bg-surface-2 hover:bg-surface-3 shrink-0"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", (loading || suspicionLoading) && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-1 border border-border/30 w-fit">
        {(["security", "suspicion"] as AlertTab[]).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
              activeTab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeTab === t && (
              <motion.div layoutId="alert-tab-bg" className="absolute inset-0 bg-surface-3 rounded-lg border border-border/50"
                transition={{ type: "spring", stiffness: 400, damping: 35 }} />
            )}
            <span className="relative z-10">
              {t === "security" ? `Security (${alerts.length})` : `Suspicion (${suspicionEvents.length})`}
            </span>
          </button>
        ))}
      </div>

      {/* Security tab */}
      {activeTab === "security" && (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Open Alerts",     value: summary.total,     icon: Siren,         accent: "bg-red-500/15 text-red-400"     },
              { label: "Watchlist Hits",  value: summary.watchlist, icon: ShieldAlert,   accent: "bg-orange-500/15 text-orange-400"},
              { label: "Zone Alerts",     value: summary.zone,      icon: MapPin,        accent: "bg-cyan-500/15 text-cyan-400"   },
              { label: "Behavior Alerts", value: summary.behavior,  icon: AlertTriangle, accent: "bg-amber-500/15 text-amber-400" },
            ].map(k => (
              <div key={k.label} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", k.accent)}><k.icon className="w-4 h-4" /></div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</div>
                  <div className="text-2xl font-bold tabular font-mono leading-tight">{k.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Alert list + detail */}
          <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
            {/* Alert queue */}
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
                <div className="font-semibold text-sm">Alert Queue</div>
                <div className="text-xs text-muted-foreground">Prioritized operational alerts</div>
              </CardHeader>
              <CardContent className="pt-3 px-5 pb-5 space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
                <AnimatePresence>
                  {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/40 rounded-xl text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No open security alerts right now.</p>
                    </div>
                  ) : (
                    alerts.map((alert, i) => (
                      <motion.button
                        key={alert.incidentId}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedAlert(alert)}
                        className={cn(
                          "w-full rounded-xl border p-3.5 text-left transition-all border-l-[3px]",
                          alert.severity >= 4 ? "border-l-red-500" : alert.severity >= 3 ? "border-l-orange-500" : "border-l-yellow-500",
                          selectedAlert?.incidentId === alert.incidentId
                            ? "bg-surface-3 border-primary/30"
                            : "bg-surface-1 border-border/40 hover:bg-surface-2 hover:border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{alert.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {alert.person?.displayName || alert.reason || alert.alertCategory}
                            </div>
                          </div>
                          <SecurityBadge variant={severityVariant(alert.severity)} className="shrink-0">
                            #{alert.incidentId}
                          </SecurityBadge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          <span>{alert.zoneName || "No zone"}</span>
                          <span>·</span>
                          <span>{alert.cameraName || alert.streamKey || "Unknown camera"}</span>
                          <span>·</span>
                          <span>{relativeTime(alert.occurredAtUtc)}</span>
                        </div>
                      </motion.button>
                    ))
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Alert details */}
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
                <div className="font-semibold text-sm">Alert Details</div>
                <div className="text-xs text-muted-foreground">Identity, evidence, and operational context</div>
              </CardHeader>
              <CardContent className="pt-4 px-5 pb-5">
                {selectedAlert ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                      {/* Profile photo */}
                      <div className="space-y-3">
                        <div className="aspect-[4/5] overflow-hidden rounded-xl border border-border/40 bg-surface-2">
                          {selectedAlert.person?.profilePhotoUrl ? (
                            <img src={selectedAlert.person.profilePhotoUrl} alt={selectedAlert.person.displayName || "Profile"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No photo</div>
                          )}
                        </div>
                        <div className="rounded-xl border border-border/40 bg-surface-2 p-3 text-xs">
                          <div className="text-muted-foreground">Identity</div>
                          <div className="mt-1 font-semibold text-sm">{selectedAlert.person?.displayName || "Unknown person"}</div>
                          <div className="mt-0.5 text-muted-foreground">{selectedAlert.person?.watchlistReason || "No watchlist note"}</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: "Category",    value: selectedAlert.alertCategory },
                            { label: "Runtime",     value: selectedAlert.sourceRuntime || "Unknown" },
                            { label: "Zone",        value: selectedAlert.zoneName || selectedAlert.zoneId || "Unassigned" },
                            { label: "Camera",      value: selectedAlert.cameraName || selectedAlert.streamKey || "Unknown" },
                            { label: "Confidence",  value: selectedAlert.confidence != null ? `${(selectedAlert.confidence * 100).toFixed(1)}%` : "N/A" },
                            { label: "Similarity",  value: selectedAlert.similarity != null ? `${(selectedAlert.similarity * 100).toFixed(1)}%` : "N/A" },
                          ].map(f => (
                            <div key={f.label} className="rounded-xl border border-border/40 bg-surface-2 p-3">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</div>
                              <div className="mt-1 font-semibold text-sm">{f.value}</div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl border border-border/40 bg-surface-2 p-3">
                          <div className="text-xs text-muted-foreground mb-1.5">Reason</div>
                          <div className="text-sm font-medium">{selectedAlert.reason || selectedAlert.description || "No reason provided."}</div>
                        </div>

                        <div className="rounded-xl border border-border/40 bg-surface-2 p-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Camera className="h-3.5 w-3.5" />
                            Surveillance evidence
                          </div>
                          <div className="aspect-video overflow-hidden rounded-lg border border-border/40 bg-black/40">
                            {selectedAlert.snapshot?.url ? (
                              <img src={selectedAlert.snapshot.url} alt={`Evidence #${selectedAlert.incidentId}`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                Snapshot will appear here when available.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/40 rounded-xl text-muted-foreground">
                    <Eye className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">Select an alert to inspect its evidence.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Suspicion tab */}
      {activeTab === "suspicion" && (
        <Card className="glass-card">
          <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
            <div className="font-semibold text-sm">Suspicion Events</div>
            <div className="text-xs text-muted-foreground">Abnormal behavior predictions awaiting operator review</div>
          </CardHeader>
          <CardContent className="pt-3 px-5 pb-5 space-y-2">
            {suspicionEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/40 rounded-xl text-muted-foreground">
                <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No suspicion events</p>
              </div>
            ) : (
              suspicionEvents.map((event, i) => (
                <motion.div
                  key={event.eventId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border/40 bg-surface-1 p-3.5 hover:bg-surface-2 transition-colors border-l-[3px] border-l-amber-500"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Camera {String(event.cameraId)}</span>
                        {event.hasFeedback && <SecurityBadge variant="low">Reviewed</SecurityBadge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Track {event.trackId}</div>
                    </div>
                    <SecurityBadge variant={suspicionVariant(event.suspicionScore)}>
                      {(event.suspicionScore * 100).toFixed(0)}%
                    </SecurityBadge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{relativeTime(event.occurredAtUtc)}</span>
                    <Button size="sm" variant="outline" onClick={() => setFeedbackTarget(event)}
                      className="h-7 text-xs gap-1.5 border-border/60 bg-surface-2 hover:bg-surface-3"
                    >
                      <Eye className="w-3 h-3" />
                      Review
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {feedbackTarget && (
        <AdminFeedbackModal
          event={feedbackTarget}
          open={!!feedbackTarget}
          onOpenChange={open => { if (!open) setFeedbackTarget(null); }}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </motion.div>
  );
}
