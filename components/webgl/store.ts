"use client";

import * as THREE from "three";

/**
 * Shared frame state, read by every scene.
 *
 * A plain mutable object rather than React state or context on purpose: this is
 * written every frame, and routing per-frame values through React would cause a
 * re-render per frame. Scenes read it inside useFrame, which is outside React's
 * render cycle entirely.
 */
export const frame = {
  /** Whole-document scroll, 0→1. Published by ScrollProgress to :root. */
  progress: 0,
  /**
   * Signed scroll velocity, smoothed and normalised to roughly [-1, 1].
   * This is what makes the field feel physical: fast scrolling smears it,
   * stopping lets it settle, and direction is preserved so scrolling back
   * pulls the other way.
   */
  velocity: 0,
  /** Hero formation, 0 scatter → 1 graph. */
  heroProgress: 0,
  /** Hero relaxing into a drift field as it leaves, 0→1. */
  heroSettle: 0,
  /** Pointer in world-ish units, already smoothed. */
  pointer: new THREE.Vector2(999, 999),
  /** Seconds since mount. */
  time: 0,
  /** True when the light theme is active — scenes switch blending on it. */
  light: false,
  /** Particle budget for the current device tier. */
  count: 6000,
};

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/** Pull the CSS-published scroll values. One clock for CSS, GSAP and the GPU. */
export function readScrollVars(css: CSSStyleDeclaration) {
  frame.progress = num(css.getPropertyValue("--scroll-progress"));
  frame.heroProgress = num(css.getPropertyValue("--hero-progress"));
  frame.heroSettle = num(css.getPropertyValue("--hero-settle"));
}
