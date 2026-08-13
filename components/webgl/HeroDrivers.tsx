"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "@/components/motion/MotionProvider";
import HeroBoot from "./HeroBoot";

/**
 * Home-page scroll drivers plus the boot overlay.
 *
 * The canvas itself is in the layout now; this only publishes the two values
 * the hero formation reads. Keeping them page-local means other routes don't
 * inherit a hero timeline that has no hero to attach to.
 */
export default function HeroDrivers() {
  const { enabled } = useMotion();

  useEffect(() => {
    if (!enabled) return;
    gsap.registerPlugin(ScrollTrigger);
    const root = document.documentElement;

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

    // Seeded so the first frames read 0 rather than an unset property.
    root.style.setProperty("--hero-progress", "0");
    root.style.setProperty("--hero-settle", "0");

    return () => {
      ctx.revert();
      root.style.removeProperty("--hero-progress");
      root.style.removeProperty("--hero-settle");
    };
  }, [enabled]);

  return <HeroBoot />;
}
