import { motion } from "framer-motion";

interface PollutantData {
  name: string;
  value: number;
  unit: string;
  max: number;
  color: string;
  description: string;
}

interface Props {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

const REFERENCE_LIMITS: PollutantData[] = [
  { name: "PM2.5", value: 0, unit: "µg/m³", max: 150, color: "#FF7E00", description: "Fine particles" },
  { name: "PM10",  value: 0, unit: "µg/m³", max: 250, color: "#FFFF00", description: "Coarse particles" },
  { name: "NO₂",   value: 0, unit: "µg/m³", max: 400, color: "#FF0000", description: "Nitrogen dioxide" },
  { name: "SO₂",   value: 0, unit: "µg/m³", max: 200, color: "#8F3F97", description: "Sulfur dioxide" },
  { name: "CO",    value: 0, unit: "mg/m³",  max: 30,  color: "#00E400", description: "Carbon monoxide" },
  { name: "O₃",    value: 0, unit: "µg/m³", max: 200, color: "#00BFFF", description: "Ozone" },
];

export function PollutantBreakdown({ pm25, pm10, no2, so2, co, o3 }: Props) {
  const data: PollutantData[] = REFERENCE_LIMITS.map((ref, i) => ({
    ...ref,
    value: [pm25, pm10, no2, so2, co, o3][i],
  }));

  return (
    <div className="space-y-3">
      {data.map((p, i) => {
        const pct = Math.min((p.value / p.max) * 100, 100);
        const isHigh = pct > 60;
        return (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}80` }}
                />
                <span className="font-semibold text-white">{p.name}</span>
                <span className="text-zinc-500 text-xs">{p.description}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold" style={{ color: isHigh ? p.color : "rgb(161,161,170)" }}>
                  {p.value.toFixed(1)}
                </span>
                <span className="text-zinc-500 text-xs">{p.unit}</span>
                {isHigh && (
                  <span
                    className="text-[9px] px-1 py-0.5 rounded font-bold"
                    style={{ backgroundColor: p.color + "25", color: p.color }}
                  >
                    HIGH
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-white/6 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ backgroundColor: p.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.06 + 0.2, duration: 0.7, ease: "easeOut" }}
              />
              {/* Safety threshold marker at 60% */}
              <div
                className="absolute top-0 bottom-0 w-px bg-white/20"
                style={{ left: "60%" }}
              />
            </div>
          </motion.div>
        );
      })}

      <p className="text-[10px] text-zinc-600 pt-1">
        Vertical line marks 60% of WHO reference limit. Values from last sensor reading.
      </p>
    </div>
  );
}
