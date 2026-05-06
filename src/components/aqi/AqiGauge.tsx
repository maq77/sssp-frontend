import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// AQI band colors
const BANDS = [
  { max: 50,  label: "Good",        color: "#00E400", bg: "from-green-900/40  to-green-800/20" },
  { max: 100, label: "Moderate",    color: "#FFFF00", bg: "from-yellow-900/40 to-yellow-800/20" },
  { max: 150, label: "USG",         color: "#FF7E00", bg: "from-orange-900/40 to-orange-800/20" },
  { max: 200, label: "Unhealthy",   color: "#FF0000", bg: "from-red-900/40    to-red-800/20" },
  { max: 300, label: "Very Unhealthy", color: "#8F3F97", bg: "from-purple-900/40 to-purple-800/20" },
  { max: 500, label: "Hazardous",   color: "#7E0023", bg: "from-rose-950/60   to-rose-900/30" },
] as const;

function getBand(aqi: number) {
  return BANDS.find((b) => aqi <= b.max) ?? BANDS[BANDS.length - 1];
}

// SVG arc helpers
const cx = 120, cy = 120, r = 90;
const startAngle = -210;
const totalAngle = 240;

function polarToXY(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(fromDeg: number, toDeg: number) {
  const s = polarToXY(fromDeg);
  const e = polarToXY(toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function aqiToAngle(aqi: number) {
  const pct = Math.min(Math.max(aqi, 0), 500) / 500;
  return startAngle + pct * totalAngle;
}

// Needle component
function Needle({ angle }: { angle: number }) {
  const len = 72;
  const rad = (angle * Math.PI) / 180;
  const tip = { x: cx + len * Math.cos(rad), y: cy + len * Math.sin(rad) };
  return (
    <g>
      <line
        x1={cx} y1={cy}
        x2={tip.x} y2={tip.y}
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={6} fill="white" />
    </g>
  );
}

interface AqiGaugeProps {
  aqi: number;
  size?: number;
  showLabel?: boolean;
}

export function AqiGauge({ aqi, size = 240, showLabel = true }: AqiGaugeProps) {
  const band = getBand(aqi);
  const motionAqi = useMotionValue(0);
  useSpring(motionAqi, { stiffness: 60, damping: 18 });

  useEffect(() => {
    motionAqi.set(aqi);
  }, [aqi, motionAqi]);

  const angle = aqiToAngle(aqi);

  // Build band arcs
  const bandArcs = [
    { from: startAngle, to: startAngle + totalAngle * (50 / 500),  color: "#00E400" },
    { from: startAngle + totalAngle * (50  / 500), to: startAngle + totalAngle * (100 / 500), color: "#FFFF00" },
    { from: startAngle + totalAngle * (100 / 500), to: startAngle + totalAngle * (150 / 500), color: "#FF7E00" },
    { from: startAngle + totalAngle * (150 / 500), to: startAngle + totalAngle * (200 / 500), color: "#FF0000" },
    { from: startAngle + totalAngle * (200 / 500), to: startAngle + totalAngle * (300 / 500), color: "#8F3F97" },
    { from: startAngle + totalAngle * (300 / 500), to: startAngle + totalAngle,               color: "#7E0023" },
  ];

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg width={size} height={size * 0.88} viewBox="0 0 240 210">
        {/* Glow background */}
        <defs>
          <radialGradient id={`gaugeBg-${aqi}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={band.color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={band.color} stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={r + 20} fill={`url(#gaugeBg-${aqi})`} />

        {/* Track */}
        <path
          d={describeArc(startAngle, startAngle + totalAngle)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Band segments */}
        {bandArcs.map((seg, i) => (
          <path
            key={i}
            d={describeArc(seg.from, seg.to)}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeLinecap="butt"
            opacity="0.7"
          />
        ))}

        {/* Active progress arc */}
        <motion.path
          d={describeArc(startAngle, angle)}
          fill="none"
          stroke={band.color}
          strokeWidth="14"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Animated needle */}
        <motion.g
          initial={{ rotate: startAngle - 90, originX: cx, originY: cy }}
          animate={{ rotate: angle - 90 }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <Needle angle={0} />
        </motion.g>

        {/* Center text */}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle"
          fill="white"
          fontSize="32"
          fontWeight="700"
          fontFamily="monospace"
        >
          <motion.tspan
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Math.round(aqi)}
          </motion.tspan>
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">
          AQI
        </text>

        {/* Band label */}
        {showLabel && (
          <text x={cx} y={cy + 42} textAnchor="middle" fill={band.color} fontSize="13" fontWeight="600">
            {band.label}
          </text>
        )}

        {/* Scale ticks */}
        {[0, 50, 100, 150, 200, 300, 500].map((val) => {
          const a = aqiToAngle(val);
          const inner = polarToXY(a); // on arc
          const outer = { x: cx + (r + 18) * Math.cos((a * Math.PI) / 180), y: cy + (r + 18) * Math.sin((a * Math.PI) / 180) };
          const txtPt  = { x: cx + (r + 30) * Math.cos((a * Math.PI) / 180), y: cy + (r + 30) * Math.sin((a * Math.PI) / 180) };
          return (
            <g key={val}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <text x={txtPt.x} y={txtPt.y + 4} textAnchor="middle"
                fill="rgba(255,255,255,0.4)" fontSize="9">
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
