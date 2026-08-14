"use client";

import { useEffect, useState } from "react";

/**
 * Renders its children on the frame after the browser's first paint.
 *
 * Both things this wraps — the WebGPU canvas and the terminal — are background
 * or on-demand. Neither should compete with the hero for the paint that makes
 * the page readable. Deferring the canvas measurably moved LCP from 6.9s to
 * 4.7s and FCP from 1.2s to 0.8s.
 *
 * **After paint, not after idle.** The first version waited on
 * `requestIdleCallback(…, {timeout: 2000})`, which is the intuitive choice and
 * the wrong one: idle does not arrive while React is still hydrating, so the
 * timeout became the real schedule and the background — the site's whole
 * visual identity — was still missing four seconds in. Two `requestAnimationFrame`s
 * put us on the frame after paint instead, which is the actual requirement.
 *
 * **The timer is not a fallback, it's the backstop.** A backgrounded tab
 * freezes rAF entirely (HANDOFF §5.5), so a page opened in a background tab
 * would never mount its canvas at all. Whichever fires first wins, and the
 * loser is cancelled.
 */
export default function Deferred({
  children,
  backstopMs = 600,
}: {
  children: React.ReactNode;
  backstopMs?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    let raf1 = 0;
    let raf2 = 0;

    const go = () => {
      if (done) return;
      done = true;
      setReady(true);
    };

    // Frame 1 is queued before this paint; frame 2 lands after it.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(go);
    });
    const timer = window.setTimeout(go, backstopMs);

    return () => {
      done = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [backstopMs]);

  return ready ? <>{children}</> : null;
}
