"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useMotion } from "./MotionProvider";

type Props = {
  children: React.ReactNode;
  /** Element to render. Headings should stay headings. */
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  /** Scrub ties progress to scroll position and rewinds on scroll-up. */
  scrub?: boolean;
};

/**
 * Line-by-line reveal driven by scroll.
 *
 * SplitText is used rather than a hand-rolled splitter because it handles the
 * things that actually bite: it re-splits on resize, it restores the original
 * markup on revert, and — critically — it keeps the source text in the
 * accessibility tree instead of shattering it into per-line spans that screen
 * readers announce as fragments.
 *
 * The element renders its real text server-side. If JS never runs, or motion is
 * reduced, the text is simply there.
 */
export default function SplitReveal({
  children,
  as: Tag = "div",
  className,
  scrub = false,
}: Props) {
  const { enabled } = useMotion();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;

    gsap.registerPlugin(ScrollTrigger, SplitText);

    let split: SplitText | null = null;
    let tween: gsap.core.Tween | null = null;

    // Fonts must be loaded before splitting, or lines break at the fallback
    // font's metrics and re-wrap visibly when the real font arrives.
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        split = new SplitText(el, {
          type: "lines",
          linesClass: "line",
          // Wrap each line so overflow:hidden clips the rise cleanly.
          autoSplit: true,
        });

        tween = gsap.from(split.lines, {
          yPercent: 115,
          opacity: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power4.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: scrub ? "top 45%" : undefined,
            scrub: scrub ? 0.6 : false,
            once: !scrub,
          },
        });
      });
    }, el);

    return () => {
      tween?.kill();
      split?.revert();
      ctx.revert();
    };
  }, [enabled, scrub]);

  return (
    <Tag ref={ref as never} className={className} data-split="">
      {children}
    </Tag>
  );
}
