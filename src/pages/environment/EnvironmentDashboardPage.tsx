import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wind, Thermometer, Droplets, RefreshCw, Activity, MapPin,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Cpu, Clock,
  ChevronRight, Layers, Radio,
} from "lucide-react";
import { useAqiStore } from "@/store/aqiStore";
import { AqiGauge } from "@/components/aqi/AqiGauge";
import { AqiForecastTimeline } from "@/components/aqi/AqiForecastTimeline";
import { AqiHeatmapGrid } from "@/components/aqi/AqiHeatmapGrid";
import { PollutantBreakdown } from "@/components/aqi/PollutantBreakdown";
import { SmartRecommendations } from "@/components/aqi/SmartRecommendations";
import { AqiAlertBanner } from "@/components/aqi/AqiAlertBanner";
import type { AqiForecastResponse, AqiRecommendations } from "@/lib/api/aqiApi";

// ─── AQI band lookup ─────────────────────────────────────────────────────────

function getAqiBand(aqi: number) {
  if (aqi <= 50)  return { category: "Good",                           categoryShort: "Good",      colorHex: "#00E400", colorR: 0,   colorG: 228, colorB: 0   };
  if (aqi <= 100) return { category: "Moderate",                       categoryShort: "Mod",       colorHex: "#FFFF00", colorR: 255, colorG: 255, colorB: 0   };
  if (aqi <= 150) return { category: "Unhealthy for Sensitive Groups", categoryShort: "USG",       colorHex: "#FF7E00", colorR: 255, colorG: 126, colorB: 0   };
  if (aqi <= 200) return { category: "Unhealthy",                      categoryShort: "Unhealthy", colorHex: "#FF0000", colorR: 255, colorG: 0,   colorB: 0   };
  if (aqi <= 300) return { category: "Very Unhealthy",                 categoryShort: "V.Unhealthy",colorHex: "#8F3F97", colorR: 143, colorG: 63, colorB: 151 };
  return               { category: "Hazardous",                        categoryShort: "Hazard",    colorHex: "#7E0023", colorR: 126, colorG: 0,   colorB: 35  };
}

// ─── Static Egyptian station data ────────────────────────────────────────────

const NOW_MS = Date.now();

function fc(h: number, aqi: number, dp: string, conf: number) {
  const b = getAqiBand(aqi);
  return { horizonHours: h, aqi, category: b.category, categoryShort: b.categoryShort,
    colorHex: b.colorHex, colorR: b.colorR, colorG: b.colorG, colorB: b.colorB,
    dominantPollutant: dp, confidence: conf, predictedAtMs: NOW_MS + h * 3_600_000 };
}

function mkStation(
  stationId: string, stationName: string, lat: number, lon: number,
  aqi: number, dp: string,
  trend: "improving" | "worsening" | "stable", delta: number,
  fa: [number,number,number,number,number], fc_: [number,number,number,number,number],
  ms: number,
): AqiForecastResponse {
  const b = getAqiBand(aqi);
  return {
    success: true, stationId, stationName, latitude: lat, longitude: lon,
    currentAqi: aqi, currentCategory: b.category, currentColorHex: b.colorHex,
    currentDominantPollutant: dp, trend, trendDelta: delta, inferenceMs: ms,
    forecasts: [1,3,6,12,24].map((h,i) => fc(h, fa[i], dp, fc_[i])),
  };
}

const BASE_STATIONS: AqiForecastResponse[] = [
  mkStation("S01","Cairo — Downtown",        30.0511,31.2357, 178,"PM2.5",  "worsening", 18, [185,195,188,172,158],[.89,.85,.80,.74,.68],12.4),
  mkStation("S02","Cairo — Giza",            30.0131,31.2089, 165,"PM2.5",  "worsening", 14, [170,175,168,158,145],[.88,.82,.76,.70,.62],11.8),
  mkStation("S03","Cairo — Helwan Industrial",29.8480,31.3342,212,"SO₂",   "worsening", 28, [218,228,222,208,195],[.91,.87,.82,.76,.70],13.2),
  mkStation("S04","Cairo — Maadi",           29.9600,31.2500, 142,"PM10",   "stable",      5, [145,148,144,138,130],[.87,.83,.78,.72,.65],10.9),
  mkStation("S05","New Administrative Capital",30.0173,31.7484,67,"O₃",    "improving",  -8, [65,62,60,63,68],    [.93,.89,.84,.78,.70], 8.5),
  mkStation("S06","Alexandria — Corniche",   31.2001,29.9187, 102,"NO₂",   "stable",      3, [98,95,108,112,98],  [.90,.86,.80,.74,.67], 9.8),
  mkStation("S07","Alexandria — Industrial", 31.1656,29.9553, 138,"PM10",   "worsening", 16, [142,148,145,135,125],[.88,.83,.77,.71,.64],11.2),
  mkStation("S08","Zagazig — City Center",   30.5877,31.5021, 156,"PM10",   "worsening", 22, [165,172,168,155,145],[.87,.82,.76,.69,.61],10.5),
];

const SENSORS: Record<string,{pm25:number;pm10:number;no2:number;so2:number;co:number;o3:number;temperature:number;humidity:number;windSpeed:number}> = {
  S01:{ pm25:88,  pm10:145, no2:168, so2:52, co:7.8,  o3:88, temperature:33, humidity:42, windSpeed:2.8 },
  S02:{ pm25:78,  pm10:128, no2:148, so2:42, co:6.5,  o3:95, temperature:34, humidity:40, windSpeed:3.2 },
  S03:{ pm25:118, pm10:198, no2:210, so2:85, co:12.5, o3:78, temperature:35, humidity:38, windSpeed:1.8 },
  S04:{ pm25:62,  pm10:108, no2:118, so2:28, co:4.2,  o3:72, temperature:32, humidity:45, windSpeed:3.8 },
  S05:{ pm25:18,  pm10:32,  no2:28,  so2:8,  co:1.2,  o3:62, temperature:32, humidity:38, windSpeed:4.5 },
  S06:{ pm25:38,  pm10:72,  no2:110, so2:22, co:3.8,  o3:82, temperature:28, humidity:68, windSpeed:6.2 },
  S07:{ pm25:58,  pm10:115, no2:142, so2:48, co:5.8,  o3:68, temperature:30, humidity:62, windSpeed:4.8 },
  S08:{ pm25:72,  pm10:155, no2:95,  so2:45, co:6.5,  o3:88, temperature:31, humidity:52, windSpeed:3.2 },
};

// ─── City groups ──────────────────────────────────────────────────────────────

const CITIES = [
  { id:"all",      label:"All Cities",          arabic:"",               ids:["S01","S02","S03","S04","S05","S06","S07","S08"] },
  { id:"cairo",    label:"Cairo",               arabic:"القاهرة",        ids:["S01","S02","S03","S04"] },
  { id:"admincap", label:"Admin. Capital",      arabic:"العاصمة الإدارية",ids:["S05"] },
  { id:"alex",     label:"Alexandria",          arabic:"الإسكندرية",     ids:["S06","S07"] },
  { id:"zagazig",  label:"Zagazig",             arabic:"الزقازيق",       ids:["S08"] },
] as const;

// ─── Egypt-specific smart recommendations ────────────────────────────────────

function buildRecommendations(aqi: number, category: string, trend: string, sid: string): AqiRecommendations {
  const sensors = SENSORS[sid] ?? SENSORS.S01;
  const whoRatio = (sensors.pm25 / 15).toFixed(1);
  const vu = aqi > 200;
  const u  = aqi > 150;
  return {
    currentAqi: aqi, category, trend,
    generatedAt: new Date().toISOString(),
    governmentPolicies: [
      {
        priority: vu ? "critical" : "high",
        domain: "transport",
        action: vu
          ? "Enforce odd-even vehicle restrictions across Cairo Ring Road and 6th October corridor immediately"
          : "Issue advisory to reduce non-essential private vehicle use during 07:00–10:00 peak hours",
        rationale: "Traffic contributes 48% of PM2.5 in central Cairo; odd-even restrictions reduce peak-hour emissions by 25%",
      },
      {
        priority: vu ? "critical" : u ? "high" : "medium",
        domain: "industry",
        action: vu
          ? "Order temporary partial shutdown of Helwan Industrial Zone — steel mills & cement factories"
          : "Issue 12-hour emission reduction mandate to industrial facilities in Helwan & 6th October City",
        rationale: "Helwan facilities account for 38% of Cairo SO₂ and 22% of PM10 total annual load",
      },
      {
        priority: u ? "high" : "medium",
        domain: "health",
        action: "Activate emergency respiratory triage protocols at public hospitals in Greater Cairo",
        rationale: "Pre-position ventilators and O₂ supplies at Kasr El Aini, El Demerdash, and Ain Shams hospitals",
      },
      {
        priority: u ? "high" : "medium",
        domain: "education",
        action: u
          ? "Issue 2-hour delayed school start for Greater Cairo governorate (affects 4.2M students)"
          : "Alert schools to restrict outdoor physical education during morning hours",
        rationale: "Peak pollution window is 07:00–09:00 due to morning traffic + cooler stable air trapping emissions near ground level",
      },
      {
        priority: "medium",
        domain: "agriculture",
        action: "Ban crop-residue burning in Qalyubia, Giza, and Beheira governorates for next 72 hours",
        rationale: "Agricultural burning adds 15% additional PM2.5 during Khamsin season (April–May); penalty framework activation advised",
      },
    ],
    citizenAdvisories: [
      {
        icon: "😷", group: "general",
        advisory: "Wear N95 / KN95 respirators outdoors at all times",
        detail: `PM2.5 currently ${sensors.pm25} µg/m³ — ${whoRatio}× WHO 24h guideline of 15 µg/m³. Surgical masks provide insufficient filtration.`,
      },
      {
        icon: "🏃", group: "sensitive",
        advisory: "Cancel all outdoor exercise — switch to indoor only",
        detail: "Physical exertion increases lung exposure 3–5× through elevated respiration. Asthma/COPD patients should carry rescue inhalers.",
      },
      {
        icon: "👶", group: "children",
        advisory: "Keep children indoors; close windows and run HEPA purifiers",
        detail: "Children's developing lungs are 3× more sensitive to PM2.5. Schools should move PE classes indoors and seal window gaps.",
      },
      {
        icon: "🏥", group: "elderly",
        advisory: "Avoid non-essential outdoor travel — stay home with ventilation off",
        detail: "Individuals 60+ with cardiovascular or pulmonary conditions face elevated hospitalization risk at these AQI levels.",
      },
    ],
  };
}

// ─── Small reusable sub-components ───────────────────────────────────────────

function TrendBadge({ trend, delta }: { trend: string; delta: number }) {
  const cfg = {
    worsening: { icon: TrendingUp,   color: "#FF7E00", label: `↑ ${Math.abs(delta).toFixed(0)}` },
    improving: { icon: TrendingDown, color: "#00E400", label: `↓ ${Math.abs(delta).toFixed(0)}` },
    stable:    { icon: Minus,        color: "#94a3b8", label: "Stable" },
  }[trend] ?? { icon: Minus, color: "#94a3b8", label: trend };
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border"
      style={{ color: cfg.color, borderColor: cfg.color+"40", backgroundColor: cfg.color+"15" }}>
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, unit, color = "text-zinc-300" }: {
  icon: typeof Wind; label: string; value: string | number; unit?: string; color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-2xl bg-white/4 border border-white/8">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold font-mono ${color}`}>{value}</span>
        {unit && <span className="text-xs text-zinc-500">{unit}</span>}
      </div>
    </div>
  );
}

// Mini circular AQI ring for city overview cards
function MiniRing({ aqi, color, size = 76 }: { aqi: number; color: string; size?: number }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(aqi, 0), 300) / 300;
  const dash = pct * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth="6" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={Math.round(aqi)}
          className="text-base font-bold font-mono text-white leading-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(aqi)}
        </motion.span>
        <span className="text-[9px] text-zinc-500">AQI</span>
      </div>
    </div>
  );
}

// City overview card (top row)
function CityCard({
  city, stations, onSelect, isActive, getLiveAqi,
}: {
  city: typeof CITIES[number];
  stations: AqiForecastResponse[];
  onSelect: () => void;
  isActive: boolean;
  getLiveAqi: (s: AqiForecastResponse) => number;
}) {
  if (city.id === "all") return null;
  const cityStations = stations.filter(s => (city.ids as readonly string[]).includes(s.stationId));
  if (!cityStations.length) return null;
  const liveAqis = cityStations.map(getLiveAqi);
  const avgAqi = liveAqis.reduce((a, b) => a + b, 0) / liveAqis.length;
  const maxAqi = Math.max(...liveAqis);
  const worsening = cityStations.filter(s => s.trend === "worsening").length;
  const band = getAqiBand(maxAqi);

  return (
    <motion.button
      onClick={onSelect}
      className={`flex-1 min-w-[140px] flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
        isActive ? "bg-white/8 border-white/20" : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/14"
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={isActive ? { boxShadow: `0 0 30px ${band.colorHex}20` } : undefined}
    >
      {/* glow blob */}
      <motion.div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${band.colorHex}18 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      />
      {/* pulse ring for worsening */}
      {worsening > 0 && (
        <motion.div
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ backgroundColor: band.colorHex }}
          animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}

      <div className="relative flex items-start gap-3">
        <MiniRing aqi={avgAqi} color={band.colorHex} size={72} />
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-xs font-bold text-white truncate">{city.label}</div>
          {city.arabic && (
            <div className="text-[10px] text-zinc-500 font-medium" dir="rtl">{city.arabic}</div>
          )}
          <div
            className="text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded-full w-fit"
            style={{ backgroundColor: band.colorHex+"20", color: band.colorHex }}
          >
            {band.categoryShort}
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between text-[10px] text-zinc-500">
        <span>{cityStations.length} station{cityStations.length > 1 ? "s" : ""}</span>
        {worsening > 0 && (
          <span className="flex items-center gap-0.5 text-orange-400">
            <TrendingUp className="w-3 h-3" />{worsening} worsening
          </span>
        )}
        {worsening === 0 && (
          <span className="flex items-center gap-0.5 text-green-400">
            <TrendingDown className="w-3 h-3" />Improving
          </span>
        )}
      </div>
    </motion.button>
  );
}

// Station list item
function StationItem({ station, liveAqi, isSelected, onClick }: {
  station: AqiForecastResponse; liveAqi: number; isSelected: boolean; onClick: () => void;
}) {
  const band = getAqiBand(liveAqi);
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
        isSelected ? "bg-white/8 border-white/15" : "border-transparent hover:bg-white/4 hover:border-white/8"
      }`}
      whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          backgroundColor: band.colorHex+"25", color: band.colorHex,
          border: `1px solid ${band.colorHex}40`,
          boxShadow: isSelected ? `0 0 12px ${band.colorHex}30` : undefined,
        }}
      >
        {Math.round(liveAqi)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{station.stationName}</div>
        <div className="text-xs flex items-center gap-1.5 mt-0.5">
          <span style={{ color: band.colorHex }}>{band.categoryShort}</span>
          <TrendBadge trend={station.trend} delta={station.trendDelta} />
        </div>
      </div>
      {isSelected && <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}
    </motion.button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EnvironmentDashboardPage() {
  const { selectedStationId, alertDismissed, setSelectedStation, dismissAlert } = useAqiStore();

  // Live fluctuating AQI deltas (±12 random walk, updates every 3.8s)
  const [liveDeltas, setLiveDeltas] = useState<Record<string, number>>(() =>
    Object.fromEntries(BASE_STATIONS.map(s => [s.stationId, 0]))
  );
  const [liveTime, setLiveTime] = useState(new Date());
  const [activeCity, setActiveCity] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"forecast" | "pollutants" | "heatmap">("forecast");
  const [refreshKey, setRefreshKey] = useState(0);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // AQI live fluctuation
  useEffect(() => {
    const t = setInterval(() => {
      setLiveDeltas(prev => {
        const next = { ...prev };
        BASE_STATIONS.forEach(s => {
          const cur = prev[s.stationId] ?? 0;
          const bias = s.trend === "worsening" ? 0.55 : s.trend === "improving" ? 0.45 : 0.5;
          const step = (Math.random() - bias) * 5.5;
          next[s.stationId] = Math.max(-14, Math.min(14, cur + step));
        });
        return next;
      });
    }, 3800);
    return () => clearInterval(t);
  }, []);

  const getLiveAqi = useCallback((station: AqiForecastResponse): number => {
    const d = liveDeltas[station.stationId] ?? 0;
    return Math.max(0, Math.min(500, station.currentAqi + d));
  }, [liveDeltas]);

  // Derive live station objects (keep all fields, just update currentAqi + color)
  const liveStations: AqiForecastResponse[] = BASE_STATIONS.map(s => {
    const liveAqi = getLiveAqi(s);
    const band = getAqiBand(liveAqi);
    return { ...s, currentAqi: liveAqi, currentCategory: band.category, currentColorHex: band.colorHex };
  });

  // Select first station on mount
  useEffect(() => {
    if (!selectedStationId) setSelectedStation("S01");
  }, []);

  // Filter stations by active city
  const filteredStationIds = CITIES.find(c => c.id === activeCity)?.ids as readonly string[] ?? liveStations.map(s => s.stationId);
  const visibleStations = liveStations.filter(s => (filteredStationIds as string[]).includes(s.stationId));
  const sortedStations = [...visibleStations].sort((a, b) => b.currentAqi - a.currentAqi);

  const selectedStation = liveStations.find(s => s.stationId === selectedStationId) ?? liveStations[0];
  const worstStation = [...liveStations].sort((a, b) => b.currentAqi - a.currentAqi)[0];
  const sensors = SENSORS[selectedStation?.stationId ?? "S01"];

  const recommendations = selectedStation
    ? buildRecommendations(selectedStation.currentAqi, selectedStation.currentCategory, selectedStation.trend, selectedStation.stationId)
    : null;

  const totalInferenceMs = liveStations.reduce((s, x) => s + x.inferenceMs, 0);

  const handleRefresh = () => {
    setLiveDeltas(Object.fromEntries(BASE_STATIONS.map(s => [s.stationId, (Math.random()-0.5)*6])));
    setRefreshKey(k => k+1);
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/30 to-blue-500/30 flex items-center justify-center border border-green-500/20">
              <Wind className="w-4 h-4 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Environment Dashboard</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-red-400"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span className="text-[10px] text-red-400 font-bold tracking-wide">LIVE</span>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Air Quality Monitoring &amp; AI Forecasting · Egypt Multi-City Network · 8 Active Stations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{liveTime.toLocaleTimeString("en-EG", { hour12: false })}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Auto-refresh 3.8s</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/6 border border-white/10
                       hover:bg-white/10 transition-all text-sm text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Khamsin season context banner ──────────────────────────────────── */}
      <motion.div
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      >
        <span className="text-lg">🌪️</span>
        <div className="flex-1 text-zinc-300">
          <span className="font-semibold text-amber-400">Khamsin Season Active</span>
          {" "}(April–May) — Elevated desert dust particulates expected across all Egyptian regions.
          Cairo and Delta cities most affected. PM10 levels {">"}2× seasonal baseline.
        </div>
        <div className="shrink-0 text-xs text-zinc-500">May 2026</div>
      </motion.div>

      {/* ── AQI Alert Banner ───────────────────────────────────────────────── */}
      <AqiAlertBanner
        worstStation={worstStation}
        dismissed={alertDismissed}
        onDismiss={dismissAlert}
      />

      {/* ── 4 City Overview Cards ──────────────────────────────────────────── */}
      <motion.div
        className="flex gap-3 overflow-x-auto pb-1"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      >
        {CITIES.filter(c => c.id !== "all").map((city) => (
          <CityCard
            key={city.id}
            city={city}
            stations={liveStations}
            isActive={activeCity === city.id}
            onSelect={() => {
              setActiveCity(city.id === activeCity ? "all" : city.id);
              const firstId = city.ids[0];
              if (firstId) setSelectedStation(firstId);
            }}
            getLiveAqi={getLiveAqi}
          />
        ))}
      </motion.div>

      {/* ── City filter tabs ───────────────────────────────────────────────── */}
      <motion.div
        className="flex gap-1 bg-white/3 rounded-xl p-1 border border-white/6 w-fit"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      >
        {CITIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveCity(c.id);
              if (c.id !== "all") {
                const firstId = c.ids[0];
                if (firstId) setSelectedStation(firstId);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCity === c.id ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </motion.div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[270px_1fr] gap-5">

        {/* ── Station list ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider px-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            Monitoring Stations ({visibleStations.length})
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/3 p-2 space-y-1 max-h-[520px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {sortedStations.map(s => (
                <motion.div
                  key={s.stationId}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                >
                  <StationItem
                    station={s}
                    liveAqi={getLiveAqi(s)}
                    isSelected={s.stationId === selectedStationId}
                    onClick={() => setSelectedStation(s.stationId)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* City-wide summary */}
          <motion.div
            className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Egypt Overview</div>
            {[
              { label: "Network Avg AQI",  value: (liveStations.reduce((s,x)=>s+x.currentAqi,0)/liveStations.length).toFixed(0) },
              { label: "Worst Station",    value: `${Math.round(worstStation?.currentAqi ?? 0)} (${worstStation?.stationName?.split(" — ")[1] ?? worstStation?.stationName ?? "-"})` },
              { label: "Best Station",     value: `${Math.round(Math.min(...liveStations.map(x=>x.currentAqi)))} (Admin Capital)` },
              { label: "Worsening",        value: `${liveStations.filter(x=>x.trend==="worsening").length} / ${liveStations.length} stations` },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{item.label}</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {selectedStation && (
              <motion.div
                key={selectedStation.stationId + refreshKey}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* ── Hero card ─────────────────────────────────────────── */}
                <div
                  className="rounded-3xl border p-6 relative overflow-hidden"
                  style={{
                    borderColor: selectedStation.currentColorHex+"30",
                    background: `radial-gradient(ellipse at top left, ${selectedStation.currentColorHex}12 0%, transparent 60%),
                                 radial-gradient(ellipse at bottom right, ${selectedStation.currentColorHex}08 0%, transparent 60%),
                                 rgba(255,255,255,0.02)`,
                  }}
                >
                  <motion.div
                    className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${selectedStation.currentColorHex}15 0%, transparent 70%)` }}
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />

                  <div className="relative flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start">
                    {/* Gauge */}
                    <div className="shrink-0 flex flex-col items-center">
                      <AqiGauge aqi={selectedStation.currentAqi} size={220} />
                      <div className="text-center mt-1">
                        <div className="font-semibold text-white">{selectedStation.stationName}</div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1 justify-center">
                          <MapPin className="w-3 h-3" />
                          {selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E
                        </div>
                      </div>
                    </div>

                    {/* Info panel */}
                    <div className="flex-1 min-w-0 space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-2xl font-black" style={{ color: selectedStation.currentColorHex }}>
                            {selectedStation.currentCategory}
                          </span>
                          <TrendBadge trend={selectedStation.trend} delta={selectedStation.trendDelta} />
                        </div>
                        <div className="text-sm text-zinc-400">
                          Dominant: <span className="text-white font-medium">{selectedStation.currentDominantPollutant}</span>
                          {" · "}Inference: {selectedStation.inferenceMs.toFixed(1)} ms
                          {" · "}Updated: <span className="font-mono text-zinc-300">{liveTime.toLocaleTimeString("en-EG",{hour12:false})}</span>
                        </div>
                      </div>

                      {/* Weather KPIs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <KpiCard icon={Thermometer} label="Temperature" value={sensors.temperature.toFixed(1)} unit="°C" color="text-orange-300" />
                        <KpiCard icon={Droplets}    label="Humidity"    value={sensors.humidity.toFixed(0)}    unit="%"   color="text-blue-300" />
                        <KpiCard icon={Wind}        label="Wind"        value={sensors.windSpeed.toFixed(1)}   unit="m/s" color="text-cyan-300" />
                        <KpiCard icon={Activity}    label="PM2.5"       value={sensors.pm25.toFixed(1)}        unit="µg/m³" color={sensors.pm25 > 35 ? "text-red-400" : "text-green-400"} />
                      </div>

                      {/* Tabs */}
                      <div className="flex gap-1 bg-white/4 rounded-xl p-1 border border-white/6 w-fit">
                        {(["forecast","pollutants","heatmap"] as const).map((tab) => {
                          const icons = { forecast: Activity, pollutants: Layers, heatmap: MapPin };
                          const labels = { forecast: "Forecast", pollutants: "Pollutants", heatmap: "Heatmap" };
                          const Icon = icons[tab];
                          return (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {labels[tab]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Tab content ───────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                  {activeTab === "forecast" && (
                    <motion.div key="forecast"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-white/8 bg-white/3 p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <h3 className="font-semibold text-white">AQI Forecast</h3>
                        <span className="text-xs text-zinc-500">— Next 24 Hours · LSTM Bi-Directional Model</span>
                      </div>
                      <AqiForecastTimeline
                        forecasts={selectedStation.forecasts}
                        currentAqi={selectedStation.currentAqi}
                        trend={selectedStation.trend}
                        trendDelta={selectedStation.trendDelta}
                      />
                    </motion.div>
                  )}

                  {activeTab === "pollutants" && (
                    <motion.div key="pollutants"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-white/8 bg-white/3 p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <h3 className="font-semibold text-white">Pollutant Breakdown</h3>
                        <span className="text-xs text-zinc-500">— Live Sensor Reading</span>
                      </div>
                      <PollutantBreakdown
                        pm25={sensors.pm25} pm10={sensors.pm10}
                        no2={sensors.no2}   so2={sensors.so2}
                        co={sensors.co}     o3={sensors.o3}
                      />
                    </motion.div>
                  )}

                  {activeTab === "heatmap" && (
                    <motion.div key="heatmap"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-white/8 bg-white/3 p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-semibold text-white">Egypt Station Heatmap</h3>
                        <span className="text-xs text-zinc-500">— All Monitoring Stations</span>
                      </div>
                      <AqiHeatmapGrid
                        stations={liveStations}
                        selectedId={selectedStationId}
                        onSelect={setSelectedStation}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Smart Recommendations ──────────────────────────────────── */}
          <div id="aqi-recommendations">
            <div className="flex items-center gap-2 mb-3 px-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-white">Smart Recommendations</h2>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20">
                <Cpu className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] text-violet-400 font-medium">AI Generated</span>
              </div>
              {selectedStation && (
                <span className="text-xs text-zinc-500 ml-1">
                  for {selectedStation.stationName}
                </span>
              )}
            </div>
            <SmartRecommendations recommendations={recommendations} isLoading={false} />
          </div>

          {/* ── City-wide heatmap ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h2 className="font-semibold text-white">Egypt — City-Wide AQI Overview</h2>
              <span className="text-xs text-zinc-500">8 monitoring stations across 4 cities</span>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <AqiHeatmapGrid
                stations={liveStations}
                selectedId={selectedStationId}
                onSelect={setSelectedStation}
              />
            </div>
          </div>

          {/* ── Model info footer ──────────────────────────────────────── */}
          <motion.div
            className="flex flex-wrap items-center gap-3 px-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Cpu className="w-3.5 h-3.5" />
              <span>AQI_v2 LSTM Bi-Directional · 5 layers · 37 features · Seq-24 · TensorRT FP16</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Activity className="w-3.5 h-3.5" />
              <span>{totalInferenceMs.toFixed(1)} ms total network inference</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <MapPin className="w-3.5 h-3.5" />
              <span>Cairo · New Administrative Capital · Alexandria · Zagazig</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
