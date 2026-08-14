"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useMotion } from "./MotionProvider";

/**
 * A continuous line that draws itself down a timeline, with nodes landing on it
 * as it passes.
 *
 * The About page's reveal grammar. A career is a single continuous thing, so the
 * line is one path rather than a series of separate marks — the drawing *is* the
 * argument.
 *
 * Scrubbed, so scrolling back un-draws it. That works here where it would not
 * for the scramble: a half-drawn line is still a line, whereas half-decoded text
 * is gibberish.
 *
 * Absolutely positioned behind the timeline content and `aria-hidden` — it is
 * decoration over a list that already reads correctly without it.
 */
export default function DrawLine({ nodes = 0 }: { nodes?: number }) {
  const { enabled } = useMotion();
  const root = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!enabled || !root.current) return;
    gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
    const el = root.current;

    const ctx = gsap.context(() => {
      const path = el.querySelector("path");
      const dots = el.querySelectorAll("circle");
      if (!path) return;

      gsap.set(path, { drawSVG: "0%" });
      gsap.set(dots, { opacity: 0, scale: 0, transformOrigin: "center" });

      const tl = gsap.timeline({
        scrollTrigger: {
          // The parent section is the trigger: the line should track the
          // timeline it belongs to, not its own bounding box.
          trigger: el.parentElement ?? el,
          start: "top 82%",
          end: "bottom 72%",
          scrub: 0.5,
        },
      });

      tl.to(path, { drawSVG: "100%", ease: "none", duration: 1 }, 0);
      dots.forEach((d, i) => {
        // Each node lands as the line reaches it, not on a fixed stagger.
        tl.to(d, { opacity: 1, scale: 1, duration: 0.12 }, (i / Math.max(dots.length, 1)) * 0.92);
      });
    }, el);

    return () => ctx.revert();
  }, [enabled, nodes]);

  const H = 1000;
  const step = nodes > 1 ? H / (nodes - 1) : H;

  return (
    <svg
      ref={root}
      className="drawline"
      viewBox={`0 0 20 ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={`M 10 0 V ${H}`} className="drawline__path" />
      {Array.from({ length: nodes }, (_, i) => (
        <circle key={i} cx="10" cy={i * step} r="4" className="drawline__node" />
      ))}
    </svg>
  );
}
