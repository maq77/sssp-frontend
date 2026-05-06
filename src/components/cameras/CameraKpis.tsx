import { memo } from "react";
import { Activity, AlertTriangle, Cpu, Zap, Timer } from "lucide-react";
import { CircularGauge } from "@/components/ui/circular-gauge";
import { cn } from "@/lib/utils";

function parseMs(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function MetricChip({
  label,
  value,
  unit,
  warning,
  critical,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  warning?: boolean;
  critical?: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors",
      critical ? "bg-red-500/10 border-red-500/25 text-red-400"
        : warning ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
        : "bg-surface-2 border-border/50 text-foreground"
    )}>
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-mono font-bold text-sm tabular leading-tight">{value}{unit && <span className="text-xs font-normal opacity-70 ml-0.5">{unit}</span>}</div>
      </div>
    </div>
  );
}

interface CameraKpisProps {
  fps: number;
  q: string;
  drop: string;
  ai: string;
  match: string;
  uptime: string;
  expectedFps?: number;
  className?: string;
}

export const CameraKpis = memo(function CameraKpis({ fps, q, drop, ai, match, uptime, expectedFps, className }: CameraKpisProps) {
  const aiMs   = parseMs(ai);
  const matchMs = parseMs(match);
  const dropN  = parseInt(drop, 10) || 0;
  const qN     = parseInt(q, 10) || 0;
  const maxFps = expectedFps ?? 30;

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* FPS circular gauge */}
      <CircularGauge
        value={fps}
        max={maxFps}
        label="FPS"
        size={72}
        strokeWidth={6}
        thresholds={{ warn: 0.5, critical: 0.2 }}
        severity={fps >= maxFps * 0.8 ? "good" : fps >= maxFps * 0.5 ? "warn" : "critical"}
      />

      <div className="flex flex-wrap gap-2">
        <MetricChip
          label="Queue"
          value={q}
          icon={Activity}
          warning={qN > 5}
          critical={qN > 20}
        />
        <MetricChip
          label="Drops"
          value={drop}
          icon={AlertTriangle}
          warning={dropN > 0}
          critical={dropN > 10}
        />
        <MetricChip
          label="AI"
          value={ai}
          unit="ms"
          icon={Cpu}
          warning={aiMs > 80}
          critical={aiMs > 150}
        />
        <MetricChip
          label="Match"
          value={match}
          unit="ms"
          icon={Zap}
          warning={matchMs > 50}
          critical={matchMs > 100}
        />
        <MetricChip
          label="Uptime"
          value={uptime}
          icon={Timer}
        />
      </div>
    </div>
  );
});
