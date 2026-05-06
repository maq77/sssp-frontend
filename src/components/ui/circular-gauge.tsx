import { cn } from "@/lib/utils";

type Severity = "default" | "good" | "warn" | "critical";

function getSeverityColor(severity: Severity) {
  switch (severity) {
    case "good":     return { stroke: "#34d399", text: "text-emerald-400", glow: "drop-shadow(0 0 6px rgba(52,211,153,0.6))" };
    case "warn":     return { stroke: "#fbbf24", text: "text-amber-400",   glow: "drop-shadow(0 0 6px rgba(251,191,36,0.6))"  };
    case "critical": return { stroke: "#f87171", text: "text-red-400",     glow: "drop-shadow(0 0 6px rgba(248,113,113,0.6))" };
    default:         return { stroke: "#60a5fa", text: "text-blue-400",    glow: "drop-shadow(0 0 6px rgba(96,165,250,0.6))"  };
  }
}

function autoSeverity(value: number, max: number, thresholds?: { warn: number; critical: number }): Severity {
  if (!thresholds) return "default";
  const pct = value / max;
  if (pct >= thresholds.critical) return "critical";
  if (pct >= thresholds.warn)     return "warn";
  return "good";
}

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  severity?: Severity;
  thresholds?: { warn: number; critical: number };
  className?: string;
  showValue?: boolean;
}

export function CircularGauge({
  value,
  max,
  label,
  unit = "",
  size = 80,
  strokeWidth = 7,
  severity,
  thresholds,
  className,
  showValue = true,
}: CircularGaugeProps) {
  const resolvedSeverity = severity ?? autoSeverity(value, max, thresholds);
  const colors = getSeverityColor(resolvedSeverity);

  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  const dash = pct * circumference;
  const gap = circumference - dash;

  const displayVal = Number.isFinite(value) ? (value % 1 === 0 ? value : value.toFixed(1)) : "--";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ filter: pct > 0 ? colors.glow : undefined }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: "stroke-dasharray 0.5s cubic-bezier(0.23,1,0.32,1)" }}
          />
        </svg>

        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("font-mono font-bold tabular leading-none", colors.text, size < 70 ? "text-sm" : "text-base")}>
              {displayVal}
            </span>
            {unit && <span className="text-[9px] text-muted-foreground mt-0.5">{unit}</span>}
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground text-center uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}
