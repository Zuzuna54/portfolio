"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Pin length as a multiple of viewport height. */
  length?: number;
  /**
   * Publishes 0→1 progress for this scene onto a CSS custom property, so
   * children can be driven from CSS without each one owning a ScrollTrigger.
   */
  varName?: string;
};

/**
 * A section that holds still while its content advances with scroll.
 *
 * Pinning is the one scroll effect that genuinely traps people, so two rules:
 * the pin is never longer than it needs to be, and it is skipped entirely on
 * short viewports — pinning a section taller than the screen means content is
 * unreachable, which on a phone is a dead end rather than an effect.
 */
export default function PinnedScene({
  children,
  className,
  length = 1.5,
  varName = "--scene-progress",
}: Props) {
  const { enabled } = useMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    gsap.registerPlugin(ScrollTrigger);

    // Seed the property immediately.
    //
    // The CSS fallback is `var(--scene-progress, 1)` — the end state — so that
    // without JS every child is simply visible. But that fallback also applies
    // in the window between mount and the trigger's first onUpdate, which made
    // the whole sequence flash in fully revealed, hide itself, and then reveal
    // again on scroll. Writing 0 up front closes that window.
    el.style.setProperty(varName, "0");

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: () => `+=${window.innerHeight * length}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        // Content taller than the viewport can't be pinned without hiding part
        // of it. Below that threshold the section just scrolls normally.
        onRefresh: (self) => {
          const tooTall = el.scrollHeight > window.innerHeight + 8;
          if (tooTall) self.disable(false);
        },
        onUpdate: (self) => {
          el.style.setProperty(varName, self.progress.toFixed(4));
        },
      });
    }, el);

    return () => ctx.revert();
  }, [enabled, length, varName]);

  return (
    <div ref={ref} className={`scene ${className ?? ""}`.trim()} data-scene="">
      {children}
    </div>
  );
}
