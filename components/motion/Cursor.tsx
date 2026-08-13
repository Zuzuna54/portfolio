"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useMotion } from "./MotionProvider";

/**
 * Custom cursor: a hard dot that tracks exactly, and a ring that lags.
 *
 * The lag is the whole effect — a ring that follows perfectly reads as a
 * texture, one that trails reads as weight. It grows over anything
 * interactive.
 *
 * Only mounts for fine pointers with motion enabled. On touch there is no
 * cursor to replace, and hiding the native one there would be actively hostile.
 */
export default function Cursor() {
  const { enabled } = useMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const d = dot.current, r = ring.current, w = wrap.current;
    if (!d || !r || !w) return;

    // quickTo writes straight to the transform on GSAP's ticker — far cheaper
    // than a tween per mousemove, and it interpolates rather than snapping.
    const dx = gsap.quickTo(d, "x", { duration: 0.08, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.08, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.42, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.42, ease: "power3" });

    const move = (e: PointerEvent) => {
      dx(e.clientX); dy(e.clientY);
      rx(e.clientX); ry(e.clientY);
    };

    // Delegated, so it keeps working for content rendered after mount.
    const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, summary';
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null;
      w.classList.toggle("is-active", Boolean(t?.closest?.(INTERACTIVE)));
    };
    const leave = () => w.classList.add("is-hidden");
    const enter = () => w.classList.remove("is-hidden");

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor" ref={wrap} aria-hidden="true">
      <div className="cursor__ring" ref={ring} />
      <div className="cursor__dot" ref={dot} />
    </div>
  );
}
