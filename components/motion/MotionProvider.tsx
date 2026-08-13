"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type MotionState = {
  /** False when the visitor asked for reduced motion. Nothing animates. */
  enabled: boolean;
  lenis: Lenis | null;
};

const Ctx = createContext<MotionState>({ enabled: false, lenis: null });
export const useMotion = () => useContext(Ctx);

/**
 * Owns smooth scroll and the GSAP↔Lenis bridge.
 *
 * Two things make this correct rather than merely working:
 *
 * 1. Lenis takes over scrolling, so ScrollTrigger's own scroll listener would
 *    read stale positions. We drive ScrollTrigger's update from Lenis's own
 *    tick and hand GSAP's ticker the raf loop, so there is exactly one clock.
 *
 * 2. Under prefers-reduced-motion nothing starts at all — no Lenis, no
 *    ScrollTrigger, no timelines. Native scrolling is left alone. A scrubbed
 *    page with motion half-disabled is worse than a static one, because content
 *    that only appears mid-timeline never appears.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MotionState>({ enabled: false, lenis: null });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      // The pre-paint script already skipped arming, but clear it defensively
      // in case the preference changed between paint and hydration.
      document.documentElement.classList.remove("motion-on");
      document.documentElement.classList.add("reduced-motion");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      // Slightly eased rather than linear so flicks decelerate naturally.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Never smooth touch. Mobile browsers hand off scrolling to the
      // compositor; intercepting it costs a frame and feels worse, not better.
      syncTouch: false,
      touchMultiplier: 1.6,
    });

    // One clock. Lenis publishes scroll position, ScrollTrigger reads it.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // The other half of the bridge, and the one that's easy to miss.
    //
    // Lenis caches the maximum scroll position. ScrollTrigger inserts pin
    // spacers on refresh, which makes the document taller *after* Lenis has
    // measured — so Lenis keeps clamping scroll to the old, shorter limit.
    // Every pinned trigger whose end lies past that limit then tops out
    // mid-animation and can never reach progress 1.
    //
    // Measured on the timeline rail: limit stuck at 4817 against a real 6105,
    // so the pin capped at 77% and the final card stayed clipped off-screen —
    // with no error anywhere, because nothing is technically broken.
    const syncLenis = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", syncLenis);

    // The event alone isn't enough, because it depends on ordering: pinned
    // triggers are created by child components, and the refresh that inserts
    // their spacers can land at an unhelpful moment relative to this listener.
    //
    // Change-detection doesn't rescue it either — a ResizeObserver attached
    // here initialises its baseline to whatever the height already is, so if
    // the growth happened first it observes nothing and stays quiet. That's the
    // same trap twice.
    //
    // So: don't detect, just re-sync unconditionally on a few beats while the
    // page settles. Order matters — refresh recomputes the spacers, then Lenis
    // re-reads the resulting height. Three cheap calls, and no assumption about
    // who mounted first.
    const resync = () => {
      ScrollTrigger.refresh();
      lenis.resize();
    };
    const raf = requestAnimationFrame(resync);
    const timers = [setTimeout(resync, 250), setTimeout(resync, 1200)];
    document.fonts?.ready.then(resync);

    // Tells the watchdog in the pre-paint script that motion really did start,
    // so it leaves `motion-on` alone.
    document.documentElement.dataset.motionReady = "1";

    // Lenis owns the scroll position, which means window.scrollTo() sets the
    // native scrollTop while Lenis's internal position — the one ScrollTrigger
    // reads — stays where it was. Anything driving the page programmatically
    // has to go through Lenis. Exposed in dev so that's debuggable from the
    // console instead of looking like a broken ScrollTrigger.
    if (process.env.NODE_ENV !== "production") {
      Object.assign(window as unknown as Record<string, unknown>, {
        lenis,
        gsap,
        ScrollTrigger,
      });
    }
    document.documentElement.classList.add("has-custom-cursor", "motion-on");
    setState({ enabled: true, lenis });

    return () => {
      ScrollTrigger.removeEventListener("refresh", syncLenis);
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      document.documentElement.classList.remove("has-custom-cursor", "motion-on");
      delete document.documentElement.dataset.motionReady;
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
