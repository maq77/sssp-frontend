import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Wind, Thermometer, Droplets, RefreshCw, Activity, MapPin,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Cpu, Clock,
  ChevronRight, Layers
} from "lucide-react";
import { aqiApi } from "@/lib/api/aqiApi";
import { useAqiStore, selectSelectedStation, selectWorstStation } from "@/store/aqiStore";
import { AqiGauge } from "@/components/aqi/AqiGauge";
import { AqiForecastTimeline } from "@/components/aqi/AqiForecastTimeline";
import { AqiHeatmapGrid } from "@/components/aqi/AqiHeatmapGrid";
import { PollutantBreakdown } from "@/components/aqi/PollutantBreakdown";
import { SmartRecommendations } from "@/components/aqi/SmartRecommendations";
import { AqiAlertBanner } from "@/components/aqi/AqiAlertBanner";
import type { AqiForecastResponse } from "@/lib/api/aqiApi";

// ─── Demo sensor values (simulated per station) ────────────────────────────

const DEMO_SENSORS: Record<string, {
  pm25: number; pm10: number; no2: number; so2: number; co: number; o3: number;
  temperature: number; humidity: number; windSpeed: number;
}> = {
  S01: { pm25: 58, pm10: 95, no2: 85, so2: 20, co: 4.2, o3: 72, temperature: 32, humidity: 45, windSpeed: 3.5 },
  S02: { pm25: 18, pm10: 35, no2: 42, so2: 8,  co: 1.8, o3: 52, temperature: 30, humidity: 55, windSpeed: 5.2 },
  S03: { pm25: 82, pm10: 140, no2: 130, so2: 55, co: 8.5, o3: 95, temperature: 34, humidity: 38, windSpeed: 2.1 },
  S04: { pm25: 25, pm10: 48, no2: 60, so2: 12, co: 2.4, o3: 58, temperature: 31, humidity: 50, windSpeed: 4.0 },
  S05: { pm25: 95, pm10: 175, no2: 160, so2: 72, co: 12.1, o3: 110, temperature: 35, humidity: 35, windSpeed: 1.8 },
  S06: { pm25: 10, pm10: 22, no2: 28, so2: 5,  co: 0.9, o3: 38, temperature: 29, humidity: 60, windSpeed: 6.5 },
  S07: { pm25: 20, pm10: 38, no2: 45, so2: 10, co: 1.6, o3: 55, temperature: 30, humidity: 52, windSpeed: 4.8 },
  S08: { pm25: 8,  pm10: 18, no2: 22, so2: 4,  co: 0.7, o3: 32, temperature: 28, humidity: 65, windSpeed: 7.2 },
};

function getSensors(stationId: string) {
  return DEMO_SENSORS[stationId] ?? DEMO_SENSORS.S01;
}

// ─── Trend indicator ─────────────────────────────────────────────────────────

function TrendBadge({ trend, delta }: { trend: string; delta: number }) {
  const cfg = {
    worsening: { icon: TrendingUp, color: "#FF7E00", label: `↑ ${Math.abs(delta).toFixed(0)}` },
    improving: { icon: TrendingDown, color: "#00E400", label: `↓ ${Math.abs(delta).toFixed(0)}` },
    stable:    { icon: Minus,       color: "#94a3b8", label: "Stable" },
  }[trend] ?? { icon: Minus, color: "#94a3b8", label: trend };

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border"
      style={{ color: cfg.color, borderColor: cfg.color + "40", backgroundColor: cfg.color + "15" }}
    >
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Station list item ────────────────────────────────────────────────────────

function StationItem({
  station,
  isSelected,
  onClick,
}: {
  station: AqiForecastResponse;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
        isSelected
          ? "bg-white/8 border-white/15"
          : "border-transparent hover:bg-white/4 hover:border-white/8"
      }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          backgroundColor: station.currentColorHex + "25",
          color: station.currentColorHex,
          border: `1px solid ${station.currentColorHex}40`,
          boxShadow: isSelected ? `0 0 12px ${station.currentColorHex}30` : undefined,
        }}
      >
        {Math.round(station.currentAqi)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{station.stationName}</div>
        <div className="text-xs flex items-center gap-1.5 mt-0.5">
          <span style={{ color: station.currentColorHex }}>{station.currentCategory}</span>
          <TrendBadge trend={station.trend} delta={station.trendDelta} />
        </div>
      </div>

      {isSelected && <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}
    </motion.button>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  color = "text-zinc-300",
}: {
  icon: typeof Wind;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EnvironmentDashboardPage() {
  const {
    multiStationData,
    selectedStationId,
    recommendations,
    isLoading,
    alertDismissed,
    setMultiStationData,
    setSelectedStation,
    setRecommendations,
    setLoading,
    dismissAlert,
  } = useAqiStore();

  // Derive selected / worst station from store
  const selectedStation = useAqiStore(selectSelectedStation);
  const worstStation    = useAqiStore(selectWorstStation);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { refetch, isFetching } = useQuery({
    queryKey: ["aqi-demo"],
    queryFn: async () => {
      setLoading(true);
      try {
        const data = await aqiApi.getDemoData();
        setMultiStationData(data);
        if (!selectedStationId && data.stations.length > 0) {
          setSelectedStation(data.stations[0].stationId);
        }
        return data;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch recommendations whenever selected station changes
  useEffect(() => {
    if (!selectedStation) return;
    aqiApi
      .getRecommendations(
        selectedStation.currentAqi,
        selectedStation.trend,
        selectedStation.currentCategory
      )
      .then(setRecommendations)
      .catch(() => {});
  }, [selectedStation?.stationId, selectedStation?.currentAqi]);

  const sensors = selectedStation ? getSensors(selectedStation.stationId) : null;

  const stations = multiStationData?.stations ?? [];
  const sortedStations = [...stations].sort((a, b) => b.currentAqi - a.currentAqi);

  const [activeTab, setActiveTab] = useState<"forecast" | "pollutants" | "heatmap">("forecast");

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/30 to-blue-500/30 flex items-center justify-center border border-green-500/20">
              <Wind className="w-4 h-4 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Environment Dashboard</h1>
          </div>
          <p className="text-sm text-zinc-400">
            Air Quality Monitoring & Forecasting · AI-Powered Predictions · Real-Time Alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Auto-refresh 5 min</span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/6 border border-white/10
                       hover:bg-white/10 transition-all text-sm text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Alert Banner ────────────────────────────────────────────────────── */}
      <AqiAlertBanner
        worstStation={worstStation}
        dismissed={alertDismissed}
        onDismiss={dismissAlert}
      />

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5">

        {/* ── Station list (left column) ─────────────────────────────────── */}
        <div className="space-y-3">
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider px-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            Monitoring Stations ({stations.length})
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/3 p-2 space-y-1 max-h-[520px] overflow-y-auto">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse mx-1" />
                ))
              : sortedStations.map((s) => (
                  <StationItem
                    key={s.stationId}
                    station={s}
                    isSelected={s.stationId === selectedStationId}
                    onClick={() => setSelectedStation(s.stationId)}
                  />
                ))}
          </div>

          {/* City-wide summary */}
          {stations.length > 0 && (
            <motion.div
              className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                City Overview
              </div>
              {[
                { label: "Avg AQI",  value: (stations.reduce((s, x) => s + x.currentAqi, 0) / (stations.length || 1)).toFixed(0) },
                { label: "Worst",    value: `${Math.round(Math.max(...stations.map((x) => x.currentAqi)))} (${worstStation?.stationName ?? "-"})` },
                { label: "Best",     value: `${Math.round(Math.min(...stations.map((x) => x.currentAqi)))}` },
                { label: "Worsening", value: `${stations.filter((x) => x.trend === "worsening").length} stations` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {selectedStation ? (
              <motion.div
                key={selectedStation.stationId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* ── Hero card ─────────────────────────────────────────── */}
                <div
                  className="rounded-3xl border p-6 relative overflow-hidden"
                  style={{
                    borderColor: selectedStation.currentColorHex + "30",
                    background: `radial-gradient(ellipse at top left, ${selectedStation.currentColorHex}12 0%, transparent 60%),
                                 radial-gradient(ellipse at bottom right, ${selectedStation.currentColorHex}08 0%, transparent 60%),
                                 rgba(255,255,255,0.02)`,
                  }}
                >
                  {/* Animated glow */}
                  <motion.div
                    className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, ${selectedStation.currentColorHex}15 0%, transparent 70%)`,
                    }}
                    animate={{ scale: [1, 1.05, 1] }}
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
                          {selectedStation.latitude.toFixed(4)}, {selectedStation.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>

                    {/* Info panel */}
                    <div className="flex-1 min-w-0 space-y-4">
                      {/* Category + trend */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className="text-2xl font-black"
                            style={{ color: selectedStation.currentColorHex }}
                          >
                            {selectedStation.currentCategory}
                          </span>
                          <TrendBadge
                            trend={selectedStation.trend}
                            delta={selectedStation.trendDelta}
                          />
                        </div>
                        <div className="text-sm text-zinc-400">
                          Dominant pollutant:{" "}
                          <span className="text-white font-medium">
                            {selectedStation.currentDominantPollutant}
                          </span>
                          {" "}· Inference: {selectedStation.inferenceMs.toFixed(1)} ms
                        </div>
                      </div>

                      {/* Meteorological KPIs */}
                      {sensors && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <KpiCard icon={Thermometer} label="Temperature" value={sensors.temperature.toFixed(1)} unit="°C" color="text-orange-300" />
                          <KpiCard icon={Droplets}    label="Humidity"    value={sensors.humidity.toFixed(0)}    unit="%" color="text-blue-300" />
                          <KpiCard icon={Wind}        label="Wind Speed"  value={sensors.windSpeed.toFixed(1)}   unit="m/s" color="text-cyan-300" />
                          <KpiCard icon={Activity}    label="PM2.5"       value={sensors.pm25.toFixed(1)}        unit="µg/m³" color={sensors.pm25 > 35 ? "text-red-400" : "text-green-400"} />
                        </div>
                      )}

                      {/* Tabs */}
                      <div className="flex gap-1 bg-white/4 rounded-xl p-1 border border-white/6 w-fit">
                        {(["forecast", "pollutants", "heatmap"] as const).map((tab) => {
                          const labels: Record<string, string> = {
                            forecast: "Forecast",
                            pollutants: "Pollutants",
                            heatmap: "Heatmap",
                          };
                          const icons: Record<string, typeof Activity> = {
                            forecast: Activity,
                            pollutants: Layers,
                            heatmap: MapPin,
                          };
                          const Icon = icons[tab];
                          return (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab
                                  ? "bg-white/10 text-white"
                                  : "text-zinc-400 hover:text-zinc-200"
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

                {/* ── Tab content ─────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                  {activeTab === "forecast" && (
                    <motion.div
                      key="forecast"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-white/8 bg-white/3 p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <h3 className="font-semibold text-white">AQI Forecast</h3>
                        <span className="text-xs text-zinc-500">— Next 24 Hours · LSTM Model</span>
                      </div>
                      <AqiForecastTimeline
                        forecasts={selectedStation.forecasts}
                        currentAqi={selectedStation.currentAqi}
                        trend={selectedStation.trend}
                        trendDelta={selectedStation.trendDelta}
                      />
                    </motion.div>
                  )}

                  {activeTab === "pollutants" && sensors && (
                    <motion.div
                      key="pollutants"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-white/8 bg-white/3 p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <h3 className="font-semibold text-white">Pollutant Breakdown</h3>
                        <span className="text-xs text-zinc-500">— Current Reading</span>
                      </div>
                      <PollutantBreakdown
                        pm25={sensors.pm25}
                        pm10={sensors.pm10}
                        no2={sensors.no2}
                        so2={sensors.so2}
                        co={sensors.co}
                        o3={sensors.o3}
                      />
                    </motion.div>
                  )}

                  {activeTab === "heatmap" && (
                    <motion.div
                      key="heatmap"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-white/8 bg-white/3 p-5"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-semibold text-white">City Heatmap</h3>
                        <span className="text-xs text-zinc-500">— All Stations Overview</span>
                      </div>
                      <AqiHeatmapGrid
                        stations={stations}
                        selectedId={selectedStationId}
                        onSelect={setSelectedStation}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="flex flex-col items-center justify-center py-24 text-zinc-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Wind className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Select a monitoring station to view details</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Smart Recommendations ───────────────────────────────────── */}
          <div id="aqi-recommendations">
            <div className="flex items-center gap-2 mb-3 px-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-white">Smart Recommendations</h2>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20">
                <Cpu className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] text-violet-400 font-medium">AI Generated</span>
              </div>
            </div>
            <SmartRecommendations
              recommendations={recommendations}
              isLoading={isLoading}
            />
          </div>

          {/* ── All Stations Heatmap (always visible) ───────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h2 className="font-semibold text-white">City-Wide AQI Overview</h2>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <AqiHeatmapGrid
                stations={stations}
                selectedId={selectedStationId}
                onSelect={setSelectedStation}
              />
            </div>
          </div>

          {/* ── Model info footer ────────────────────────────────────────── */}
          <motion.div
            className="flex flex-wrap items-center gap-3 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Cpu className="w-3.5 h-3.5" />
              <span>AQI_v2 LSTM · 5 layers · 37 features · Seq-24</span>
            </div>
            {multiStationData && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                <Activity className="w-3.5 h-3.5" />
                <span>{multiStationData.totalInferenceMs.toFixed(1)} ms total inference</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
