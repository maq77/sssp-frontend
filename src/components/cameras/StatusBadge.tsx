import { Badge } from "@/components/ui/badge";
import type { WhepUiStatus } from "@/types/camera";

export function StatusBadge({ status }: { status: WhepUiStatus }) {
  const config: Record<WhepUiStatus, { color: string; label: string; icon: string | null }> = {
    idle: { color: "border-gray-500 text-gray-400 bg-gray-500/10", label: "Idle", icon: null },
    starting: { color: "border-yellow-500 text-yellow-400 bg-yellow-500/10", label: "Starting", icon: null },
    playing: { color: "border-green-500 text-green-400 bg-green-500/10", label: "Live", icon: "●" },
    stopped: { color: "border-red-500 text-red-400 bg-red-500/10", label: "Stopped", icon: null },
    reconnecting: { color: "border-orange-500 text-orange-400 bg-orange-500/10", label: "Reconnecting", icon: null },
    error: { color: "border-red-500 text-red-400 bg-red-500/10", label: "Error", icon: "⚠" },
  };

  const item = config[status] ?? config.idle; 
  const { color, label, icon } = item;

  return (
    <Badge variant="outline" className={`${color} font-medium gap-1.5`}>
      {icon && <span className={status === "playing" ? "animate-pulse" : ""}>{icon}</span>}
      {label}
    </Badge>
  );
}
