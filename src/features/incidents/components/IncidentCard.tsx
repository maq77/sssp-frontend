import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  User,
  Eye,
  CheckCircle,
  ArrowUpCircle,
  Radio,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { IncidentAlert, IncidentAlertSeverity, IncidentAlertType } from "@/store/useIncidentStore";
import { useIncidentStore } from "@/store/useIncidentStore";
import { playCriticalBeep, playWarningBeep } from "@/features/incidents/audio/incidentBeep";

// ─── Severity tokens ─────────────────────────────────────────────────────────

const severityConfig: Record<
  IncidentAlertSeverity,
  { border: string; bg: string; badge: string; text: string; ring: string }
> = {
  critical: {
    border: "border-l-red-500",
    bg: "bg-white/97 dark:bg-zinc-900/97",
    badge: "bg-red-500 text-white",
    text: "text-red-600 dark:text-red-400",
    ring: "text-red-500",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-white/97 dark:bg-zinc-900/97",
    badge: "bg-amber-500 text-white",
    text: "text-amber-600 dark:text-amber-400",
    ring: "text-amber-500",
  },
  info: {
    border: "border-l-sky-500",
    bg: "bg-white/97 dark:bg-zinc-900/97",
    badge: "bg-sky-500 text-white",
    text: "text-sky-600 dark:text-sky-400",
    ring: "text-sky-500",
  },
};

const typeLabels: Record<IncidentAlertType, string> = {
  watchlist_hit: "Watchlist Match",
  unknown_restricted: "Unknown in Restricted Zone",
  behavior_fighting: "Fighting Detected",
  behavior_loitering: "Loitering Alert",
  behavior_weapon: "Weapon Detected",
  zone_breach: "Zone Breach",
  system: "System Alert",
};

const typeIcons: Record<IncidentAlertType, React.ComponentType<{ className?: string }>> = {
  watchlist_hit: Shield,
  unknown_restricted: AlertTriangle,
  behavior_fighting: AlertTriangle,
  behavior_loitering: Radio,
  behavior_weapon: AlertTriangle,
  zone_breach: AlertTriangle,
  system: AlertTriangle,
};

// ─── Countdown ring ───────────────────────────────────────────────────────────

const R = 9;
const C = 2 * Math.PI * R;

function CountdownRing({
  dismissMs,
  shownAt,
  colorClass,
}: {
  dismissMs: number;
  shownAt: number;
  colorClass: string;
}) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      const elapsed = Date.now() - shownAt;
      const progress = Math.min(1, elapsed / dismissMs);
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(C * progress);
      }
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [dismissMs, shownAt]);

  return (
    <svg
      width="22"
      height="22"
      className={`absolute top-2 right-2 -rotate-90 ${colorClass}`}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
      <circle
        ref={circleRef}
        cx="11"
        cy="11"
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={0}
      />
    </svg>
  );
}

// ─── IncidentCard ─────────────────────────────────────────────────────────────

export function IncidentCard({ alert }: { alert: IncidentAlert }) {
  const { acknowledge, dismiss, autoDismiss } = useIncidentStore();
  const navigate = useNavigate();
  const cfg = severityConfig[alert.severity];
  const Icon = typeIcons[alert.type];

  // Beep on mount for critical/warning
  useEffect(() => {
    if (alert.severity === "critical") playCriticalBeep();
    else if (alert.severity === "warning") playWarningBeep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (!isFinite(alert.autoDismissMs) || !alert.shownAt) return;
    const remaining = alert.autoDismissMs - (Date.now() - alert.shownAt);
    if (remaining <= 0) {
      autoDismiss(alert.id);
      return;
    }
    const timer = setTimeout(() => autoDismiss(alert.id), remaining);
    return () => clearTimeout(timer);
  }, [alert.id, alert.autoDismissMs, alert.shownAt, autoDismiss]);

  const handleViewCamera = () => {
    navigate(`/cameras/${alert.cameraId}`);
  };

  const timeStr = new Date(alert.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`
        relative w-[380px] rounded-xl shadow-2xl pointer-events-auto overflow-hidden
        border-l-4 ${cfg.border} ${cfg.bg}
        backdrop-blur-md
      `}
    >
      {/* Countdown ring (only for finite auto-dismiss) */}
      {isFinite(alert.autoDismissMs) && alert.shownAt && (
        <CountdownRing dismissMs={alert.autoDismissMs} shownAt={alert.shownAt} colorClass={cfg.ring} />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.text}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
          {typeLabels[alert.type]}
        </span>
        <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
          {timeStr}
        </span>
        <button
          onClick={() => dismiss(alert.id)}
          className="ml-1 p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex gap-3 px-4 pb-3">
        {/* Face thumbnail */}
        {alert.faceCropUrl ? (
          <img
            src={alert.faceCropUrl}
            alt="Face"
            className="w-16 h-16 rounded-lg object-cover ring-2 ring-white dark:ring-zinc-700 shadow flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-zinc-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
            {alert.personName ?? "Unknown person"}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
            {alert.cameraName}
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
            {alert.message}
          </div>
          {alert.behaviorLabel && (
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${cfg.badge}`}>
              {alert.behaviorLabel}
            </span>
          )}
        </div>

        {/* Severity badge */}
        <span
          className={`self-start mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${cfg.badge}`}
        >
          {alert.severity}
        </span>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 border-t border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold">
        <button
          onClick={() => acknowledge(alert.id)}
          className="flex flex-col items-center gap-1 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Ack
        </button>
        <button
          className="flex flex-col items-center gap-1 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
          onClick={() => acknowledge(alert.id)}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
          Escalate
        </button>
        <button
          onClick={handleViewCamera}
          className="flex flex-col items-center gap-1 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        <button
          className="flex flex-col items-center gap-1 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
          onClick={() => acknowledge(alert.id)}
        >
          <Radio className="w-3.5 h-3.5" />
          Dispatch
        </button>
      </div>
    </motion.div>
  );
}
