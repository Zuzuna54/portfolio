"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

/**
 * Route transitions — content resolves in rather than hard-cutting.
 *
 * Not React's <ViewTransition>. That is documented widely for "Next.js 16",
 * but on 16.3.0 `viewTransition` is rejected as an unknown key both at the top
 * level and under `experimental`, and react@19.2.8 exports no ViewTransition —
 * it only exists on React's experimental channel. Verified, not assumed.
 *
 * The browser's own startViewTransition() is the other candidate and is
 * genuinely nice, but it is Chromium-mostly and pairs badly with the App
 * Router's streaming navigation, which is why wrapper libraries exist for it.
 *
 * So: a short GSAP enter on pathname change. It works in every browser, costs
 * no dependency, and — the part that actually matters here — it runs inside the
 * same motion contract as everything else, so reduced motion disables it and
 * ScrollTrigger gets refreshed once the new page's layout exists.
 */
export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const { enabled, lenis } = useMotion();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    // Don't animate the first paint — that's the load, not a navigation, and
    // the hero's own reveals already own it.
    if (first.current) {
      first.current = false;
      return;
    }

    const el = ref.current;

    // A new route is a new document height and a new set of triggers. Without
    // this, ScrollTrigger keeps the previous page's start/end positions and
    // Lenis keeps the previous page's scroll limit — the same stale-measurement
    // failure that capped the timeline rail at 77%.
    lenis?.scrollTo(0, { immediate: true });
    ScrollTrigger.refresh();
    lenis?.resize();

    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out", clearProps: "transform" },
    );

    return () => {
      tween.kill();
      gsap.set(el, { autoAlpha: 1, y: 0 });
    };
  }, [pathname, enabled, lenis]);

  return <div ref={ref}>{children}</div>;
}
