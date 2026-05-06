import React from "react";

export function ScenarioControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  progress,
}: {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  progress: number;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-40 w-[560px] max-w-[94vw] -translate-x-1/2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            onClick={onReset}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            Reset
          </button>

          <div className="ml-auto w-full">
            <div className="mb-1 flex items-center justify-between text-xs text-white/60">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-white/60" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
