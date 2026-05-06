import { cn } from "@/lib/utils";

interface SeverityCounts {
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
}

interface SeverityBarProps {
  counts: SeverityCounts;
  total?: number;
  showLabels?: boolean;
  height?: number;
  className?: string;
}

const segments = [
  { key: "critical" as const, color: "bg-red-500",    label: "Critical" },
  { key: "high"     as const, color: "bg-orange-500", label: "High"     },
  { key: "medium"   as const, color: "bg-yellow-500", label: "Medium"   },
  { key: "low"      as const, color: "bg-green-500",  label: "Low"      },
];

export function SeverityBar({ counts, total, showLabels = false, height = 6, className }: SeverityBarProps) {
  const sum = total ?? segments.reduce((a, s) => a + (counts[s.key] ?? 0), 0);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className={cn("flex rounded-full overflow-hidden gap-px")} style={{ height }}>
        {segments.map((s) => {
          const v = counts[s.key] ?? 0;
          if (v === 0 || sum === 0) return null;
          const pct = (v / sum) * 100;
          return (
            <div
              key={s.key}
              className={cn(s.color, "transition-all duration-500")}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${v}`}
            />
          );
        })}
        {sum === 0 && <div className="w-full bg-muted/30 rounded-full" style={{ height }} />}
      </div>

      {showLabels && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {segments.map((s) => {
            const v = counts[s.key] ?? 0;
            if (v === 0) return null;
            return (
              <span key={s.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.color)} />
                {s.label} {v}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
