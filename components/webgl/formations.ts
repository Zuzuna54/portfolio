/**
 * Point distributions the particle scenes build their geometry from.
 *
 * One formation, `cloud`, which every route scene draws from. Earlier versions
 * carried per-route *meaning* — a node/edge pipeline diagram on the hero, queue
 * lanes and diverging streams on the route scenes — and all of it was dropped
 * for the reason `cloud` documents below: shaped formations mesh badly.
 */

export type Formation = Float32Array;

/** Deterministic PRNG — the scene must look identical on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * An even volume of points, tuned for meshing.
 *
 * The five route scenes all draw from this. Earlier versions used anisotropic
 * formations — queue lanes, diverging streams, sedimentary bands — and they
 * meshed badly: a k-nearest graph over a set of thin stripes links along the
 * stripe and nowhere else, so it reads as hatching rather than a web. An even
 * distribution is what makes the constellation look work.
 *
 * `jitter` breaks up the grid so it never reads as a lattice, while the
 * underlying cells keep the spacing regular enough that every node has
 * neighbours at a similar distance — which is what keeps link lengths, and so
 * link brightness, consistent across the field.
 */
export function cloud(
  count: number,
  { width = 30, height = 15, depth = 7, jitter = 0.62, seed = 0x0c10d } = {},
): Formation {
  const out = new Float32Array(count * 3);
  const r = rng(seed);

  // Lay out on a rough 3D grid sized to the box's proportions, then jitter.
  const cells = Math.cbrt(count / (width * height * depth));
  const nx = Math.max(1, Math.round(width * cells));
  const ny = Math.max(1, Math.round(height * cells));
  const sx = width / nx, sy = height / ny;

  for (let i = 0; i < count; i++) {
    const ix = i % nx;
    const iy = Math.floor(i / nx) % ny;
    const iz = Math.floor(i / (nx * ny));
    out[i * 3] = -width / 2 + (ix + 0.5) * sx + (r() - 0.5) * sx * jitter * 2;
    out[i * 3 + 1] = -height / 2 + (iy + 0.5) * sy + (r() - 0.5) * sy * jitter * 2;
    // Depth is fully random: the mesh should feel volumetric, not layered.
    out[i * 3 + 2] = (r() - 0.5) * depth - iz * 0.15;
  }
  return out;
}
