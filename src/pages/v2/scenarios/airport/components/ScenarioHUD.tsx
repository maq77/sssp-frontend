import React from "react";
import { Activity, Camera, Shield, Zap } from "lucide-react";

export type HUDMetric = { 
  label: string; 
  value: string; 
  icon?: string;
  color?: string; // NEW: Support custom colors
};

export type HUDAlert = { 
  id: string; 
  type: "warning" | "danger" | "success"; 
  title: string; 
  message: string;
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
    <div className={`pointer-events-none absolute z-40 ${pos} w-[400px] max-w-[92vw] space-y-3`}>
      {/* Metrics Panel */}
      <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          <div className="text-xs text-white/60 font-bold tracking-wider uppercase">Live Telemetry</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-3 hover:from-white/10 transition">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1.5">{m.label}</div>
              <div 
                className="text-lg font-black"
                style={{ color: m.color || '#ffffff' }}
              >
                {m.value}
              </div>
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
              ? "border-red-500/50 bg-red-950/50" 
              : a.type === "warning"
              ? "border-amber-400/50 bg-amber-950/50"
              : "border-emerald-400/50 bg-emerald-950/50"
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
                    ? "text-red-200"
                    : a.type === "warning"
                    ? "text-amber-100"
                    : "text-emerald-100"
                }`}
              >
                {a.title}
              </div>
              <div className="text-xs text-white/90 leading-relaxed">{a.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}