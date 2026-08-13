"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

/**
 * A strip that scrolls sideways while the page scrolls down.
 *
 * Degrades to a normal swipeable overflow strip with scroll-snap when motion is
 * off — see `.rail` in _motion.scss. That fallback is the honest one on touch:
 * translating a rail under a pinned section fights the browser's own horizontal
 * gesture, and the native version is better than anything reimplemented.
 */
export default function HorizontalRail({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { enabled } = useMotion();
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !outer.current || !inner.current) return;
    // Coarse pointers keep the native swipe strip.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const o = outer.current, i = inner.current;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Measure overflow on the rail itself, not against the outer element.
      //
      // `i.scrollWidth - o.clientWidth` looks equivalent and isn't: clientWidth
      // includes the section's horizontal padding, so the travel came up ~150px
      // short and the final card stayed clipped off the right edge. Comparing a
      // single element's scrollWidth to its own clientWidth is padding-consistent
      // by construction.
      //
      // Measured in a function so a resize recomputes rather than baking in the
      // width at mount — paired with invalidateOnRefresh below.
      const distance = () => Math.max(0, i.scrollWidth - i.clientWidth);

      gsap.to(i, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: o,
          start: "center center",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }, o);

    // `invalidateOnRefresh` only helps if something actually refreshes.
    //
    // The function values above are evaluated once at creation, and at that
    // moment the rail hasn't finished laying out — web fonts haven't swapped,
    // so the cards are narrower than they end up. The travel distance was
    // captured ~290px short and the final card stayed clipped off the right
    // edge permanently.
    //
    // A ResizeObserver alone does NOT fix this, which cost me an hour: by the
    // time it attaches, the width has usually already reached its final value,
    // so it observes no change, never fires, and the stale distance survives.
    // The unconditional refresh is what actually corrects the measurement; the
    // observer only earns its place for *later* changes like window resizes.
    const settle = () => ScrollTrigger.refresh();
    const raf = requestAnimationFrame(settle);
    document.fonts?.ready.then(() => requestAnimationFrame(settle));

    let last = i.scrollWidth;
    const ro = new ResizeObserver(() => {
      if (Math.abs(i.scrollWidth - last) < 2) return;
      last = i.scrollWidth;
      settle();
    });
    ro.observe(i);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctx.revert();
    };
  }, [enabled]);

  return (
    <div ref={outer} className={`rail-outer ${className ?? ""}`.trim()}>
      <div ref={inner} className="rail">
        {children}
      </div>
    </div>
  );
}
