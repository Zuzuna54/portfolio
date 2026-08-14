"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

/**
 * A hard-edged wipe on section entry.
 *
 * The case studies' reveal grammar. A clip-path with a straight edge, not a
 * fade: the site is brutalist, and a soft fade is the one gesture that would
 * contradict everything else on the page.
 *
 * The element is never hidden by CSS — the start state is set in JS after mount.
 * So no JS, a dead bundle, or reduced motion all leave the content plainly
 * visible, which is the rule the whole site is built on (HANDOFF §2.3).
 */
export default function ClipReveal({
  children,
  className,
  from = "left",
}: {
  children: ReactNode;
  className?: string;
  from?: "left" | "up";
}) {
  const { enabled } = useMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger);
      const closed =
        from === "left" ? "inset(0 100% 0 0)" : "inset(100% 0 0 0)";

      gsap.fromTo(
        el,
        { clipPath: closed, willChange: "clip-path" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 0.9,
          ease: "power3.inOut",
          // `clipPath` has to be cleared, not just `willChange`. The tween ends
          // on a clip equal to the border box — visually a no-op, but it still
          // clips, and the global focus ring is drawn at `outline-offset: 3px`,
          // *outside* that box. Leaving it on made the four case-study cards on
          // `/` focusable with no visible ring. Same containing-block family of
          // problem as HANDOFF §5.19.
          clearProps: "willChange,clipPath",
          scrollTrigger: { trigger: el, start: "top 84%", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [enabled, from]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
