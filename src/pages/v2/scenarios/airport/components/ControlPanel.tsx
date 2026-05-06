import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { ScenarioState } from '../config/airportConfig';

interface ControlPanelProps {
  state: ScenarioState;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function ControlPanel({ state, onPlay, onPause, onReset }: ControlPanelProps) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
      <div className="glass rounded-2xl p-4 flex items-center gap-4">
        {state === 'idle' || state === 'complete' ? (
          <button
            onClick={onPlay}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition-colors"
          >
            <Play className="w-5 h-5" />
            {state === 'complete' ? 'Play Again' : 'Start Scenario'}
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
          >
            <Pause className="w-5 h-5" />
            Pause
          </button>
        )}
        
        <button
          onClick={onReset}
          className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
          title="Reset Scenario"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}