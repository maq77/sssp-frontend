import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, TrendingUp } from "lucide-react";
import type { AqiForecastResponse } from "@/lib/api/aqiApi";

interface Props {
  worstStation: AqiForecastResponse | null;
  dismissed: boolean;
  onDismiss: () => void;
}

export function AqiAlertBanner({ worstStation, dismissed, onDismiss }: Props) {
  if (!worstStation || dismissed) return null;

  const needsAlert =
    worstStation.currentAqi >= 151 || worstStation.trend === "worsening";

  if (!needsAlert) return null;

  const isHazardous  = worstStation.currentAqi >= 301;
  const isVeryUnhealthy = worstStation.currentAqi >= 201;

  const alertColor = isHazardous
    ? "#7E0023"
    : isVeryUnhealthy
    ? "#8F3F97"
    : "#FF0000";

  const alertBg = isHazardous
    ? "from-rose-950/80 to-rose-900/40 border-rose-800/50"
    : isVeryUnhealthy
    ? "from-purple-950/80 to-purple-900/40 border-purple-800/50"
    : "from-red-950/80 to-red-900/40 border-red-800/50";

  const title = isHazardous
    ? "⚠️ HAZARDOUS AIR QUALITY — Immediate Action Required"
    : isVeryUnhealthy
    ? "Air Quality Alert — Very Unhealthy Conditions Detected"
    : "Air Quality Warning — Unhealthy Conditions";

  return (
    <AnimatePresence>
      <motion.div
        className={`relative rounded-2xl bg-gradient-to-r ${alertBg} border p-4 overflow-hidden`}
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Animated background pulse */}
        {isHazardous && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ backgroundColor: alertColor }}
            animate={{ opacity: [0, 0.05, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        <div className="relative flex items-start gap-3">
          <motion.div
            className="shrink-0 mt-0.5"
            animate={isHazardous ? { rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.5, repeat: isHazardous ? Infinity : 0, repeatDelay: 2 }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: alertColor }} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white leading-snug">{title}</p>
            <p className="text-sm text-white/80 mt-1 leading-snug">
              <span className="font-semibold" style={{ color: worstStation.currentColorHex }}>
                {worstStation.stationName}
              </span>
              {" "}is reporting AQI of{" "}
              <span className="font-bold" style={{ color: worstStation.currentColorHex }}>
                {Math.round(worstStation.currentAqi)}
              </span>
              {" "}({worstStation.currentCategory}).
              {worstStation.trend === "worsening" && (
                <span className="inline-flex items-center gap-1 ml-2 text-red-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Worsening — expected to rise by {Math.abs(worstStation.trendDelta).toFixed(0)} pts in next 6h</span>
                </span>
              )}
            </p>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              <button
                className="text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all hover:opacity-80"
                style={{
                  backgroundColor: alertColor + "25",
                  borderColor: alertColor + "50",
                  color: alertColor === "#7E0023" ? "#ff6b80" : alertColor,
                }}
                onClick={() =>
                  document
                    .getElementById("aqi-recommendations")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                View Recommendations
              </button>
              <button
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-white/60 border border-white/10
                           hover:bg-white/5 transition-all"
                onClick={() =>
                  document
                    .getElementById("aqi-incidents")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                View Incidents
              </button>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded-lg hover:bg-white/8 transition-colors text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
