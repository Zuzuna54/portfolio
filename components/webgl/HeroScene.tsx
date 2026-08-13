"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "@/components/motion/MotionProvider";
import ParticleField from "./ParticleField";
import HeroBoot from "./HeroBoot";

/**
 * Drives the hero's WebGL formation from scroll.
 *
 * Publishes two numbers on :root and nothing else:
 *   --hero-progress  0 → 1   scatter resolving into the architecture graph
 *   --hero-settle    0 → 1   graph relaxing into a drift field as you leave
 *
 * The shader reads them from computed style each frame. That indirection is
 * deliberate: WebGL, GSAP and CSS then share one scroll clock rather than three
 * subscriptions that can disagree, and the whole scene is scrubbed — scrolling
 * back genuinely reverses the formation instead of replaying it.
 */
export default function HeroScene() {
  const { enabled } = useMotion();

  useEffect(() => {
    if (!enabled) return;
    gsap.registerPlugin(ScrollTrigger);
    const root = document.documentElement;

    // Formation completes over the first viewport-and-a-bit, so the graph has
    // resolved by the time the first case study arrives.
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: () => `+=${window.innerHeight * 1.1}`,
        scrub: true,
        onUpdate: (self) => root.style.setProperty("--hero-progress", self.progress.toFixed(4)),
      });

      ScrollTrigger.create({
        trigger: ".hero",
        start: () => `top+=${window.innerHeight * 0.9} top`,
        end: () => `+=${window.innerHeight * 1.2}`,
        scrub: true,
        onUpdate: (self) => root.style.setProperty("--hero-settle", self.progress.toFixed(4)),
      });
    });

    // Seeded so the first frames read 0 rather than falling back to an
    // unset property — the same class of flash fixed in PinnedScene.
    root.style.setProperty("--hero-progress", "0");
    root.style.setProperty("--hero-settle", "0");

    return () => {
      ctx.revert();
      root.style.removeProperty("--hero-progress");
      root.style.removeProperty("--hero-settle");
    };
  }, [enabled]);

  return (
    <>
      <ParticleField />
      <HeroBoot />
    </>
  );
}
