"use client";

import { useEffect, useState } from "react";

export type Tier = "high" | "mid" | "low" | "off";

export type TierConfig = {
  tier: Tier;
  /** How many particles to allocate. */
  count: number;
  /** Device pixel ratio ceiling — the single biggest fill-rate lever. */
  dpr: number;
};

const CONFIG: Record<Exclude<Tier, "off">, Omit<TierConfig, "tier">> = {
  high: { count: 40000, dpr: 2 },
  mid: { count: 14000, dpr: 1.5 },
  low: { count: 6000, dpr: 1 },
};

/**
 * Picks a starting quality tier.
 *
 * The plan calls for full WebGL parity on mobile at 30fps+, which is only
 * possible as parity of *experience* with adaptive *fidelity* — the same scene,
 * fewer particles. A mid-range phone rendering 40k points at DPR 3 is a
 * thermal-throttle demo, not a portfolio.
 *
 * Device memory and core count are crude proxies, but they're the only ones
 * available before drawing a frame. The FPS watchdog corrects the guess from
 * there, which matters because these heuristics are wrong often enough that
 * relying on them alone would be irresponsible.
 */
export function useDeviceTier(): TierConfig {
  // Start conservative. Upgrading after measuring is safe; starting high and
  // discovering the device can't cope means the first seconds — the ones that
  // matter — are janky.
  const [cfg, setCfg] = useState<TierConfig>({ tier: "low", ...CONFIG.low });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCfg({ tier: "off", count: 0, dpr: 1 });
      return;
    }

    // No WebGL2 → no scene. Checked by actually acquiring a context rather
    // than sniffing, because a browser can advertise support and still fail
    // on a blocklisted driver.
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) {
      setCfg({ tier: "off", count: 0, dpr: 1 });
      return;
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();

    const nav = navigator as Navigator & { deviceMemory?: number };
    const mem = nav.deviceMemory ?? 4;
    const cores = navigator.hardwareConcurrency ?? 4;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const smallViewport = Math.min(window.innerWidth, window.innerHeight) < 700;

    let tier: Exclude<Tier, "off">;
    if (coarse || smallViewport) {
      // Touch devices: never high. Even capable phones throttle within a
      // minute at that particle count, and the frame drop arrives after the
      // visitor has already formed an impression.
      tier = mem >= 6 && cores >= 6 ? "mid" : "low";
    } else if (mem >= 8 && cores >= 8) {
      tier = "high";
    } else if (mem >= 4 && cores >= 4) {
      tier = "mid";
    } else {
      tier = "low";
    }

    setCfg({ tier, ...CONFIG[tier] });
  }, []);

  return cfg;
}

export function tierBelow(t: Tier): Tier {
  return t === "high" ? "mid" : t === "mid" ? "low" : "off";
}

export function configFor(t: Tier): TierConfig {
  if (t === "off") return { tier: "off", count: 0, dpr: 1 };
  return { tier: t, ...CONFIG[t] };
}
