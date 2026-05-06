import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  label?: string;
  color?: "green" | "red" | "amber" | "blue";
  pulse?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const colorMap = {
  green: { dot: "bg-emerald-400", ring: "bg-emerald-400/30", text: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/10" },
  red:   { dot: "bg-red-400",     ring: "bg-red-400/30",     text: "text-red-400",     border: "border-red-500/20 bg-red-500/10"     },
  amber: { dot: "bg-amber-400",   ring: "bg-amber-400/30",   text: "text-amber-400",   border: "border-amber-500/20 bg-amber-500/10" },
  blue:  { dot: "bg-blue-400",    ring: "bg-blue-400/30",    text: "text-blue-400",    border: "border-blue-500/20 bg-blue-500/10"   },
};

export function LiveBadge({ label = "LIVE", color = "green", pulse = true, className, size = "sm" }: LiveBadgeProps) {
  const c = colorMap[color];
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wider",
      c.border,
      size === "sm" ? "text-[10px]" : "text-xs",
      className
    )}>
      <span className="relative flex items-center justify-center">
        <span className={cn("rounded-full", size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2", c.dot)} />
        {pulse && (
          <span className={cn("absolute rounded-full animate-live-ring opacity-0", size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2", c.ring)} />
        )}
      </span>
      <span className={c.text}>{label}</span>
    </div>
  );
}
