import { memo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  AreaChart, Area, CartesianGrid, ReferenceLine,
} from "recharts";
import { Activity, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RuntimePoint } from "@/types/camera";
import { cn } from "@/lib/utils";

const chartTooltipStyle = {
  backgroundColor: "rgba(6,8,13,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  fontSize: "11px",
  color: "#f1f5f9",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

const chartAxisStyle = { stroke: "rgba(255,255,255,0.15)", fontSize: 10, fontFamily: "monospace" };

function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">{title}</div>
            {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-2 pb-4">
        {children}
      </CardContent>
    </Card>
  );
}

function DiagnosticItem({ label, value, status }: { label: string; value: string; status?: "ok" | "warn" | "error" }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 border border-border/40">
      <div className="mt-0.5 shrink-0">
        {status === "ok"    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
         : status === "error" ? <XCircle className="w-4 h-4 text-red-400" />
         : status === "warn"  ? <AlertTriangle className="w-4 h-4 text-amber-400" />
         : <Activity className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-mono text-sm font-medium break-all mt-0.5">{value}</div>
      </div>
    </div>
  );
}

interface CameraMetricsPanelProps {
  history: RuntimePoint[];
  isRunning: boolean;
  lastFrame: string;
  lastError: string;
}

export const CameraMetricsPanel = memo(function CameraMetricsPanel({ history, isRunning, lastFrame, lastError }: CameraMetricsPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="FPS & Queue Depth" subtitle="Real-time throughput metrics">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" {...chartAxisStyle} tickLine={false} axisLine={false} />
              <YAxis {...chartAxisStyle} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line dataKey="fps" name="FPS"   stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#34d399" }} />
              <Line dataKey="q"   name="Queue" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#60a5fa" }} />
              <Line dataKey="drop" name="Drops" stroke="#f87171" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 px-4 mt-2">
          {[{ color: "#34d399", label: "FPS" }, { color: "#60a5fa", label: "Queue" }, { color: "#f87171", label: "Drops" }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 rounded" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Processing Latency" subtitle="AI inference + FAISS match time (ms)">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" {...chartAxisStyle} tickLine={false} axisLine={false} />
              <YAxis {...chartAxisStyle} tickLine={false} axisLine={false} width={32} unit="ms" />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}ms`]} />
              <ReferenceLine y={120} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 2" label={{ value: "120ms", fill: "#f87171", fontSize: 9, position: "insideTopRight" }} />
              <Area dataKey="ai"    name="AI"    stroke="#f59e0b" strokeWidth={2} fill="url(#aiGrad)"    dot={false} />
              <Area dataKey="match" name="Match" stroke="#8b5cf6" strokeWidth={2} fill="url(#matchGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 px-4 mt-2">
          {[{ color: "#f59e0b", label: "AI inference" }, { color: "#8b5cf6", label: "FAISS match" }, { color: "#f87171", label: "120ms limit", dashed: true }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 rounded" style={{ backgroundColor: l.color, opacity: l.dashed ? 0.6 : 1 }} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <Card className="glass-card lg:col-span-2">
        <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Runtime Diagnostics</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DiagnosticItem
              label="Pipeline Status"
              value={isRunning ? "Running" : "Stopped"}
              status={isRunning ? "ok" : "warn"}
            />
            <DiagnosticItem
              label="Last Frame"
              value={lastFrame}
              status={lastFrame === "--" ? "warn" : "ok"}
            />
            <DiagnosticItem
              label="Last Error"
              value={lastError || "None"}
              status={lastError ? "error" : "ok"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
