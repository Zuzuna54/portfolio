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
 *   · `--scroll-progress` on :root, 0→1, so CSS (and the WebGL layer) can read
 *     scroll position without subscribing to anything.
 *   · `--scroll-energy` on :root, 0→1 — how hard the reader is moving right
 *     now. This drives the variable-font axes.
 *   · a scaleX on the progress bar.
 *
 * scrub: true is what makes this bidirectional — progress is a pure function of
 * scroll position, so scrolling up genuinely rewinds rather than replaying. It
 * stops when the reader stops, because it is position-driven, not time-driven.
 */

/**
 * Scroll speed, px/s, that saturates the effect.
 *
 * NOT yet calibrated against real input — synthetic scrolling can't produce a
 * representative velocity, because ScrollTrigger reports its own averaged rate
 * rather than the instantaneous jump, and a driven `scrollTo` skews it badly
 * (a pumped 7000px/s read back as ~420px/s). This is an estimate: too low and
 * the axis pins at full excursion during ordinary reading, too high and the
 * effect never shows. Tune it on a real screen with a real trackpad and mouse
 * wheel — it is on the verification list in HANDOFF for exactly that reason.
 */
const FLICK = 2400;

export default function ScrollProgress() {
  const { enabled } = useMotion();
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    gsap.registerPlugin(ScrollTrigger);

    const root = document.documentElement;

    // Energy is damped on the ticker rather than written from onUpdate.
    //
    // onUpdate only fires while the scroll position is changing, so a value
    // written there alone would freeze at whatever the last flick was the
    // instant the reader stopped — the type would stay stretched, permanently,
    // exactly when someone settles in to read. The ticker keeps running, so the
    // decay happens whether or not anything is scrolling.
    let energy = 0;
    let target = 0;

    const tick = (_t: number, deltaMs: number) => {
      // Clamped so a stall (tab restore, long GC) can't jump the damping.
      const dt = Math.min(deltaMs / 1000, 1 / 20);
      // Asymmetric, matching the WebGL velocity damping: snap up to a flick,
      // relax down slowly, so stopping reads as settling rather than a switch.
      const rate = target > energy ? 14 : 3.5;
      energy += (target - energy) * (1 - Math.exp(-rate * dt));
      // The target decays on its own; onUpdate re-arms it while scrolling.
      target *= Math.exp(-6 * dt);
      if (energy < 0.0005) energy = 0;
      root.style.setProperty("--scroll-energy", energy.toFixed(4));
    };
    gsap.ticker.add(tick);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          const v = self.getVelocity();
          root.style.setProperty("--scroll-progress", p.toFixed(4));
          root.style.setProperty("--scroll-velocity", v.toFixed(2));
          target = Math.min(Math.abs(v) / FLICK, 1);
          if (bar.current) bar.current.style.transform = `scaleX(${p})`;
        },
      });
    });

    return () => {
      gsap.ticker.remove(tick);
      ctx.revert();
      root.style.removeProperty("--scroll-progress");
      root.style.removeProperty("--scroll-velocity");
      root.style.removeProperty("--scroll-energy");
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div className="progress" ref={bar} aria-hidden="true" />;
}
