"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useMotion } from "@/components/motion/MotionProvider";

const LINES = [
  "$ boot --profile=giorgi",
  "resolving nine years of production systems…",
  "loading agent orchestration · retrieval · evaluation",
  "cost and latency controls: nominal",
  "ready.",
];

/**
 * Counter loader → terminal boot, as an overlay.
 *
 * The overlay is the entire design of this component. The hero underneath is
 * server-rendered and visible in the DOM from the first byte; this floats above
 * it and fades. That's what keeps a 2–3 second cinematic entrance from costing
 * anything in LCP, which measures the real content behind it.
 *
 * It is also skippable and remembered. A recruiter opening the site a third
 * time should not sit through this again, and any interaction at all — scroll,
 * click, key, touch — ends it immediately.
 */
export default function HeroBoot() {
  const { enabled, lenis } = useMotion();
  const [done, setDone] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // Once per session, not once per page view.
    if (sessionStorage.getItem("booted") === "1") return;
    setDone(false);
  }, [enabled]);

  useEffect(() => {
    if (done || !root.current) return;

    const el = root.current;
    // Lock scrolling for the duration — a page moving underneath a boot
    // sequence reads as broken rather than cinematic.
    lenis?.stop();

    const finish = () => {
      sessionStorage.setItem("booted", "1");
      tl.current?.kill();
      gsap.to(el, {
        autoAlpha: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          lenis?.start();
          setDone(true);
        },
      });
    };

    const counter = { v: 0 };
    const t = gsap.timeline({ onComplete: finish });

    t.to(counter, {
      v: 100,
      duration: 1.15,
      ease: "power2.inOut",
      onUpdate: () => {
        if (countRef.current) {
          countRef.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
        }
      },
    });

    const lineEls = linesRef.current?.children;
    if (lineEls) {
      t.to([...lineEls], { autoAlpha: 1, duration: 0.14, stagger: 0.16 }, "-=0.35");
    }
    t.to({}, { duration: 0.35 }); // beat on "ready."

    tl.current = t;

    // Any intent to interact ends it.
    const opts = { passive: true } as const;
    const events: (keyof WindowEventMap)[] = ["wheel", "touchstart", "keydown", "pointerdown"];
    events.forEach((e) => window.addEventListener(e, finish, opts));

    return () => {
      events.forEach((e) => window.removeEventListener(e, finish));
      t.kill();
      lenis?.start();
    };
  }, [done, lenis]);

  if (done) return null;

  return (
    <div className="boot" ref={root} role="status" aria-live="polite">
      <div className="boot__inner shell">
        <div className="boot__count mono">
          <span ref={countRef}>000</span>
          <i>%</i>
        </div>
        <div className="boot__lines mono" ref={linesRef}>
          {LINES.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <button className="boot__skip mono" type="button" onClick={() => setDone(true)}>
          Skip
        </button>
      </div>
    </div>
  );
}
