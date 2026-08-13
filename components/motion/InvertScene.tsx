"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

type Props = {
  children: React.ReactNode;
  /** Which inverted palette to resolve to. */
  palette?: "crimson" | "gold";
  className?: string;
};

/**
 * A section that inverts the whole palette as you scroll into it.
 *
 * The static `.invert-crimson` class does the same thing with a hard cut. This
 * scrubs the swap against scroll position, so the page bleeds into the new
 * colour and bleeds back out if you scroll up — which is the point of a
 * position-driven timeline rather than a one-shot trigger.
 *
 * It works by animating a single custom property, `--invert`, from 0 to 1 and
 * letting CSS interpolate every token against it. Two consequences worth
 * naming: nothing here needs to know what the palette contains, and the
 * inversion reaches borders, links, metric chips and SVG diagrams for free,
 * because they were already reading from the same tokens.
 *
 * Without JS or with reduced motion the section renders fully inverted from the
 * start — the end state, not a half-applied one.
 */
export default function InvertScene({ children, palette = "crimson", className }: Props) {
  const { enabled } = useMotion();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { "--invert": 0 },
        {
          "--invert": 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            // Starts as the section's top reaches the lower third and completes
            // well before it leaves, so the reader spends most of the section in
            // the destination palette rather than mid-transition.
            start: "top 75%",
            end: "top 25%",
            scrub: 0.4,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [enabled]);

  return (
    <section
      ref={ref}
      className={`invert-scene invert-scene--${palette} section ${className ?? ""}`.trim()}
      data-scene=""
    >
      {children}
    </section>
  );
}
