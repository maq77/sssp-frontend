import React from "react";

export function ScenarioLayout({
  title,
  description,
  onReset,
  onExit,
  children,
}: {
  title: string;
  description: string;
  onReset: () => void;
  onExit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs text-white/60">SSSP V2 • Scenarios</div>
            <div className="truncate text-lg font-semibold">{title}</div>
            <div className="truncate text-xs text-white/60">{description}</div>
          </div>

          <div className="flex items-center gap-2">
            {onExit && (
              <button
                onClick={onExit}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Exit
              </button>
            )}
            <button
              onClick={onReset}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">{children}</main>
    </div>
  );
}
