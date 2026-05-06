import React, { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

function splitChars(text: string) {
  // Keeps spaces as non-breaking so the mask stays aligned
  return Array.from(text).map((ch, i) => (
    <span key={i} className="inline-block will-change-transform">
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));
}

type MaskedTextProps = {
  as?: "h1" | "p" | "div";
  className?: string;
  text: string;
  triggerKey: string | number; // change this to re-run animation
  delay?: number;
};

export function MaskedText({
  as = "div",
  className,
  text,
  triggerKey,
  delay = 0,
}: MaskedTextProps) {
  const Tag = as as any;
  const rootRef = useRef<HTMLDivElement | null>(null);

  const content = useMemo(() => splitChars(text), [text]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const spans = Array.from(root.querySelectorAll("span"));

    gsap.killTweensOf(spans);

    // Initial off-screen mask position like Rogier
    gsap.set(spans, { yPercent: 120, skewY: 6, opacity: 1 });

    gsap.to(spans, {
      yPercent: 0,
      skewY: 0,
      duration: 0.9,
      ease: "power4.out", // premium
      stagger: 0.012,
      delay,
    });
  }, [triggerKey, delay, text]);

  return (
    <div className="overflow-hidden">
      <Tag ref={rootRef as any} className={className}>
        {content}
      </Tag>
    </div>
  );
}
