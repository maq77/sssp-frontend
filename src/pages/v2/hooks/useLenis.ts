import { useEffect, useRef } from "react";
import Lenis from "lenis";

type UseLenisOptions = {
  enabled?: boolean;
  lerp?: number;
  wheelMultiplier?: number;
  touchMultiplier?: number;
};

export function useLenis({
  enabled = true,
  lerp = 0.08,
  wheelMultiplier = 0.9,
  touchMultiplier = 1.0,
}: UseLenisOptions = {}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      lerp,
      smoothWheel: true,
      wheelMultiplier,
      touchMultiplier,
      // you can set `infinite: false` etc if needed
    });

    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled, lerp, wheelMultiplier, touchMultiplier]);

  return lenisRef;
}
