import React, { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

type PreloaderProps = {
  progress01: number; // 0..1
  onEnter: (withSound: boolean) => void;
};

export function Preloader({ progress01, onEnter }: PreloaderProps) {
  const circleRef = useRef<SVGCircleElement | null>(null);
  const percentRef = useRef<HTMLDivElement | null>(null);
  const canEnter = progress01 >= 0.999;

  const r = 120;
  const circumference = useMemo(() => 2 * Math.PI * r, [r]);

  useEffect(() => {
    const circle = circleRef.current;
    const percent = percentRef.current;
    if (!circle || !percent) return;

    const value = Math.round(progress01 * 100);

    gsap.to(circle, {
      strokeDashoffset: circumference * (1 - progress01),
      duration: 0.25,
      ease: "power2.out",
      overwrite: true,
    });

    gsap.to(percent, {
      innerText: value,
      duration: 0.2,
      ease: "none",
      snap: { innerText: 1 },
      overwrite: true,
    });
  }, [progress01, circumference]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black text-white">
      {/* Rogier-like unresolved fade */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[520px] max-w-[90vw]">
          <div className="flex items-start justify-between mb-10 text-[10px] tracking-[0.35em] uppercase text-white/50">
            <div>V-004</div>
            <div>Loading Experience</div>
          </div>

          <div className="relative flex items-center justify-center">
            <svg
              className="block"
              width="462"
              height="462"
              viewBox="0 0 462 462"
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx="231"
                cy="231"
                r={r}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="2 6"
              />
              <circle
                ref={circleRef}
                cx="231"
                cy="231"
                r={r}
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[72px] font-black tracking-tight">
                <span ref={percentRef as any}>0</span>%
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  disabled={!canEnter}
                  onClick={() => onEnter(true)}
                  className={[
                    "group relative h-12 px-7 text-[11px] uppercase tracking-[0.35em]",
                    "border border-white/30 hover:border-white/80",
                    "transition disabled:opacity-30 disabled:pointer-events-none",
                  ].join(" ")}
                >
                  <span className="relative z-10">Enter</span>
                </button>

                <button
                  disabled={!canEnter}
                  onClick={() => onEnter(false)}
                  className={[
                    "h-12 px-5 text-[11px] uppercase tracking-[0.25em]",
                    "text-white/70 hover:text-white",
                    "transition disabled:opacity-30 disabled:pointer-events-none",
                  ].join(" ")}
                >
                  Enter without sound
                </button>
              </div>

              <div className="mt-8 text-[10px] tracking-[0.35em] uppercase text-white/40">
                {canEnter ? "Ready" : "Loading..."}
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end text-[10px] tracking-[0.35em] uppercase text-white/35">
            SSSP Interactive Demo
          </div>
        </div>
      </div>
    </div>
  );
}
