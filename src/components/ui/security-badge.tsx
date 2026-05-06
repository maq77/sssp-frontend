import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const securityBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors select-none",
  {
    variants: {
      variant: {
        critical: "bg-red-500/15 text-red-400 border-red-500/30",
        high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
        medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
        low:      "bg-green-500/15 text-green-400 border-green-500/30",
        info:     "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        online:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        offline:  "bg-red-500/15 text-red-400 border-red-500/25",
        degraded: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        live:     "bg-green-500/15 text-green-300 border-green-500/25 animate-pulse",
        unknown:  "bg-red-500/15 text-red-300 border-red-500/25",
        known:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
        watchlist:"bg-purple-500/20 text-purple-300 border-purple-500/35",
        neutral:  "bg-muted/60 text-muted-foreground border-border",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

interface SecurityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof securityBadgeVariants> {
  dot?: boolean;
}

export function SecurityBadge({ variant, dot, className, children, ...props }: SecurityBadgeProps) {
  const dotColor: Record<string, string> = {
    critical: "bg-red-400",
    high:     "bg-orange-400",
    medium:   "bg-yellow-400",
    low:      "bg-green-400",
    info:     "bg-cyan-400",
    online:   "bg-emerald-400",
    offline:  "bg-red-400",
    degraded: "bg-amber-400",
    live:     "bg-green-400 animate-pulse",
    unknown:  "bg-red-400",
    known:    "bg-emerald-400",
    watchlist:"bg-purple-400",
    neutral:  "bg-muted-foreground",
  };

  return (
    <span className={cn(securityBadgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor[variant ?? "neutral"])} />
      )}
      {children}
    </span>
  );
}
