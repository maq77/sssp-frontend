import { type ElementType } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Severity = "default" | "critical" | "high" | "medium" | "low" | "info" | "online" | "offline";

const severityIcon: Record<Severity, string> = {
  default:  "bg-blue-500/20 text-blue-400",
  critical: "bg-red-500/20 text-red-400",
  high:     "bg-orange-500/20 text-orange-400",
  medium:   "bg-yellow-500/20 text-yellow-400",
  low:      "bg-green-500/20 text-green-400",
  info:     "bg-cyan-500/20 text-cyan-400",
  online:   "bg-emerald-500/20 text-emerald-400",
  offline:  "bg-red-500/20 text-red-400",
};

const severityValue: Record<Severity, string> = {
  default:  "text-foreground",
  critical: "text-red-400",
  high:     "text-orange-400",
  medium:   "text-yellow-400",
  low:      "text-green-400",
  info:     "text-cyan-400",
  online:   "text-emerald-400",
  offline:  "text-red-400",
};

interface StatKpiProps {
  label: string;
  value: string | number;
  icon: ElementType;
  severity?: Severity;
  delta?: number;
  deltaLabel?: string;
  sublabel?: string;
  mono?: boolean;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export function StatKpi({
  label,
  value,
  icon: Icon,
  severity = "default",
  delta,
  deltaLabel,
  sublabel,
  mono = true,
  className,
  delay = 0,
  onClick,
}: StatKpiProps) {
  const hasDelta = delta !== undefined;
  const deltaPositive = (delta ?? 0) > 0;
  const deltaZero = delta === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClick}
      className={cn(
        "glass-card rounded-2xl p-4 flex flex-col gap-3",
        "border border-border/60",
        onClick && "cursor-pointer card-hover hover:border-primary/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("p-2 rounded-xl shrink-0", severityIcon[severity])}>
          <Icon className="w-4 h-4" />
        </div>
        {hasDelta && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
            deltaZero
              ? "text-muted-foreground bg-muted/40"
              : deltaPositive
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-red-400 bg-red-500/10"
          )}>
            {deltaZero ? <Minus className="w-3 h-3" /> : deltaPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {deltaLabel ?? `${delta > 0 ? "+" : ""}${delta}`}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">{label}</p>
        <p className={cn(
          "text-kpi-md font-bold leading-none tabular",
          mono && "font-mono",
          severityValue[severity]
        )}>
          {value}
        </p>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
        )}
      </div>
    </motion.div>
  );
}
