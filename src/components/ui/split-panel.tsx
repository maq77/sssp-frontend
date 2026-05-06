import { cn } from "@/lib/utils";

interface SplitPanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number | string;
  className?: string;
  gap?: boolean;
}

export function SplitPanel({ left, right, leftWidth = 400, className, gap = true }: SplitPanelProps) {
  return (
    <div className={cn("flex h-full min-h-0", gap && "gap-4", className)}>
      <div className="shrink-0 flex flex-col min-h-0 overflow-hidden" style={{ width: leftWidth }}>
        {left}
      </div>
      <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
        {right}
      </div>
    </div>
  );
}
