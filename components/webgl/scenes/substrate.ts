import * as THREE from "three";
import {
  Fn, float, uniform, uv, smoothstep, attribute, instancedBufferAttribute,
} from "three/tsl";
import { SpriteNodeMaterial, LineBasicNodeMaterial } from "three/webgpu";
import { frame } from "../store";
import { PALETTE } from "../lighting";
import { cloud } from "../formations";
import type { Scene3D } from "../types";

/**
 * The constellation network behind every route except the home page.
 *
 * Bright nodes with thin links to near neighbours, drifting on their own clock
 * and reacting to the pointer. **No scroll input at all** — scroll drives the
 * keyboard on `/` and nothing else. A background that answers the scroll on
 * every page competes with the reading; one that just breathes does not.
 *
 * **Why positions live on the CPU.** A TSL `positionNode` is far cheaper and
 * scales to tens of thousands of particles, but nothing outside the shader then
 * knows where a particle *is*, and you cannot draw a line between two points
 * that only exist on the GPU. Linking them means owning them, which means
 * hundreds rather than tens of thousands. That is the right trade: the look is a
 * sparse legible mesh, not a dense cloud.
 *
 * **Every motion term is spatially coherent.** Phase comes from a node's
 * position, never from its own seed. Seed-keyed motion moves linked neighbours
 * in different directions, stretches links past their fade range, and the mesh
 * renders as bare dots — measured at mean link length 3.58 against a range of
 * 2.4 before this was fixed. See HANDOFF §5.12.
 *
 * **Nodes are instanced sprites, not THREE.Points.** WebGPU has no
 * `gl_PointSize`; `PointsNodeMaterial.size` is silently ignored, the material
 * compiles, every point reports as drawn, and the screen stays black. §5.1.
 */

export type NetworkSpec = {
  tier: "high" | "mid" | "low";
  /** Distinguishes one route's field from another's. */
  seed?: number;
  /** Volume the nodes occupy, in world units. */
  width?: number;
  height?: number;
  depth?: number;
  /** Neighbours each node links to. 3 gives the reference's triangulated feel. */
  links?: number;
  /** Beyond this world distance a link has faded out entirely. */
  linkRange?: number;
  size?: number;
  alpha?: number;
  node?: THREE.Color;
  link?: THREE.Color;
};

/** Node budget. Every position is CPU-owned, so this is legibility, not density. */
const NODES = { high: 1150, mid: 720, low: 380 } as const;

/** How close the pointer has to be, in world units, to move a node. */
const HOVER_RADIUS = 4.6;

const smoothstepF = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Link topology, computed once from the rest positions.
 *
 * Fixed rather than rebuilt per frame: recomputing neighbours every frame makes
 * links pop in and out as nodes drift past each other, which reads as noise. A
 * fixed mesh that *fades* by current length keeps the structure legible and is
 * O(n·k) per frame instead of O(n²).
 *
 * k-nearest by insertion into a small window rather than sorting every
 * candidate list — at 1150 nodes the sort version stalls the first frame.
 */
function buildLinks(rest: Float32Array, count: number, k: number): Uint32Array {
  const pairs: number[] = [];
  const seen = new Set<number>();
  const bestJ = new Int32Array(k);
  const bestD = new Float64Array(k);

  const d2 = (a: number, b: number) => {
    const dx = rest[a * 3] - rest[b * 3];
    const dy = rest[a * 3 + 1] - rest[b * 3 + 1];
    const dz = rest[a * 3 + 2] - rest[b * 3 + 2];
    return dx * dx + dy * dy + dz * dz;
  };

  for (let i = 0; i < count; i++) {
    bestJ.fill(-1);
    bestD.fill(Infinity);

    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const d = d2(i, j);
      if (d >= bestD[k - 1]) continue;
      let p = k - 1;
      while (p > 0 && bestD[p - 1] > d) {
        bestD[p] = bestD[p - 1];
        bestJ[p] = bestJ[p - 1];
        p--;
      }
      bestD[p] = d;
      bestJ[p] = j;
    }

    for (let n = 0; n < k; n++) {
      const j = bestJ[n];
      if (j < 0) continue;
      const key = i < j ? i * count + j : j * count + i;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push(i, j);
    }
  }
  return new Uint32Array(pairs);
}

export function createNetwork({
  tier, seed = 0x0c10d, width = 30, height = 15, depth = 7,
  links = 3, linkRange = 2.4, size = 0.16, alpha = 2.2,
  node = PALETTE.cyan, link = PALETTE.cyan,
}: NetworkSpec): Scene3D {
  const count = NODES[tier];
  const rest = cloud(count, { width, height, depth, seed });
  const edges = buildLinks(rest, count, links);
  const edgeCount = edges.length / 2;

  // One buffer, read by both the nodes and the lines, so they can never
  // disagree about where a node is.
  const pos = new Float32Array(count * 3);

  // ---- nodes --------------------------------------------------------------
  const uOpacity = uniform(0);
  const nodeMat = new SpriteNodeMaterial({
    color: node,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  nodeMat.scaleNode = float(size);

  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  aPos.setUsage(THREE.DynamicDrawUsage);
  nodeMat.positionNode = instancedBufferAttribute<"vec3">(aPos);

  // Per-node brightness, so the field has depth rather than reading as one flat
  // layer of identical dots. Safe to key off the index: it never moves a node.
  const aBright = new THREE.InstancedBufferAttribute(
    Float32Array.from({ length: count }, (_, i) => 0.45 + ((i * 7919) % 100) / 100 * 0.55),
    1,
  );

  nodeMat.opacityNode = Fn(() => {
    const c = uv().sub(0.5);
    const r = c.dot(c);
    // A tight core with a soft halo: a crisp dot with a little bloom, which is
    // what the reference nodes look like.
    const core = float(1).sub(smoothstep(0.02, 0.055, r));
    const halo = float(1).sub(smoothstep(0.03, 0.25, r));
    return core.add(halo.mul(0.55))
      .mul(attribute<"float">("aBright"))
      .mul(float(alpha))
      .mul(uOpacity);
  })();

  const nodeGeo = new THREE.PlaneGeometry(1, 1);
  nodeGeo.setAttribute("aBright", aBright);
  const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, count);
  nodes.frustumCulled = false;
  nodes.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

  // ---- links --------------------------------------------------------------
  const linkPos = new Float32Array(edgeCount * 2 * 3);
  const linkAlpha = new Float32Array(edgeCount * 2);
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPos, 3));
  linkGeo.setAttribute("aAlpha", new THREE.BufferAttribute(linkAlpha, 1));

  const linkMat = new LineBasicNodeMaterial({
    color: link,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  // The type parameter is required — without it the node degrades to
  // AttributeNode<string> and nothing composes onto it. HANDOFF §5.8.
  linkMat.opacityNode = attribute<"float">("aAlpha").mul(uOpacity);

  const lines = new THREE.LineSegments(linkGeo, linkMat);
  lines.frustumCulled = false;

  const group = new THREE.Group();
  group.add(lines, nodes);

  const range2 = linkRange * linkRange;
  // Per-node hover response, eased toward its target so the mesh swells in and
  // out of a hover instead of snapping.
  const hover = new Float32Array(count);

  return {
    object: group,

    update(dt) {
      const { time, pointer } = frame;
      const step = Math.min(Math.max(dt || 1 / 60, 1 / 240), 1 / 20);

      for (let i = 0; i < count; i++) {
        const rx = rest[i * 3], ry = rest[i * 3 + 1], rz = rest[i * 3 + 2];

        // Ambient drift. Phase from position, so neighbours move together and
        // the links hold — see the note at the top of the file.
        const t = time * 0.32;
        let x = rx + Math.sin(t + ry * 0.42) * 0.34;
        let y = ry + Math.cos(t * 0.86 + rx * 0.28) * 0.30;
        let z = rz + Math.sin(t * 0.63 + rx * 0.2) * 0.26;

        // Hover: nodes near the pointer are pushed out along the radius and
        // their links brighten with them. Eased per node rather than applied
        // instantly, so moving the cursor sweeps a swell through the mesh.
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const dist = Math.hypot(dx, dy);
        const target = dist < HOVER_RADIUS ? smoothstepF(HOVER_RADIUS, 0.6, dist) : 0;
        hover[i] += (target - hover[i]) * (1 - Math.exp(-9 * step));

        if (hover[i] > 0.001) {
          const inv = 1 / (dist || 1e-5);
          const push = hover[i] * 1.5;
          x += dx * inv * push;
          y += dy * inv * push;
          z += hover[i] * 0.8;
        }

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }

      aPos.array.set(pos);
      aPos.needsUpdate = true;

      for (let e = 0; e < edgeCount; e++) {
        const a = edges[e * 2], b = edges[e * 2 + 1];
        const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
        const bx = pos[b * 3], by = pos[b * 3 + 1], bz = pos[b * 3 + 2];
        const o = e * 6;
        linkPos[o] = ax; linkPos[o + 1] = ay; linkPos[o + 2] = az;
        linkPos[o + 3] = bx; linkPos[o + 4] = by; linkPos[o + 5] = bz;

        const ddx = ax - bx, ddy = ay - by, ddz = az - bz;
        const dd = ddx * ddx + ddy * ddy + ddz * ddz;
        // Fade with length: short links are bright structure, long ones faint
        // threads, and past `linkRange` they disappear rather than stretching
        // right across the field.
        const base = dd >= range2 ? 0 : 1 - dd / range2;
        // Links inherit the brighter end's hover, so a hovered region lights up
        // as a region rather than as isolated dots.
        const lit = hover[a] > hover[b] ? hover[a] : hover[b];
        const val = base * base * (2.1 + lit * 2.6);
        linkAlpha[e * 2] = val;
        linkAlpha[e * 2 + 1] = val;
      }
      linkGeo.attributes.position.needsUpdate = true;
      linkGeo.attributes.aAlpha.needsUpdate = true;
    },

    setOpacity(value) {
      uOpacity.value = value;
    },

    dispose() {
      nodeGeo.dispose();
      nodeMat.dispose();
      linkGeo.dispose();
      linkMat.dispose();
      nodes.dispose();
    },
  };
}
