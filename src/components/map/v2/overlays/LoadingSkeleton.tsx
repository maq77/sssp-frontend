export function LoadingSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1c]">
      {/* Animated grid */}
      <div className="relative w-80 h-60 rounded-2xl overflow-hidden border border-white/8">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(30,58,138,0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(30,58,138,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Skeleton zones */}
        {[
          { top: '10%', left: '5%', w: '40%', h: '35%' },
          { top: '10%', left: '55%', w: '38%', h: '30%' },
          { top: '55%', left: '10%', w: '30%', h: '35%' },
          { top: '55%', left: '50%', w: '42%', h: '35%' },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute rounded-lg border border-white/8 animate-pulse"
            style={{
              top: s.top, left: s.left, width: s.w, height: s.h,
              background: 'rgba(30,58,138,0.15)',
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>

      <div className="mt-6 text-slate-400 text-sm animate-pulse">Loading security map...</div>
    </div>
  );
}
