/**
 * Target positions the particle field morphs between.
 *
 * The hero's whole idea is that scattered noise resolves into a recognisable
 * architecture diagram — the same pipeline the case studies describe. So the
 * formations aren't decorative shapes; they're the actual node/edge topology of
 * a queue-driven system, laid out so an engineer reads it as one.
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

/** Scattered cloud: the pre-boot state. */
export function scatter(count: number, spread = 14): Formation {
  const out = new Float32Array(count * 3);
  const r = rng(0x5eed);
  for (let i = 0; i < count; i++) {
    // Cube-root keeps density even through the volume instead of clumping
    // everything at the centre, which is what uniform radius does.
    const radius = spread * Math.cbrt(r());
    const theta = r() * Math.PI * 2;
    const phi = Math.acos(2 * r() - 1);
    out[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.55;
    out[i * 3 + 2] = radius * Math.cos(phi) * 0.4;
  }
  return out;
}

type Node = { x: number; y: number; z: number; weight: number };
type Edge = [number, number];

// A queue-driven pipeline: source → fan-out across workers → single store →
// two query surfaces. Deliberately the shape described in the case studies.
const NODES: Node[] = [
  { x: -9.5, y: 0, z: 0, weight: 1.1 },   // 0 ingest
  { x: -5.5, y: 0, z: 0, weight: 1.0 },   // 1 queues
  { x: -1.2, y: 3.4, z: 0.4, weight: 0.85 },
  { x: -1.2, y: 1.7, z: -0.3, weight: 0.85 },
  { x: -1.2, y: 0, z: 0.5, weight: 0.85 },
  { x: -1.2, y: -1.7, z: -0.4, weight: 0.85 },
  { x: -1.2, y: -3.4, z: 0.2, weight: 0.85 },
  { x: 3.4, y: 0, z: 0, weight: 1.25 },   // 7 store (single writer)
  { x: 8.2, y: 1.9, z: 0.3, weight: 0.95 },
  { x: 8.2, y: -1.9, z: -0.3, weight: 0.95 },
];

const EDGES: Edge[] = [
  [0, 1],
  [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
  [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
  [7, 8], [7, 9],
];

/**
 * The architecture graph: particles distributed along edges with clusters at
 * nodes. Weighted so edges get most of the population — the connections are
 * what make it read as a pipeline rather than a constellation.
 */
export function graph(count: number): Formation {
  const out = new Float32Array(count * 3);
  const r = rng(0xa11ce);
  const nodeShare = Math.floor(count * 0.34);

  for (let i = 0; i < nodeShare; i++) {
    const n = NODES[i % NODES.length];
    // Gaussian-ish clump via summed uniforms; cheaper than Box–Muller and
    // indistinguishable at this scale.
    const j = () => (r() + r() + r() - 1.5) * 0.42 * n.weight;
    out[i * 3] = n.x + j();
    out[i * 3 + 1] = n.y + j();
    out[i * 3 + 2] = n.z + j() * 0.6;
  }

  for (let i = nodeShare; i < count; i++) {
    const e = EDGES[(i - nodeShare) % EDGES.length];
    const a = NODES[e[0]], b = NODES[e[1]];
    const t = r();
    const j = () => (r() - 0.5) * 0.14;
    out[i * 3] = a.x + (b.x - a.x) * t + j();
    out[i * 3 + 1] = a.y + (b.y - a.y) * t + j();
    out[i * 3 + 2] = a.z + (b.z - a.z) * t + j();
  }
  return out;
}

/** Flat drift field the scene settles into once the hero scrolls away. */
export function field(count: number): Formation {
  const out = new Float32Array(count * 3);
  const r = rng(0xf1e1d);
  for (let i = 0; i < count; i++) {
    out[i * 3] = (r() - 0.5) * 26;
    out[i * 3 + 1] = (r() - 0.5) * 13;
    out[i * 3 + 2] = (r() - 0.5) * 6;
  }
  return out;
}
