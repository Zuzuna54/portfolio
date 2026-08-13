"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useMotion } from "./MotionProvider";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** How far the element may travel toward the pointer, in px. */
  strength?: number;
};

/**
 * Leans toward the pointer as it approaches, springs back on leave.
 *
 * Deliberately subtle — a few pixels. The effect isn't meant to be noticed
 * consciously; it makes a page feel responsive rather than looking animated.
 *
 * The wrapper is a span with no semantics of its own, so whatever it wraps
 * keeps its role, its focus behaviour and its keyboard handling. Pointer-only:
 * keyboard users get the focus ring, which is the thing that actually matters.
 */
export default function MagneticLink({ children, className, strength = 14 }: Props) {
  const { enabled } = useMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = ref.current;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "elastic.out(1, 0.4)" });

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // Offset from centre, normalised to [-1, 1], then scaled. Using the
      // half-extent means a wide button pulls less per pixel than a small one,
      // which keeps the feel consistent across sizes.
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      xTo(gsap.utils.clamp(-1, 1, nx) * strength);
      yTo(gsap.utils.clamp(-1, 1, ny) * strength);
    };
    const reset = () => { xTo(0); yTo(0); };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", reset);
      gsap.killTweensOf(el);
    };
  }, [enabled, strength]);

  return (
    <span ref={ref} className={`magnetic ${className ?? ""}`.trim()}>
      {children}
    </span>
  );
}
