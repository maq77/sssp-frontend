import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Camera, Plus, RefreshCcw, Search, Settings2,
  Play, Square, Pencil, Trash2, AlertTriangle, ShieldAlert,
  ExternalLink, Wifi, Cpu, Zap, LayoutGrid, List,
  ChevronRight, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SecurityBadge } from "@/components/ui/security-badge";
import { CircularGauge } from "@/components/ui/circular-gauge";
import { cn } from "@/lib/utils";

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

import signalRService from "@/lib/signalr-service";
import { cameraApi } from "@/lib/api/cameraApi";
import { getDefaultCameraExecutionMode } from "@/lib/camera-execution-mode";
import { useCameraPolicy } from "@/security/cameraPolicy";
import { useSecurityStore } from "@/store/securityStore";

import { CameraAICapabilities, CameraRecognitionMode } from "@/types";
import type {
  CameraDTO, CameraInferenceMode, CameraSourceProfile, CreateCameraRequest, FaceRecognizedPayload,
} from "@/types";
import type { CameraRuntimeStatus } from "@/types/runtime";

// ── Types ─────────────────────────────────────────────────────────────────────
type CameraRow = CameraDTO & {
  online: boolean;
  fps: number;
  runtime?: CameraRuntimeStatus;
  lastDetection?: FaceRecognizedPayload;
  unknownRecent: boolean;
};

type CameraFormState = Omit<
  CreateCameraRequest, "matchThresholdOverride" | "expectedWidth" | "expectedHeight" | "expectedFps"
> & {
  matchThresholdOverride: number | null;
  expectedWidth: number | null;
  expectedHeight: number | null;
  expectedFps: number | null;
  isActive?: boolean;
};

type ViewMode = "grid" | "list";

// ── Constants ─────────────────────────────────────────────────────────────────
const INFERENCE_OPTIONS: Array<{ value: CameraInferenceMode; label: string }> = [
  { value: "full_analytics", label: "Full Analytics" },
  { value: "face_behavior",  label: "Face + Behavior" },
  { value: "face_only",      label: "Face Only"       },
  { value: "behavior_only",  label: "Behavior Only"   },
  { value: "zone_only",      label: "Zone Only"       },
];

const CAPABILITY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: CameraAICapabilities.All,                                    label: "Full Analytics"    },
  { value: CameraAICapabilities.Face,                                   label: "Face Detection"    },
  { value: CameraAICapabilities.Object,                                 label: "Object Detection"  },
  { value: CameraAICapabilities.Behavior,                               label: "Behavior Detection"},
  { value: CameraAICapabilities.Face | CameraAICapabilities.Object,     label: "Face + Object"     },
  { value: CameraAICapabilities.Face | CameraAICapabilities.Behavior,   label: "Face + Behavior"   },
  { value: CameraAICapabilities.Object | CameraAICapabilities.Behavior, label: "Object + Behavior" },
  { value: CameraAICapabilities.None,                                   label: "Disabled"          },
];

const RECOGNITION_MODE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: CameraRecognitionMode.Normal,      label: "Normal"       },
  { value: CameraRecognitionMode.ObserveOnly, label: "Observe Only" },
  { value: CameraRecognitionMode.Relaxed,     label: "Relaxed"      },
  { value: CameraRecognitionMode.Strict,      label: "Strict"       },
  { value: CameraRecognitionMode.Disabled,    label: "Disabled"     },
];

const SOURCE_PROFILE_OPTIONS: Array<{ value: CameraSourceProfile; label: string }> = [
  { value: "auto",       label: "Auto"       },
  { value: "phone",      label: "Mobile Cam" },
  { value: "cctv",       label: "CCTV"       },
  { value: "webcam",     label: "Webcam"     },
  { value: "test_video", label: "Test Video" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function fmtMs(v?: number) { return v == null ? "--" : `${Math.round(v)}ms`; }
function fmtPct(v?: number) { return v == null ? "--" : `${Math.round(v * 100)}%`; }
function secondsAgo(iso?: string) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : (Date.now() - t) / 1000;
}

function calcHealthScore(row: CameraRow) {
  const fps   = row.runtime?.Fps ?? row.fps ?? 0;
  const q     = row.runtime?.QueueDepth ?? 0;
  const drops = row.runtime?.DroppedFrames ?? 0;
  const ai    = row.runtime?.AvgAiMs ?? 0;
  let score = 100;
  if (!row.isActive) score -= 35;
  if (!row.online)   score -= 40;
  if (fps < 5)       score -= 20;
  if (q > 5)         score -= Math.min(25, q * 2);
  if (drops > 0)     score -= Math.min(25, Math.log10(drops + 1) * 15);
  if (ai > 120)      score -= Math.min(20, (ai - 120) / 10);
  if (row.unknownRecent) score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function healthVariant(score: number): "online" | "degraded" | "critical" {
  if (score >= 85) return "online";
  if (score >= 55) return "degraded";
  return "critical";
}

function buildFleetSeries(rows: CameraRow[], dict: Record<number, any[]>) {
  const ids = rows.map(r => r.id).filter(id => dict[id]?.length);
  const N = Math.min(60, ...ids.map(id => dict[id].length));
  if (!ids.length || !Number.isFinite(N) || N <= 0) return [];
  return Array.from({ length: N }, (_, i) => {
    let fpsSum = 0;
    for (const id of ids) fpsSum += Number(dict[id][dict[id].length - N + i]?.fps ?? 0);
    return { t: dict[ids[0]][dict[ids[0]].length - N + i]?.t ?? "", fps: Math.round(fpsSum / ids.length) };
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function CamerasOverviewPage() {
  const nav = useNavigate();
  const { canControl, canCrud } = useCameraPolicy();
  const pushDetection = useSecurityStore(s => s.pushDetection);
  const storm         = useSecurityStore(s => s.storm);

  const [loading,       setLoading]       = useState(false);
  const [rows,          setRows]          = useState<CameraRow[]>([]);
  const [search,        setSearch]        = useState("");
  const [showOnlyActive,setShowOnlyActive]= useState(false);
  const [viewMode,      setViewMode]      = useState<ViewMode>("grid");

  // CRUD
  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [dialogMode,  setDialogMode]  = useState<"create" | "edit">("create");
  const [editing,     setEditing]     = useState<CameraDTO | null>(null);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleteTarget,setDeleteTarget]= useState<CameraDTO | null>(null);

  const [form, setForm] = useState<CameraFormState>({
    name: "", rtspUrl: "", capabilities: 7, recognitionMode: 0,
    matchThresholdOverride: null, inferenceMode: "full_analytics",
    sourceProfile: "auto", expectedWidth: null, expectedHeight: null,
    expectedFps: null, isActive: true,
  });

  const historyRef       = useRef<Record<number, any[]>>({});
  const runtimeTimerRef  = useRef<number | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadCameras = async () => {
    setLoading(true);
    try {
      const cams = await cameraApi.list();
      setRows(cams.map(c => ({ ...c, online: false, fps: 0, runtime: undefined, lastDetection: undefined, unknownRecent: false })));
    } catch (e: any) {
      toast.error("Failed to load cameras", { description: e?.message ?? "Error" });
    } finally {
      setLoading(false);
    }
  };

  // ── Runtime poll ──────────────────────────────────────────────────────────
  const startRuntimePolling = () => {
    if (runtimeTimerRef.current) window.clearInterval(runtimeTimerRef.current);
    runtimeTimerRef.current = window.setInterval(async () => {
      try {
        const all = await cameraApi.runtimeAll();
        setRows(prev => {
          const map = new Map<number, CameraRuntimeStatus>();
          for (const r of all) map.set((r as any).cameraId ?? (r as any).CameraId ?? r.CameraId, r);
          return prev.map(row => {
            const runtime = map.get(row.id);
            const secs    = secondsAgo(runtime?.LastFrameUtc ?? (runtime as any)?.LastFrameUtc);
            const online  = Boolean((runtime as any)?.isRunning ?? (runtime as any)?.IsRunning ?? runtime?.IsRunning) && secs < 10;
            if (runtime) {
              const key = row.id;
              const now = new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
              const point = {
                t: now,
                fps:   safeNum((runtime as any).fps   ?? (runtime as any).Fps   ?? runtime.Fps,   0),
                q:     safeNum((runtime as any).queueDepth ?? (runtime as any).QueueDepth ?? runtime.QueueDepth, 0),
                drop:  safeNum((runtime as any).droppedFrames ?? (runtime as any).DroppedFrames ?? runtime.DroppedFrames, 0),
                ai:    safeNum((runtime as any).avgAiMs ?? (runtime as any).AvgAiMs ?? runtime.AvgAiMs, 0),
                total: safeNum((runtime as any).avgTotalMs ?? (runtime as any).AvgTotalMs ?? runtime.AvgTotalMs, 0),
              };
              const dict = historyRef.current;
              if (!dict[key]) dict[key] = [];
              dict[key].push(point);
              if (dict[key].length > 60) dict[key].shift();
            }
            return { ...row, runtime, online: online || row.online, fps: runtime?.Fps ?? row.fps };
          });
        });
      } catch { /* silent */ }
    }, 2000);
  };

  // ── SignalR ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadCameras();
    startRuntimePolling();
    const onFace = (envelope: any) => {
      const d: FaceRecognizedPayload = envelope.Data;
      pushDetection(d);
      setRows(prev => prev.map(r => String(r.id) === String(d.CameraId) ? { ...r, lastDetection: d, unknownRecent: !d.UserId } : r));
      if (!storm) {
        if (d.UserId) toast.success(`Recognized: ${d.DisplayName ?? "Person"}`, { description: `Camera ${d.CameraId} · ${(d.Confidence * 100).toFixed(1)}%` });
        else toast.warning("Unknown detected", { description: `Camera ${d.CameraId} · Sim ${(d.Similarity * 100).toFixed(1)}%` });
      }
    };
    const onStatus = (envelope: any) => {
      const s = envelope.Data as { CameraId: string; IsOnline: boolean; Fps?: number };
      setRows(prev => prev.map(r => String(r.id) === String(s.CameraId) ? { ...r, online: s.IsOnline, fps: s.Fps ?? r.fps } : r));
    };
    signalRService.on("ReceiveFaceRecognized" as any, onFace);
    signalRService.on("ReceiveCameraStatus"   as any, onStatus);
    return () => {
      signalRService.off("ReceiveFaceRecognized" as any, onFace);
      signalRService.off("ReceiveCameraStatus"   as any, onStatus);
      if (runtimeTimerRef.current) window.clearInterval(runtimeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (showOnlyActive && !r.isActive) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || String(r.id).includes(q) || r.rtspUrl.toLowerCase().includes(q);
    });
  }, [rows, search, showOnlyActive]);

  const kpis = useMemo(() => ({
    total:   rows.length,
    active:  rows.filter(r => r.isActive).length,
    online:  rows.filter(r => r.online).length,
    unknown: rows.filter(r => r.unknownRecent).length,
    avgFps:  rows.length === 0 ? 0 : Math.round(rows.reduce((a, r) => a + (r.runtime?.Fps ?? r.fps ?? 0), 0) / rows.length),
    drops:   rows.reduce((a, r) => a + (r.runtime?.DroppedFrames ?? 0), 0),
  }), [rows]);

  const topOffenders = useMemo(() => {
    return [...rows].map(r => ({ r, score: calcHealthScore(r) })).sort((a, b) => a.score - b.score).slice(0, 5);
  }, [rows]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setDialogMode("create"); setEditing(null);
    setForm({ name: "", rtspUrl: "", capabilities: 7, recognitionMode: 0, matchThresholdOverride: null,
      inferenceMode: "full_analytics", sourceProfile: "auto", expectedWidth: null, expectedHeight: null,
      expectedFps: null, isActive: true, zoneId: null, useFace: true, useObject: true, useBehavior: true });
    setDialogOpen(true);
  };
  const openEdit = (cam: CameraDTO) => {
    setDialogMode("edit"); setEditing(cam);
    setForm({ name: cam.name, rtspUrl: cam.rtspUrl, capabilities: cam.capabilities,
      recognitionMode: cam.recognitionMode, matchThresholdOverride: cam.matchThresholdOverride ?? null,
      inferenceMode: cam.inferenceMode ?? "full_analytics", sourceProfile: cam.sourceProfile ?? "auto",
      expectedWidth: cam.expectedWidth ?? null, expectedHeight: cam.expectedHeight ?? null,
      expectedFps: cam.expectedFps ?? null, isActive: cam.isActive, zoneId: cam.zoneId ?? null,
      useFace: cam.useFace ?? true, useObject: cam.useObject ?? true, useBehavior: cam.useBehavior ?? true });
    setDialogOpen(true);
  };
  const submitDialog = async () => {
    if (!form.name.trim())   return toast.error("Name is required");
    if (!form.rtspUrl.trim()) return toast.error("RTSP URL is required");
    try {
      if (dialogMode === "create") {
        await cameraApi.create({ name: form.name.trim(), rtspUrl: form.rtspUrl.trim(),
          capabilities: safeNum(form.capabilities, 7), recognitionMode: safeNum(form.recognitionMode, 0),
          matchThresholdOverride: form.matchThresholdOverride ?? undefined, inferenceMode: form.inferenceMode,
          sourceProfile: form.sourceProfile, expectedWidth: form.expectedWidth ?? null,
          expectedHeight: form.expectedHeight ?? null, expectedFps: form.expectedFps ?? null,
          zoneId: form.zoneId ?? null, useFace: form.useFace ?? true, useObject: form.useObject ?? true,
          useBehavior: form.useBehavior ?? true });
        toast.success("Camera created");
      } else {
        if (!editing) return;
        await cameraApi.update(editing.id, { name: form.name.trim(), rtspUrl: form.rtspUrl.trim(),
          isActive: Boolean(form.isActive), capabilities: safeNum(form.capabilities, editing.capabilities),
          recognitionMode: safeNum(form.recognitionMode, editing.recognitionMode),
          matchThresholdOverride: form.matchThresholdOverride ?? null, inferenceMode: form.inferenceMode,
          sourceProfile: form.sourceProfile, expectedWidth: form.expectedWidth ?? null,
          expectedHeight: form.expectedHeight ?? null, expectedFps: form.expectedFps ?? null,
          zoneId: editing.zoneId ?? form.zoneId ?? null, useFace: form.useFace ?? editing.useFace ?? true,
          useObject: form.useObject ?? editing.useObject ?? true, useBehavior: form.useBehavior ?? editing.useBehavior ?? true });
        toast.success("Camera updated");
      }
      setDialogOpen(false);
      await loadCameras();
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message ?? "Error" });
    }
  };
  const askDelete = (cam: CameraDTO) => { setDeleteTarget(cam); setDeleteOpen(true); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await cameraApi.remove(deleteTarget.id);
      toast.success("Camera deleted");
      setDeleteOpen(false); setDeleteTarget(null);
      await loadCameras();
    } catch (e: any) { toast.error("Delete failed", { description: e?.message ?? "Error" }); }
  };
  const startCam = async (row: CameraRow) => {
    if (!canControl) return toast.error("Not allowed");
    try { const mode = getDefaultCameraExecutionMode(); await cameraApi.start(row.id, row.rtspUrl, mode); toast.success(`Started: ${row.name}`); }
    catch (e: any) { toast.error("Start failed", { description: e?.message }); }
  };
  const stopCam = async (row: CameraRow) => {
    if (!canControl) return toast.error("Not allowed");
    try { const mode = getDefaultCameraExecutionMode(); await cameraApi.stop(row.id, mode); toast.info(`Stopped: ${row.name}`); }
    catch (e: any) { toast.error("Stop failed", { description: e?.message }); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="glass-panel rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 rounded-xl bg-blue-500/15"><Camera className="w-5 h-5 text-blue-400" /></div>
            <h1 className="text-2xl font-bold tracking-tight">Camera Fleet</h1>
            {storm && <SecurityBadge variant="critical" dot>Storm Mode</SecurityBadge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            Fleet health, runtime KPIs, and security posture across {kpis.total} cameras.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadCameras} disabled={loading} className="h-9 border-border/60 bg-surface-2 hover:bg-surface-3 gap-1.5 text-xs">
            <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          {canCrud && (
            <Button size="sm" onClick={openCreate} className="h-9 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Add Camera
            </Button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total",    value: kpis.total,   icon: Camera,        color: "text-blue-400",   bg: "bg-blue-500/10"   },
          { label: "Active",   value: kpis.active,  icon: Activity,      color: "text-emerald-400",bg: "bg-emerald-500/10"},
          { label: "Online",   value: kpis.online,  icon: Wifi,          color: "text-cyan-400",   bg: "bg-cyan-500/10"   },
          { label: "Avg FPS",  value: kpis.avgFps,  icon: Zap,           color: "text-amber-400",  bg: "bg-amber-500/10"  },
          { label: "Drops",    value: kpis.drops,   icon: AlertTriangle, color: kpis.drops > 0 ? "text-red-400" : "text-muted-foreground", bg: kpis.drops > 0 ? "bg-red-500/10" : "bg-surface-2" },
          { label: "Unknown",  value: kpis.unknown, icon: ShieldAlert,   color: kpis.unknown > 0 ? "text-red-400" : "text-muted-foreground", bg: kpis.unknown > 0 ? "bg-red-500/10" : "bg-surface-2" },
        ].map(k => (
          <div key={k.label} className={cn("glass-card rounded-xl p-4 flex items-center gap-3", k.bg)}>
            <k.icon className={cn("w-5 h-5 shrink-0", k.color)} />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</div>
              <div className="text-2xl font-bold tabular font-mono leading-tight">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fleet chart + top offenders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
            <div className="font-semibold text-sm">Fleet FPS</div>
            <div className="text-xs text-muted-foreground">Aggregate throughput, last ~2 min</div>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={buildFleetSeries(rows, historyRef.current)} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(6,8,13,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11, color: "#f1f5f9" }}
                    formatter={(v: number) => [`${v} fps`]}
                  />
                  <Line dataKey="fps" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
            <div className="font-semibold text-sm">Health Concerns</div>
            <div className="text-xs text-muted-foreground">Lowest health score first</div>
          </CardHeader>
          <CardContent className="pt-3 px-5 pb-5 space-y-2">
            {topOffenders.map(({ r, score }) => (
              <button
                key={r.id}
                onClick={() => nav(`/app/cameras/${r.id}`)}
                className="w-full text-left p-3 rounded-xl bg-surface-2 border border-border/40 hover:bg-surface-3 hover:border-border/70 transition-all group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium text-sm truncate">{r.name}</span>
                  <SecurityBadge variant={healthVariant(score)}>{score}</SecurityBadge>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", score >= 85 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground font-mono">{Math.round(r.runtime?.Fps ?? r.fps ?? 0)} fps</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
            {rows.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No cameras yet.</div>}
          </CardContent>
        </Card>
      </div>

      {/* Search + filter bar */}
      <div className="glass-panel rounded-2xl px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex items-center w-full sm:w-[380px]">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cameras…"
            className="pl-9 bg-surface-2 border-border/50 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyActive(v => !v)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all",
              showOnlyActive ? "bg-primary/20 text-primary border-primary/30" : "text-muted-foreground border-border/50 bg-surface-2 hover:bg-surface-3 hover:text-foreground"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
            {showOnlyActive ? "Active only" : "All cameras"}
          </button>
          <div className="flex items-center bg-surface-1 rounded-lg border border-border/30 p-0.5">
            {(["grid", "list"] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === m ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {m === "grid" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular">{filtered.length} cameras</span>
        </div>
      </div>

      {/* Camera cards */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 border border-dashed border-border/40 rounded-2xl text-muted-foreground"
          >
            <Camera className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">No cameras match your filters.</p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className={cn(viewMode === "grid" ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : "space-y-3")}
          >
            {filtered.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <CameraFleetCard
                  row={row}
                  compact={viewMode === "list"}
                  canControl={canControl}
                  canCrud={canCrud}
                  onOpen={() => nav(`/app/cameras/${row.id}`)}
                  onStart={() => startCam(row)}
                  onStop={() => stopCam(row)}
                  onEdit={() => openEdit(row)}
                  onDelete={() => askDelete(row)}
                  history={historyRef.current[row.id] ?? []}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Add Camera" : "Edit Camera"}</DialogTitle>
            <DialogDescription>Configure camera connection and AI capabilities.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Field label="Name">
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Main Entrance" />
            </Field>
            <Field label="RTSP URL">
              <Input value={form.rtspUrl} onChange={e => setForm(p => ({ ...p, rtspUrl: e.target.value }))} placeholder="rtsp://user:pass@ip:554/stream" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Capabilities">
                <Select value={String(form.capabilities)} onValueChange={v => setForm(p => ({ ...p, capabilities: safeNum(v, CameraAICapabilities.All) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CAPABILITY_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Recognition Mode">
                <Select value={String(form.recognitionMode)} onValueChange={v => setForm(p => ({ ...p, recognitionMode: safeNum(v, CameraRecognitionMode.Normal) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RECOGNITION_MODE_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Match Threshold">
                <Input type="number" value={form.matchThresholdOverride == null ? "" : String(form.matchThresholdOverride)} onChange={e => setForm(p => ({ ...p, matchThresholdOverride: e.target.value === "" ? null : safeNum(e.target.value, 0) }))} placeholder="(optional)" />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Inference Mode">
                <Select value={form.inferenceMode ?? "full_analytics"} onValueChange={v => setForm(p => ({ ...p, inferenceMode: v as CameraInferenceMode }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INFERENCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Source Profile">
                <Select value={form.sourceProfile ?? "auto"} onValueChange={v => setForm(p => ({ ...p, sourceProfile: v as CameraSourceProfile }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCE_PROFILE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["expectedWidth", "expectedHeight", "expectedFps"] as const).map(k => (
                <Field key={k} label={k === "expectedWidth" ? "Width" : k === "expectedHeight" ? "Height" : "FPS"}>
                  <Input type="number" value={form[k] == null ? "" : String(form[k])} onChange={e => setForm(p => ({ ...p, [k]: e.target.value === "" ? null : safeNum(e.target.value, 0) }))} placeholder="Auto" />
                </Field>
              ))}
            </div>
            {dialogMode === "edit" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={Boolean(form.isActive)} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
            )}
          </div>
          <DialogFooter className="mt-5">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitDialog}>{dialogMode === "create" ? "Create" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Camera?</DialogTitle>
            <DialogDescription>This will remove the camera from configuration. Streaming sessions will stop.</DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-3 rounded-xl bg-surface-2 border border-border/40">
            <div className="font-semibold">{deleteTarget?.name}</div>
            <div className="text-xs text-muted-foreground">ID: {deleteTarget?.id}</div>
          </div>
          <DialogFooter className="mt-5">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ── CameraFleetCard ────────────────────────────────────────────────────────────
function CameraFleetCard({
  row, compact, canControl, canCrud, onOpen, onStart, onStop, onEdit, onDelete, history,
}: {
  row: CameraRow; compact?: boolean; canControl: boolean; canCrud: boolean;
  onOpen: () => void; onStart: () => void; onStop: () => void;
  onEdit: () => void; onDelete: () => void; history: any[];
}) {
  const score    = calcHealthScore(row);
  const variant  = healthVariant(score);
  const fps      = Math.round(row.runtime?.Fps ?? row.fps ?? 0);
  const q        = row.runtime?.QueueDepth ?? 0;
  const drops    = row.runtime?.DroppedFrames ?? 0;
  const isUnknown= !!row.lastDetection && !row.lastDetection.UserId;

  const borderColor = variant === "online" ? "border-l-emerald-500" : variant === "degraded" ? "border-l-amber-500" : "border-l-red-500";

  if (compact) {
    return (
      <div className={cn("glass-card rounded-xl border-l-[3px] pl-4 pr-4 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors", borderColor)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{row.name}</span>
            <SecurityBadge variant={row.online ? "online" : "offline"}>{row.online ? "Online" : "Offline"}</SecurityBadge>
            {!row.isActive && <SecurityBadge variant="neutral">Inactive</SecurityBadge>}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">cam-{row.id} · {fps} fps · Q:{q} · D:{drops}</div>
        </div>
        <SecurityBadge variant={variant}>{score}</SecurityBadge>
        <button onClick={onOpen} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("glass-card rounded-2xl border-l-[3px] overflow-hidden flex flex-col hover:shadow-panel transition-all", borderColor)}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-border/30">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Camera className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-semibold truncate">{row.name}</span>
            <SecurityBadge variant={row.isActive ? "online" : "offline"}>{row.isActive ? "Active" : "Inactive"}</SecurityBadge>
            <SecurityBadge variant={row.online ? "online" : "offline"} dot>{row.online ? "Online" : "Offline"}</SecurityBadge>
            {isUnknown && <SecurityBadge variant="critical" dot>Unknown</SecurityBadge>}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-1 truncate">cam-{row.id} · {row.rtspUrl}</div>
        </div>
        <SecurityBadge variant={variant}>{score}</SecurityBadge>
      </div>

      {/* Chart + KPIs */}
      <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3">
        {/* mini sparkline */}
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 2, right: 4, left: -32, bottom: 0 }}>
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(6,8,13,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 10, color: "#f1f5f9" }}
                formatter={(v: number, name: string) => [`${v}`, name]}
              />
              <Line dataKey="fps"  stroke="#34d399" strokeWidth={1.5} dot={false} />
              <Line dataKey="q"    stroke="#60a5fa" strokeWidth={1.5} dot={false} />
              <Line dataKey="drop" stroke="#f87171" strokeWidth={1}   dot={false} strokeDasharray="3 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* FPS gauge */}
        <CircularGauge
          value={fps}
          max={30}
          label="FPS"
          size={64}
          strokeWidth={5}
          severity={fps >= 24 ? "good" : fps >= 15 ? "warn" : "critical"}
        />
      </div>

      {/* Runtime KPIs */}
      <div className="grid grid-cols-5 gap-px bg-border/20 border-t border-b border-border/20">
        {[
          { label: "FPS",   value: String(fps),         icon: Zap,           color: fps >= 24 ? "#34d399" : fps >= 15 ? "#f59e0b" : "#f87171" },
          { label: "Queue", value: String(q),            icon: Activity,      color: q > 5 ? "#f87171" : "#60a5fa" },
          { label: "Drops", value: String(drops),        icon: AlertTriangle, color: drops > 0 ? "#f87171" : "#94a3b8" },
          { label: "AI",    value: fmtMs(row.runtime?.AvgAiMs),  icon: Cpu,  color: (row.runtime?.AvgAiMs ?? 0) > 120 ? "#f87171" : "#f59e0b" },
          { label: "Total", value: fmtMs(row.runtime?.AvgTotalMs), icon: Clock, color: "#94a3b8" },
        ].map(k => (
          <div key={k.label} className="flex flex-col items-center px-2 py-2.5 bg-surface-1">
            <k.icon className="w-3 h-3 mb-1" style={{ color: k.color }} />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{k.label}</span>
            <span className="font-mono font-bold text-xs tabular mt-0.5" style={{ color: k.color }}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Last detection */}
      {row.lastDetection && (
        <div className={cn("mx-5 my-3 p-3 rounded-xl border", isUnknown ? "bg-red-500/10 border-red-500/25" : "bg-emerald-500/10 border-emerald-500/25")}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold truncate">
              {row.lastDetection.DisplayName ?? (isUnknown ? "Unknown Person" : "Detected")}
            </span>
            <SecurityBadge variant={isUnknown ? "critical" : "low"}>
              {isUnknown ? "Unknown" : "Recognized"}
            </SecurityBadge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Conf {fmtPct(row.lastDetection.Confidence)} · Sim {fmtPct(row.lastDetection.Similarity)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 px-5 pb-4 mt-auto">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={onOpen} className="h-8 text-xs gap-1.5 border-border/60 bg-surface-2 hover:bg-surface-3">
            <ExternalLink className="w-3 h-3" />
            Details
          </Button>
          {canControl && (
            <>
              <Button size="sm" onClick={onStart} disabled={!row.isActive} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                <Play className="w-3 h-3" />
                Start
              </Button>
              <Button size="sm" variant="destructive" onClick={onStop} className="h-8 text-xs gap-1.5">
                <Square className="w-3 h-3" />
                Stop
              </Button>
            </>
          )}
        </div>
        {canCrud && (
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onEdit} className="h-8 text-xs gap-1.5 border-border/60 bg-surface-2 hover:bg-surface-3">
              <Pencil className="w-3 h-3" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="h-8 text-xs text-red-400 hover:text-red-300 hover:border-red-500/40 border-border/60 bg-surface-2 hover:bg-red-500/10">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
