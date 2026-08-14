"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useMotion } from "./MotionProvider";

/**
 * Headlines that decode out of noise.
 *
 * The writing section's reveal grammar. It rhymes with the terminal boot on the
 * home page — the same idea of a machine resolving into language — without
 * reusing the same animation, which is the point of having a grammar per section
 * rather than one template applied everywhere.
 *
 * Not scrubbed. A scrubbed scramble reverses into gibberish as you scroll back
 * up, which reads as broken rather than as an effect; it plays once on entry and
 * stays decoded.
 *
 * The real text is always in the DOM. The scramble replaces it after mount, so
 * with no JS, a dead bundle, or reduced motion the heading is simply a heading.
 */
export default function Scramble({
  children,
  as: Tag = "span",
  className,
  chars = "upperAndLowerCase",
  speed = 0.55,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  chars?: string;
  speed?: number;
}) {
  const { enabled } = useMotion();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const text = el.textContent ?? "";
    if (!text.trim()) return;

    gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

    const ctx = gsap.context(() => {
      gsap.to(el, {
        duration: Math.min(0.5 + text.length * 0.014, 1.6),
        scrambleText: { text, chars, speed, revealDelay: 0.15 },
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [enabled, chars, speed]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
