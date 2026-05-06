import React from "react";
import { Activity, Camera, Shield, Zap } from "lucide-react";

export type HUDMetric = { label: string; value: string; icon?: string };
export type HUDAlert = { 
  id: string; 
  type: "warning" | "danger" | "success"; 
  title: string; 
  message: string;
};

const iconMap: Record<string, React.ReactNode> = {
  status: <Activity className="w-4 h-4" />,
  camera: <Camera className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />
};

export function ScenarioHUD({
  metrics,
  alerts = [],
  position = "top-right",
}: {
  metrics: HUDMetric[];
  alerts?: HUDAlert[];
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const pos =
    position === "top-left"
      ? "top-4 left-4"
      : position === "top-right"
      ? "top-4 right-4"
      : position === "bottom-left"
      ? "bottom-4 left-4"
      : "bottom-4 right-4";

  return (
    <div className={`pointer-events-none absolute z-40 ${pos} w-[380px] max-w-[92vw] space-y-3`}>
      {/* Metrics Panel */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-400" />
          <div className="text-xs text-white/50 font-semibold tracking-wider uppercase">Live Telemetry</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-3 hover:from-white/10 transition">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">{m.label}</div>
              <div className="text-lg font-bold text-white">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {alerts.map((a) => (
        <div 
          key={a.id} 
          className={`
            rounded-2xl border backdrop-blur-xl p-4 shadow-2xl animate-slideIn
            ${a.type === "danger" 
              ? "border-red-500/40 bg-red-950/40" 
              : a.type === "warning"
              ? "border-amber-400/40 bg-amber-950/40"
              : "border-emerald-400/40 bg-emerald-950/40"
            }
          `}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 h-3 w-3 rounded-full animate-pulse ${
                a.type === "danger"
                  ? "bg-red-400 shadow-lg shadow-red-500/50"
                  : a.type === "warning"
                  ? "bg-amber-300 shadow-lg shadow-amber-500/50"
                  : "bg-emerald-300 shadow-lg shadow-emerald-500/50"
              }`}
            />
            
            <div className="flex-1">
              <div
                className={`text-sm font-bold mb-1 ${
                  a.type === "danger"
                    ? "text-red-300"
                    : a.type === "warning"
                    ? "text-amber-200"
                    : "text-emerald-200"
                }`}
              >
                {a.title}
              </div>
              <div className="text-xs text-white/80 leading-relaxed">{a.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}