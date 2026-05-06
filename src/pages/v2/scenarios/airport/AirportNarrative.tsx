import React, { useState } from "react";
import gsap from "gsap";
import { AlertPanel } from "../../components/AlertPanel";
import { useAirportState } from "./hooks/useAirportState";

export function AirportNarrative({
  timeline,
}: {
  timeline: gsap.core.Timeline | null;
}) {
  const phase = useAirportState((s) => s.phase);
  const confidence = useAirportState((s) => s.matchConfidence);
  const setPhase = useAirportState((s) => s.setPhase);
  const setProgress = useAirportState((s) => s.setProgress);
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  if (phase !== "alert") return null;

  const handleAction = (action: string) => {
    setSelectedAction(action);
    setPhase("responding");
    setProgress(80);
    
    // Add slight delay for better UX feedback
    setTimeout(() => {
      timeline?.play();
    }, 300);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-start justify-end p-6">
      <div className="pointer-events-auto animate-slideIn">
        <AlertPanel
          type="danger"
          title="🚨 WATCHLIST MATCH DETECTED"
          message={`High-priority subject identified. Face recognition confidence: ${confidence}%. Immediate action required.`}
          actions={[
            { 
              label: "🚔 Alert Security", 
              onClick: () => handleAction("alert"), 
              variant: "danger" 
            },
            { 
              label: "👁️ Manual Review", 
              onClick: () => handleAction("review"), 
              variant: "primary" 
            },
            { 
              label: "✓ False Positive", 
              onClick: () => handleAction("dismiss"), 
              variant: "secondary" 
            },
          ]}
        />
        
        {/* Additional Context Panel */}
        <div className="mt-4 rounded-xl border border-red-500/30 bg-black/60 backdrop-blur p-4 text-sm">
          <div className="text-xs text-red-400 font-semibold mb-2">THREAT ASSESSMENT</div>
          <div className="space-y-1 text-white/80">
            <div className="flex justify-between">
              <span>Match Confidence:</span>
              <span className="font-bold text-red-400">{confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span>Detection Time:</span>
              <span className="font-mono">0.8s</span>
            </div>
            <div className="flex justify-between">
              <span>Risk Level:</span>
              <span className="text-red-400 font-bold">HIGH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}