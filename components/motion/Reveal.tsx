"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

type Direction = "up" | "left" | "right" | "scale";

type Props = {
  children: React.ReactNode;
  from?: Direction;
  /** Seconds of delay within its own trigger, for staggering siblings. */
  delay?: number;
  /** Tie to scroll position (rewinds) rather than firing once. */
  scrub?: boolean;
  className?: string;
};

const FROM: Record<Direction, gsap.TweenVars> = {
  up: { y: 40, opacity: 0 },
  left: { x: -40, opacity: 0 },
  right: { x: 40, opacity: 0 },
  scale: { scale: 0.94, opacity: 0 },
};

/**
 * Scroll reveal for a block of content.
 *
 * The `data-reveal` attribute carries the *start* state in CSS, behind a
 * motion-safe media query. That ordering matters: with reduced motion the
 * element is never hidden in the first place, so if JS fails to load or throws,
 * the content is visible rather than permanently invisible. Animating from a
 * JS-set opacity:0 is how portfolios end up blank for the people least able to
 * debug it.
 */
export default function Reveal({
  children,
  from = "up",
  delay = 0,
  scrub = false,
  className,
}: Props) {
  const { enabled } = useMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        FROM[from],
        {
          x: 0, y: 0, scale: 1, opacity: 1,
          duration: 0.85,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            end: scrub ? "top 50%" : undefined,
            scrub: scrub ? 0.5 : false,
            once: !scrub,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [enabled, from, delay, scrub]);

  return (
    <div ref={ref} className={className} data-reveal={from}>
      {children}
    </div>
  );
}
