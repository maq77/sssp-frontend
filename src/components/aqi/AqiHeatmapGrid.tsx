import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { AqiForecastResponse } from "@/lib/api/aqiApi";
import { MapPin, Zap } from "lucide-react";

interface Props {
  stations: AqiForecastResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Egypt monitoring station positions (normalized 0-1, approximates real geography)
// NW corner = Alexandria, center = Cairo, E = Admin Capital, NE = Zagazig
const GRID_POSITIONS: Record<string, { x: number; y: number }> = {
  S01: { x: 0.43, y: 0.50 }, // Cairo Downtown
  S02: { x: 0.37, y: 0.52 }, // Cairo Giza
  S03: { x: 0.44, y: 0.67 }, // Cairo Helwan Industrial (south)
  S04: { x: 0.40, y: 0.60 }, // Cairo Maadi
  S05: { x: 0.74, y: 0.49 }, // New Administrative Capital (east)
  S06: { x: 0.13, y: 0.17 }, // Alexandria Corniche (NW)
  S07: { x: 0.20, y: 0.27 }, // Alexandria Industrial
  S08: { x: 0.55, y: 0.23 }, // Zagazig (NE of Cairo)
};

function getHexOpacity(aqi: number): string {
  const pct = Math.min(aqi / 300, 1);
  const opacity = Math.round(15 + pct * 50).toString(16).padStart(2, "0");
  return opacity;
}

export function AqiHeatmapGrid({ stations, selectedId, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full" style={{ paddingBottom: "62%" }}>
      {/* City background */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/8">
        {/* Grid lines - city streets simulation */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="city-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="rgb(15,23,42)" />
              <stop offset="100%" stopColor="rgb(9,13,27)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapBg)" />
          <rect width="100%" height="100%" fill="url(#city-grid)" />

          {/* Geographic reference lines — approximate Egyptian road/river grid */}
          <line x1="0" y1="48%" x2="100%" y2="48%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="62%" x2="100%" y2="62%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="40%" y1="0" x2="40%" y2="100%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="62%" y1="0" x2="62%" y2="100%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="75%" y1="0" x2="75%" y2="100%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          {/* Nile River (diagonal NE to SW) */}
          <path d="M 38% 0 Q 41% 35% 40% 52% Q 39% 68% 37% 100%"
            fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="3" strokeLinecap="round" />
          {/* City region labels */}
          <text x="13%" y="10%" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="8" fontWeight="600">ALEX</text>
          <text x="41%" y="44%" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="8" fontWeight="600">CAIRO</text>
          <text x="75%" y="43%" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="7" fontWeight="600">ADMIN CAP</text>
          <text x="56%" y="17%" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="8" fontWeight="600">ZAGAZIG</text>
        </svg>

        {/* AQI halo blobs */}
        {stations.map((station) => {
          const pos = GRID_POSITIONS[station.stationId] ?? { x: 0.5, y: 0.5 };
          const isSelected = station.stationId === selectedId;
          const radius = 60 + (station.currentAqi / 500) * 100;
          return (
            <motion.div
              key={station.stationId}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                width: radius * 2,
                height: radius * 2,
                marginLeft: -radius,
                marginTop: -radius,
                background: `radial-gradient(circle, ${station.currentColorHex}${getHexOpacity(station.currentAqi)} 0%, transparent 70%)`,
              }}
              animate={{
                scale: isSelected ? [1, 1.08, 1] : 1,
              }}
              transition={{ duration: 2, repeat: isSelected ? Infinity : 0 }}
            />
          );
        })}

        {/* Station markers */}
        {stations.map((station, i) => {
          const pos = GRID_POSITIONS[station.stationId] ?? { x: 0.5, y: 0.5 };
          const isSelected = station.stationId === selectedId;
          const isHovered = station.stationId === hovered;

          return (
            <motion.button
              key={station.stationId}
              className="absolute flex flex-col items-center cursor-pointer"
              style={{
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isSelected || isHovered ? 20 : 10,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onSelect(station.stationId)}
              onMouseEnter={() => setHovered(station.stationId)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Pulse ring for active */}
              {isSelected && (
                <motion.div
                  className="absolute rounded-full border-2"
                  style={{ borderColor: station.currentColorHex }}
                  animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  initial={{ width: 28, height: 28, marginLeft: -14, marginTop: -14 }}
                />
              )}

              {/* Marker pin */}
              <motion.div
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: station.currentColorHex + "cc",
                  borderColor: station.currentColorHex,
                  boxShadow: `0 0 ${isSelected ? 20 : 10}px ${station.currentColorHex}60`,
                }}
                animate={{ scale: isSelected ? 1.2 : isHovered ? 1.1 : 1 }}
              >
                {isSelected ? (
                  <Zap className="w-3.5 h-3.5 text-white" />
                ) : (
                  <MapPin className="w-3 h-3 text-white" />
                )}
              </motion.div>

              {/* AQI badge */}
              <motion.div
                className="mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap"
                style={{
                  backgroundColor: station.currentColorHex + "30",
                  color: station.currentColorHex,
                  border: `1px solid ${station.currentColorHex}50`,
                  backdropFilter: "blur(8px)",
                }}
                animate={{ opacity: isHovered || isSelected ? 1 : 0.7 }}
              >
                {Math.round(station.currentAqi)}
              </motion.div>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    className="absolute bottom-full mb-2 px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap
                               bg-zinc-900/95 border border-white/10 shadow-xl backdrop-blur-sm pointer-events-none"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    style={{ minWidth: 140 }}
                  >
                    <div className="font-semibold text-white mb-0.5">{station.stationName}</div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: station.currentColorHex }}
                      />
                      <span style={{ color: station.currentColorHex }}>
                        AQI {Math.round(station.currentAqi)} · {station.currentCategory}
                      </span>
                    </div>
                    <div className="text-zinc-400 mt-0.5">
                      {station.trend === "worsening" ? "↑ Worsening" :
                       station.trend === "improving" ? "↓ Improving" : "→ Stable"}
                      {" "}{Math.abs(station.trendDelta).toFixed(0)} pts/6h
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex gap-1.5 items-center">
          {[
            { label: "Good", color: "#00E400" },
            { label: "Moderate", color: "#FFFF00" },
            { label: "USG", color: "#FF7E00" },
            { label: "Unhealthy", color: "#FF0000" },
            { label: "V. Unhealthy", color: "#8F3F97" },
            { label: "Hazardous", color: "#7E0023" },
          ].map((b) => (
            <span
              key={b.label}
              className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium"
              style={{ color: b.color, borderColor: b.color + "50", backgroundColor: b.color + "15" }}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
