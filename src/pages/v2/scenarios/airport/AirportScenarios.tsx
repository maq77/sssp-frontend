import React, { useMemo, useState } from "react";
import gsap from "gsap";

import { ScenarioLayout } from "../../components/ScenarioLayout";
import { ScenarioHUD } from "../../components/ScenarioHUD";
import { ScenarioControls } from "../../components/ScenarioControls";

import { AirportScene } from "./components/AirportScene";
import { AirportNarrative } from "./AirportNarrative";
import { useAirportState } from "./hooks/useAirportState";

export default function AirportScenario() {
  const phase = useAirportState((s) => s.phase);
  const isPlaying = useAirportState((s) => s.isPlaying);
  const progress = useAirportState((s) => s.progress);
  const markersReady = useAirportState((s) => s.markersReady);
  const confidence = useAirportState((s) => s.matchConfidence);

  const setPlaying = useAirportState((s) => s.setPlaying);
  const setProgress = useAirportState((s) => s.setProgress);
  const resetStore = useAirportState((s) => s.reset);
  const setPOV = useAirportState((s) => s.setPOV);

  const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null);

  const metrics = useMemo(() => {
    const status =
      phase === "idle"
        ? "Ready"
        : phase === "walking"
        ? "Passenger Approaching"
        : phase === "scanning"
        ? "Scanning Face"
        : phase === "alert"
        ? "⚠️ Threat Detected"
        : phase === "responding"
        ? "Security Responding"
        : phase === "exiting"
        ? "Subject Escorted"
        : "✓ Resolved";

    const statusColor = 
      phase === "alert" ? "#ef4444" :
      phase === "scanning" ? "#f59e0b" :
      phase === "resolved" ? "#10b981" :
      "#3b82f6";

    return [
      { label: "Status", value: status, color: statusColor },
      { label: "Confidence", value: phase === "scanning" || phase === "alert" ? `${confidence}%` : "—" },
      { label: "Active Cameras", value: "2" },
      { label: "Detection Time", value: phase === "alert" || phase === "resolved" ? "0.8s" : "—" },
    ];
  }, [phase, confidence, markersReady]);

  const alerts = useMemo(() => {
    if (!markersReady) {
      return [
        {
          id: "m0",
          type: "warning" as const,
          title: "⚠️ ENVIRONMENT NOT LOADED",
          message: "Ensure your GLB file contains marker objects: EntryPoint, ScanPoint, ExitPoint, Camera_Overhead, Camera_Gate",
        },
      ];
    }
    if (phase === "alert") {
      return [
        { 
          id: "a1", 
          type: "danger" as const, 
          title: "🚨 WATCHLIST MATCH", 
          message: `High-priority subject detected. Confidence: ${confidence}%. Take immediate action.` 
        }
      ];
    }
    if (phase === "resolved") {
      return [
        { 
          id: "a2", 
          type: "success" as const, 
          title: "✓ THREAT NEUTRALIZED", 
          message: "Subject has been successfully intercepted and escorted by security personnel." 
        }
      ];
    }
    return [];
  }, [phase, markersReady, confidence]);

  const onPlay = () => {
    if (!timeline) return;
    setPlaying(true);
    setPOV("gate"); // Start with gate camera view
    timeline.play(0);
  };

  const onPause = () => {
    if (!timeline) return;
    setPlaying(false);
    timeline.pause();
  };

  const onReset = () => {
    setPlaying(false);
    setProgress(0);
    setPOV("gate");
    timeline?.pause(0);
    resetStore();
  };

  return (
    <ScenarioLayout
      title="Airport Security - Face Recognition Checkpoint"
      description="Real-time watchlist detection → Alert → Security response → Subject detained"
      onReset={onReset}
      onExit={() => (window.location.href = "/v2/scenarios/airport")}
    >
      <div className="relative">
        <AirportScene onTimeline={setTimeline} />

        <ScenarioHUD metrics={metrics} alerts={alerts} position="top-right" />

        <AirportNarrative timeline={timeline} />

        <ScenarioControls
          isPlaying={isPlaying}
          onPlay={onPlay}
          onPause={onPause}
          onReset={onReset}
          progress={progress}
        />

        {phase === "idle" && (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
            <div className="pointer-events-auto text-center space-y-6">
              <div className="text-4xl font-black tracking-tight">Airport Security Checkpoint</div>
              <div className="text-lg text-white/60 max-w-2xl mx-auto">
                Experience AI-powered face recognition as a passenger walks through security. 
                The system will detect a watchlist match and require operator intervention.
              </div>
              
              <button
                className="mt-8 rounded-2xl border border-blue-500/40 bg-blue-600/20 backdrop-blur px-8 py-4 text-lg font-bold hover:bg-blue-600/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={onPlay}
                disabled={!markersReady}
                title={!markersReady ? "Environment markers not found" : "Start Security Scenario"}
              >
                {markersReady ? "▶ Start Scenario" : "⚠️ Environment Not Ready"}
              </button>

              {!markersReady && (
                <div className="text-sm text-red-400 max-w-md mx-auto mt-4">
                  Missing required marker objects in your GLB environment file. 
                  Please ensure empties are named: EntryPoint, ScanPoint, ExitPoint, Camera_Overhead, Camera_Gate
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ScenarioLayout>
  );
}