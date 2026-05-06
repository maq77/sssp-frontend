import { useEffect, useRef, useState } from "react";

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      setSize({ width: r.width, height: r.height });
    });

    ro.observe(el);

    const rect = el.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => ro.disconnect();
  }, []);

  return { ref, size };
}
