import { motion } from "framer-motion";
import type { AqiHorizonPrediction } from "@/lib/api/aqiApi";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  forecasts: AqiHorizonPrediction[];
  currentAqi: number;
  trend: string;
  trendDelta: number;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "worsening") return <TrendingUp className="w-4 h-4 text-red-400" />;
  if (trend === "improving") return <TrendingDown className="w-4 h-4 text-green-400" />;
  return <Minus className="w-4 h-4 text-zinc-400" />;
}

const HOUR_LABELS: Record<number, string> = {
  1: "1 Hour",
  3: "3 Hours",
  6: "6 Hours",
  12: "12 Hours",
  24: "24 Hours",
};

export function AqiForecastTimeline({ forecasts, currentAqi, trend, trendDelta }: Props) {
  const maxAqi = Math.max(currentAqi, ...forecasts.map((f) => f.aqi), 1);

  return (
    <div className="space-y-3">
      {/* Trend summary */}
      <div className="flex items-center gap-2 px-1">
        <TrendIcon trend={trend} />
        <span className="text-sm text-zinc-300 font-medium">
          {trend === "worsening"
            ? `AQI expected to rise by ${Math.abs(trendDelta).toFixed(0)} over 6h`
            : trend === "improving"
            ? `AQI expected to drop by ${Math.abs(trendDelta).toFixed(0)} over 6h`
            : "AQI stable over next 6 hours"}
        </span>
      </div>

      {/* Forecast cards */}
      <div className="grid grid-cols-5 gap-2">
        {forecasts.map((f, i) => {
          const heightPct = (f.aqi / maxAqi) * 100;
          const isWorst = f.aqi === Math.max(...forecasts.map((x) => x.aqi));
          return (
            <motion.div
              key={f.horizonHours}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`
                relative flex flex-col items-center gap-2 rounded-2xl p-3 border
                ${isWorst ? "border-opacity-60" : "border-white/8"}
                bg-white/4 backdrop-blur-sm hover:bg-white/8 transition-all cursor-default
              `}
              style={{
                borderColor: isWorst ? f.colorHex + "60" : undefined,
                boxShadow: isWorst ? `0 0 20px ${f.colorHex}25` : undefined,
              }}
            >
              {/* Hour label */}
              <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                {HOUR_LABELS[f.horizonHours] ?? `${f.horizonHours}h`}
              </span>

              {/* Bar chart */}
              <div className="w-full h-16 flex items-end justify-center">
                <motion.div
                  className="w-5 rounded-t-sm"
                  style={{ backgroundColor: f.colorHex + "cc" }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, 8)}%` }}
                  transition={{ delay: i * 0.07 + 0.2, duration: 0.6, ease: "easeOut" }}
                />
              </div>

              {/* AQI value */}
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: f.colorHex }}
              >
                {Math.round(f.aqi)}
              </span>

              {/* Category badge */}
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: f.colorHex + "25",
                  color: f.colorHex,
                  border: `1px solid ${f.colorHex}40`,
                }}
              >
                {f.categoryShort}
              </span>

              {/* Confidence */}
              <div className="w-full bg-white/8 rounded-full h-1">
                <motion.div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: f.colorHex }}
                  initial={{ width: 0 }}
                  animate={{ width: `${f.confidence * 100}%` }}
                  transition={{ delay: i * 0.07 + 0.4, duration: 0.5 }}
                />
              </div>
              <span className="text-[9px] text-zinc-500">
                {(f.confidence * 100).toFixed(0)}% conf.
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* AQI scale legend */}
      <div className="flex items-center gap-1 flex-wrap pt-1">
        {[
          { label: "Good", color: "#00E400" },
          { label: "Moderate", color: "#FFFF00" },
          { label: "USG", color: "#FF7E00" },
          { label: "Unhealthy", color: "#FF0000" },
          { label: "Very Unhealthy", color: "#8F3F97" },
          { label: "Hazardous", color: "#7E0023" },
        ].map((b) => (
          <span
            key={b.label}
            className="text-[9px] px-1.5 py-0.5 rounded-full border"
            style={{ color: b.color, borderColor: b.color + "40", backgroundColor: b.color + "15" }}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
