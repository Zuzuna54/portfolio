import * as THREE from "three";
import { vec3, float, sin, cos } from "three/tsl";
import type Node from "three/src/nodes/core/Node.js";

/**
 * The beacon — the site's one moving light.
 *
 * Extracted so every scene shares one rig rather than each re-deriving its own.
 * The light was the part of the first background that worked; only the geometry
 * it fell on was wrong. Keeping it in one place is what stops six scenes from
 * drifting into six different-looking sites.
 *
 * It exists in two forms because the scenes shade in two different ways: the
 * keyboard uses real three.js lights and a shadow map, the particle scenes shade
 * in TSL. Both read from `ORBIT` so they cannot drift apart.
 */

/** Brand palette, matching the OKLCH tokens in `_tokens.scss`. */
export const PALETTE = {
  gold: new THREE.Color("#e8a72c"),
  violet: new THREE.Color("#9b4dff"),
  crimson: new THREE.Color("#e0143c"),
  /**
   * Network cyan — the constellation mesh on the five route scenes.
   *
   * Not one of the site's three brand accents, and that is deliberate: the
   * reference for the mesh is cool cyan, and it reads as a *different layer* of
   * the page from the gold hero rather than competing with it. Gold stays the
   * hero and the interactive colour; cyan is structure.
   */
  cyan: new THREE.Color("#4fd6e8"),
  cyanDim: new THREE.Color("#1d6f7e"),
  /** Light-theme ink. Additive gold on paper is invisible, so the light theme
   *  draws with shadow rather than with highlight. */
  ink: new THREE.Color("#100d16"),
};

/**
 * The orbit.
 *
 * `height` is deliberately low. A high light lands near-normal on every
 * up-facing surface, lighting everything evenly and casting stubs — the shadows
 * stop being the subject. Down here it rakes: shadows run long across the deck
 * and the geometry reads as occupying space.
 *
 * Driven by time *and* scroll, so shadows sweep as the page moves. The pointer
 * term is what makes the light feel attached to the reader rather than a timer.
 */
export const ORBIT = {
  radiusX: 7.4,
  radiusZ: 5.4,
  height: 2.35,
  offsetZ: 2.2,
  /** rad/s */
  rate: 0.32,
  /** How far a full page scroll pushes the orbit, in radians. */
  scrollSweep: 3.4,
  bobRate: 0.25,
  bobAmount: 0.7,
  /**
   * How hard the pointer drags the beacon. `frame.pointer` arrives in world-ish
   * units (roughly ±12 × ±7), so these are small multipliers — but they were
   * small enough that the light read as being on a timer rather than attached
   * to the reader. Raised so moving the mouse visibly sweeps the highlight.
   */
  pointerX: 0.85,
  pointerZ: 0.62,
};

/** CPU form, for scenes using real `THREE.Light`s. */
export function beaconPositionCPU(
  out: THREE.Vector3,
  time: number,
  progress: number,
  pointer: THREE.Vector2,
  scale = 1,
) {
  const a = time * ORBIT.rate + progress * ORBIT.scrollSweep;
  return out.set(
    (Math.sin(a) * ORBIT.radiusX + pointer.x * ORBIT.pointerX) * scale,
    (ORBIT.height + Math.sin(time * ORBIT.bobRate) * ORBIT.bobAmount) * scale,
    (Math.cos(a) * ORBIT.radiusZ + ORBIT.offsetZ + pointer.y * ORBIT.pointerZ) * scale,
  );
}

/** TSL form, for scenes shading in the node graph. */
export function beaconPositionTSL(
  time: Node<"float">,
  progress: Node<"float">,
  pointer: Node<"vec2">,
) {
  const a = time.mul(ORBIT.rate).add(progress.mul(ORBIT.scrollSweep));
  return vec3(
    sin(a).mul(ORBIT.radiusX).add(pointer.x.mul(ORBIT.pointerX)),
    float(ORBIT.height).add(sin(time.mul(ORBIT.bobRate)).mul(ORBIT.bobAmount)),
    cos(a).mul(ORBIT.radiusZ).add(ORBIT.offsetZ).add(pointer.y.mul(ORBIT.pointerZ)),
  );
}

/**
 * Distance falloff, softened well away from true inverse-square.
 *
 * Physically correct falloff sends everything past the first row to black. This
 * is a background that has to stay legible behind body text, not a render.
 */
export function attenuationTSL(dist: Node<"float">) {
  return float(1).div(float(1).add(dist.mul(dist).mul(0.018)));
}

/** Distance haze. Without it an unbounded scene ends in a hard band of noise. */
export function hazeTSL(dist: Node<"float">, rate = 0.045) {
  return dist.mul(-rate).exp();
}
