import React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

export function AlertPanel({
  type,
  title,
  message,
  actions,
  onClose,
}: {
  type: "warning" | "danger" | "success";
  title: string;
  message: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant: "primary" | "secondary" | "danger";
  }>;
  onClose?: () => void;
}) {
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-400" />,
    warning: <Info className="w-6 h-6 text-amber-400" />,
    success: <CheckCircle className="w-6 h-6 text-emerald-400" />
  };

  const tone =
    type === "danger"
      ? "border-red-500/40 bg-red-950/40"
      : type === "warning"
      ? "border-amber-400/40 bg-amber-950/40"
      : "border-emerald-400/40 bg-emerald-950/40";

  return (
    <div className={`w-[480px] max-w-[94vw] rounded-2xl border ${tone} backdrop-blur-xl p-5 shadow-2xl animate-slideIn`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">{icons[type]}</div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-1">SYSTEM ALERT</div>
              <div className="text-xl font-bold">{title}</div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10 transition"
              >
                ✕
              </button>
            )}
          </div>

          <p className="text-sm text-white/75 leading-relaxed mb-5">{message}</p>

          <div className="flex flex-wrap gap-2">
            {actions.map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                className={`
                  px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105
                  ${a.variant === "danger"
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/50"
                    : a.variant === "primary"
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "border border-white/20 bg-white/5 hover:bg-white/10"
                  }
                `}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}