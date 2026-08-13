"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

/**
 * The master scroll clock.
 *
 * Publishes whole-document progress two ways:
 *
 *   · `--scroll-progress` on :root, 0→1, so CSS (and the WebGL layer in phase
 *     4) can read scroll position without subscribing to anything.
 *   · a scaleX on the progress bar.
 *
 * scrub: true is what makes this bidirectional — progress is a pure function of
 * scroll position, so scrolling up genuinely rewinds rather than replaying. It
 * stops when the reader stops, because it is position-driven, not time-driven.
 */
export default function ScrollProgress() {
  const { enabled } = useMotion();
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    gsap.registerPlugin(ScrollTrigger);

    const root = document.documentElement;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          root.style.setProperty("--scroll-progress", p.toFixed(4));
          root.style.setProperty("--scroll-velocity", self.getVelocity().toFixed(2));
          if (bar.current) bar.current.style.transform = `scaleX(${p})`;
        },
      });
    });

    return () => {
      ctx.revert();
      root.style.removeProperty("--scroll-progress");
      root.style.removeProperty("--scroll-velocity");
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div className="progress" ref={bar} aria-hidden="true" />;
}
