"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

/**
 * Rules draw, then rows fill — a document assembling itself.
 *
 * The résumé's reveal grammar, and the one page where the structure *is* the
 * subject: a résumé is a grid, so the grid arrives first and the content settles
 * into it. Scoped by selector rather than by wrapping every row, so the markup
 * stays a plain semantic document.
 *
 * **Two safety properties, both learned the hard way.**
 *
 * The first version put a single `once: true` trigger on the wrapper. The
 * wrapper's top is above the fold, so the trigger was already past its start
 * when it was created and never fired — leaving all 33 rows at opacity 0 and the
 * résumé rendering completely blank. Hence `gsap.from()`, whose end state is
 * whatever the element already was, and `ScrollTrigger.batch`, which fires for
 * elements that are in view at creation.
 *
 * The second is the deadman below. Anything that hides content must be able to
 * un-hide it without depending on a scroll event ever arriving — a blank résumé
 * on a job-search site is the worst bug this codebase could ship.
 */
export default function GridReveal({
  children,
  rules = "hr, .rule",
  rows = ".resume-role, .skills li",
}: {
  children: ReactNode;
  rules?: string;
  rows?: string;
}) {
  const { enabled } = useMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;

    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger);
      const ruleEls = Array.from(el.querySelectorAll<HTMLElement>(rules));
      const rowEls = Array.from(el.querySelectorAll<HTMLElement>(rows));
      if (!ruleEls.length && !rowEls.length) return;

      // `from` rather than `set` + `to`: the tween's end state is whatever the
      // element already is, so an interrupted or killed tween still lands on
      // visible rather than on hidden.
      ScrollTrigger.batch(ruleEls, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.from(batch, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out",
          }),
      });

      ScrollTrigger.batch(rowEls, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.from(batch, {
            opacity: 0,
            y: 10,
            duration: 0.45,
            stagger: 0.035,
            overwrite: true,
          }),
      });
    }, el);

    // Deadman. If anything above leaves an element mid-tween — a killed context,
    // a refresh that never resolves — this restores a plain readable document.
    // One timeout, and it removes the only way this component can hide content
    // permanently.
    const safety = window.setTimeout(() => {
      ref.current
        ?.querySelectorAll<HTMLElement>(`${rules}, ${rows}`)
        .forEach((n) => {
          if (Number(getComputedStyle(n).opacity) < 0.99) {
            gsap.set(n, { opacity: 1, y: 0, scaleX: 1 });
          }
        });
    }, 4000);

    return () => {
      window.clearTimeout(safety);
      ctx.revert();
    };
  }, [enabled, rules, rows]);

  return <div ref={ref}>{children}</div>;
}
