import { type ElementType } from "react";
import { cn } from "@/lib/utils";

type Severity = "critical" | "high" | "medium" | "low" | "info" | "default";

const leftBorderColor: Record<Severity, string> = {
  critical: "border-l-red-500",
  high:     "border-l-orange-500",
  medium:   "border-l-yellow-500",
  low:      "border-l-green-500",
  info:     "border-l-cyan-500",
  default:  "border-l-border",
};

const iconBg: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400",
  high:     "bg-orange-500/15 text-orange-400",
  medium:   "bg-yellow-500/15 text-yellow-400",
  low:      "bg-green-500/15 text-green-400",
  info:     "bg-cyan-500/15 text-cyan-400",
  default:  "bg-muted/50 text-muted-foreground",
};

interface TimelineItemProps {
  icon?: ElementType;
  severity?: Severity;
  title: string;
  description?: string;
  time?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function TimelineItem({
  icon: Icon,
  severity = "default",
  title,
  description,
  time,
  badge,
  actions,
  className,
  compact = false,
}: TimelineItemProps) {
  return (
    <div className={cn(
      "flex gap-3 rounded-xl border-l-[3px] pl-3 pr-3 group transition-colors hover:bg-white/[0.02]",
      "border border-border/0 hover:border-border/40",
      leftBorderColor[severity],
      compact ? "py-2" : "py-3",
      className
    )}>
      {Icon && (
        <div className={cn("p-1.5 rounded-lg shrink-0 h-fit mt-0.5", iconBg[severity])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className={cn("font-medium text-sm truncate", compact && "text-xs")}>{title}</span>
            {badge}
          </div>
          {time && <span className="text-[10px] text-muted-foreground shrink-0 tabular mt-0.5">{time}</span>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        )}
        {actions && (
          <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
