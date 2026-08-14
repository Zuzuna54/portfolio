import * as THREE from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import {
  uniform, smoothstep, positionLocal,
} from "three/tsl";
import { frame } from "../store";
import { beaconPositionCPU } from "../lighting";
import type { Scene3D, SceneFactory } from "../types";

/**
 * `keyboard` — the home hero. A backlit chiclet keyboard seen from above and
 * slightly angled, whose keys depress as you scroll.
 *
 * Built to a set of reference photographs, and the four things that make those
 * photographs read as a keyboard rather than as a grid of boxes are, in order
 * of how much they matter:
 *
 *   1. **The rim.** Backlight escapes around the *edge* of every cap, so each
 *      key is a black top inside a bright outline. This is the whole look. It
 *      is not a glowing plate seen through gaps — that reads as a lit slab.
 *   2. **Legends.** Glowing letters. Without them it is furniture, not a
 *      keyboard, and no amount of lighting fixes that.
 *   3. **Chiclet caps** — rounded corners, flat tops, islanded.
 *   4. **Looking down at it**, around 60°, not along it.
 *
 * **Instanced, not raymarched.** 75 caps of eight widths in staggered rows is
 * either a uniform grid (stops reading as a keyboard) or 75 SDF tests × 40+
 * march steps per pixel. Instanced geometry is ~10 draw calls.
 *
 * **Presses move the instance matrices on the CPU**, not a `positionNode`: the
 * shadow pass renders with its own depth material, so a vertex displacement can
 * light a key in one place and leave its shadow behind. 75 matrix composes a
 * frame is free.
 *
 * **Press is a pure function of scroll position**, so scrolling back un-presses
 * exactly and there is no state to desync on a route change.
 */

const U = 0.86;          // one key unit
const GAP = 0.13;        // island gap between caps
const CAP_H = 0.30;      // cap thickness — chiclet, so shallow
const RADIUS = 0.075;    // corner radius — chiclet, not pill
const BEVEL = 0.02;      // ExtrudeGeometry adds this at BOTH ends of the depth
/** True top surface of a cap. Legends sit just above this, not above CAP_H. */
const CAP_TOP = 0.30 + 0.02;

/** Rows as [label, width] pairs. Every row sums to 15u. */
const ROWS: [string, number][][] = [
  [["esc", 1], ...("F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12".split(" ").map((l) => [l, 1] as [string, number])), ["del", 2]],
  [["~", 1], ...("1 2 3 4 5 6 7 8 9 0 - =".split(" ").map((l) => [l, 1] as [string, number])), ["⌫", 2]],
  [["⇥", 1.5], ...("Q W E R T Y U I O P [ ]".split(" ").map((l) => [l, 1] as [string, number])), ["\\", 1.5]],
  [["⇪", 1.75], ...("A S D F G H J K L ; '".split(" ").map((l) => [l, 1] as [string, number])), ["⏎", 2.25]],
  [["⇧", 2.25], ...("Z X C V B N M , . /".split(" ").map((l) => [l, 1] as [string, number])), ["⇧", 2.75]],
  [["fn", 1.25], ["ctrl", 1.25], ["alt", 1.25], ["cmd", 1.25], ["", 6.25], ["cmd", 1.25], ["alt", 1.25], ["ctrl", 1.25]],
];

const smoothstepF = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

const TAU = Math.PI * 2;
const CYCLES = 42;
/** Legend atlas: cells per side. 10×10 = 100 slots for 75 keys. */
const GRID = 10;
const CELL = 128;

type Key = { x: number; z: number; w: number; label: string; seed: number; slot: number };

function buildLayout(): Key[] {
  const keys: Key[] = [];
  const totalDepth = ROWS.length * U;

  ROWS.forEach((row, r) => {
    const rowWidth = row.reduce((a, [, w]) => a + w, 0) * U;
    let x = -rowWidth / 2;
    const z = -totalDepth / 2 + r * U + U / 2;

    row.forEach(([label, w]) => {
      keys.push({
        x: x + (w * U) / 2,
        z,
        w,
        label,
        // Golden-ratio sequence: evenly spread, never clustering, deterministic.
        seed: (keys.length * 0.61803398875) % 1,
        slot: keys.length,
      });
      x += w * U;
    });
  });

  return keys;
}

/**
 * A rounded-rect cap, extruded. Built per unique width rather than scaling one
 * geometry, because scaling a rounded rect in X stretches its corner radius —
 * survivable on a 1.25u modifier, obvious on a 6.25u space bar.
 */
function capGeometry(w: number): THREE.BufferGeometry {
  const width = w * U - GAP;
  const depth = U - GAP;
  const r = Math.min(RADIUS, depth / 2 - 0.01);
  const x = -width / 2;
  const y = -depth / 2;

  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + depth - r);
  shape.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
  shape.lineTo(x + r, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: CAP_H,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 1,
    curveSegments: 4,
  });
  // Extrude runs along +Z; stand it up so the cap's thickness is world Y.
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Draws every legend into one canvas so all 75 keys cost a single texture. */
function legendAtlas(labels: string[]): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = GRID * CELL;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  labels.forEach((label, i) => {
    if (!label) return;
    const cx = (i % GRID) * CELL + CELL / 2;
    const cy = Math.floor(i / GRID) * CELL + CELL / 2;
    // Long labels shrink so "ctrl" and "W" both sit inside their cell — which
    // is what real caps do.
    const size = label.length > 2 ? 34 : label.length > 1 ? 46 : 66;
    ctx.font = `500 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText(label, cx, cy);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const TIER = {
  high: { shadowMap: 1024, dprScale: 1 },
  mid: { shadowMap: 512, dprScale: 0.85 },
  low: { shadowMap: 0, dprScale: 0.7 },
} as const;

export const createKeyboard: SceneFactory = ({ tier }): Scene3D => {
  const cfg = TIER[tier];
  const keys = buildLayout();
  const group = new THREE.Group();

  // Looking down at a board that recedes away from the viewer. The sign is the
  // whole thing: the camera is at +Z looking along -Z, so a POSITIVE rotation
  // about X carries local -Z up-and-away and local +Z down-and-near. That gives
  // the reference perspective — space bar nearest and widest, function row
  // receding to a narrower far edge. Negative does the exact opposite and tips
  // the F-row toward the viewer.
  // The Y here is measured, not eyeballed: the board's projected bounding box
  // is centred in the viewport at this value. Because the board is tilted, its
  // visual centre is nowhere near its origin, so "looks about right" and
  // "actually centred" differ by well over a world unit.
  group.rotation.x = 1.06;
  group.rotation.z = -0.012;
  group.position.set(0, 0.33, 3.2);
  group.scale.setScalar(1.22);

  // Raised at the back on its feet, like a real board. This is what lets the
  // beacon rake the full surface instead of hitting a flat plane head-on.
  const deck = new THREE.Group();
  deck.rotation.x = 0.11;
  group.add(deck);

  // Backlight colour — warm gold rather than the reference photographs' cool
  // blue-white, so the hero belongs to the same site as the gold links and
  // rules. The red channel is deliberately above 1: this is a light, and
  // clamping it to sRGB white washes the warmth straight back out.
  const GLOW = new THREE.Color(1.12, 0.84, 0.42);
  const uGlow = uniform(new THREE.Color().copy(GLOW));
  const uRim = uniform(0);

  // ---- caps ---------------------------------------------------------------
  // Black tops, glowing edges. `normalLocal.y` is ~1 on the flat top and ~0 on
  // the sides, so this lights the rim and leaves the top dark — the outline
  // effect that makes the reference photos read as keys.
  const capMat = new MeshStandardNodeMaterial({
    roughness: 0.42,
    metalness: 0.15,
    transparent: true,
  });
  // Driven off `positionLocal.y`, not the normal. A cap spans y −BEVEL…CAP_TOP,
  // so this is brightest at the base — where a backlight actually escapes — and
  // dark by the time it reaches the top face. Two reasons over a normal-based
  // ramp: it is what the reference photographs actually show, and `normalLocal`
  // on an ExtrudeGeometry did not discriminate top from side here at all, which
  // lit every cap uniformly and turned the board into flat grey.
  //
  // `smoothstep(low, high, x)` also needs its edges ascending — descending is
  // undefined and silently resolves to 1 everywhere. Ramp up, then invert.
  capMat.emissiveNode = uGlow
    .mul(smoothstep(0.0, CAP_TOP * 0.8, positionLocal.y).oneMinus())
    .mul(uRim);

  // One InstancedMesh per unique width, so corner radii stay true.
  const byWidth = new Map<number, Key[]>();
  keys.forEach((k) => {
    if (!byWidth.has(k.w)) byWidth.set(k.w, []);
    byWidth.get(k.w)!.push(k);
  });

  const capMeshes: { mesh: THREE.InstancedMesh; keys: Key[] }[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  byWidth.forEach((group_, w) => {
    const geo = capGeometry(w);
    geometries.push(geo);
    const mesh = new THREE.InstancedMesh(geo, capMat, group_.length);
    mesh.castShadow = cfg.shadowMap > 0;
    mesh.receiveShadow = cfg.shadowMap > 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    deck.add(mesh);
    capMeshes.push({ mesh, keys: group_ });
  });

  // ---- legends ------------------------------------------------------------
  // One merged mesh of 75 quads, each carrying baked UVs into the atlas, drawn
  // with a plain `map` on a standard material.
  //
  // This deliberately avoids both instancing and TSL texture sampling. The
  // instanced version drew (the draw call was there in `renderer.info`) and
  // produced nothing — including when the UV was hard-coded to a cell that
  // definitely had ink in it, which rules out the UV maths and the canvas. One
  // mesh with baked UVs has no per-instance attribute and no node graph to be
  // wrong, and the vertex count is 300, so moving them per frame is free.
  const atlas = legendAtlas(keys.map((k) => k.label));

  const legendGeo = new THREE.BufferGeometry();
  const lPos = new Float32Array(keys.length * 4 * 3);
  const lUv = new Float32Array(keys.length * 4 * 2);
  const lIdx: number[] = [];
  const CELL_UV = 1 / GRID;

  keys.forEach((k, i) => {
    // Square, so a long label scales down rather than stretching wide.
    const half = (Math.min(k.w * U, U) * 0.62) / 2;
    const b = i * 4;
    const corners: [number, number][] = [[-half, -half], [half, -half], [half, half], [-half, half]];
    corners.forEach(([dx, dz], j) => {
      lPos[(b + j) * 3] = k.x + dx;
      lPos[(b + j) * 3 + 1] = CAP_TOP + 0.02;
      lPos[(b + j) * 3 + 2] = k.z + dz;
    });

    const u0 = (k.slot % GRID) * CELL_UV;
    const v0 = 1 - (Math.floor(k.slot / GRID) + 1) * CELL_UV;
    // -z is the far edge of the cap, which is the TOP of the glyph cell.
    const quadUV: [number, number][] = [
      [u0, v0 + CELL_UV], [u0 + CELL_UV, v0 + CELL_UV],
      [u0 + CELL_UV, v0], [u0, v0],
    ];
    quadUV.forEach(([tu, tv], j) => {
      lUv[(b + j) * 2] = tu;
      lUv[(b + j) * 2 + 1] = tv;
    });

    lIdx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  });

  legendGeo.setAttribute("position", new THREE.BufferAttribute(lPos, 3));
  legendGeo.setAttribute("uv", new THREE.BufferAttribute(lUv, 2));
  legendGeo.setIndex(lIdx);
  legendGeo.computeVertexNormals();

  const legendMat = new THREE.MeshBasicMaterial({
    map: atlas,
    transparent: true,
    depthWrite: false,
    // DoubleSide so winding can't silently hide them.
    side: THREE.DoubleSide,
    // depthTest off, and this is the actual reason the earlier attempts drew
    // nothing: the quads sit a hair above the cap tops, and with near 0.1 /
    // far 200 the depth buffer cannot resolve a 0.006-unit gap at this
    // distance, so every legend was depth-rejected by the cap beneath it. The
    // draw call was there the whole time. Nothing else is in front of these, so
    // skipping the test is free.
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const legends = new THREE.Mesh(legendGeo, legendMat);
  legends.frustumCulled = false;
  legends.renderOrder = 2;
  deck.add(legends);

  // ---- plate --------------------------------------------------------------
  // Dark, and only faintly lit. The rim does the work; a bright plate turns the
  // whole board back into a glowing slab.
  const boardW = 15 * U + U * 0.5;
  const boardD = ROWS.length * U + U * 0.5;
  const plateGeo = new THREE.BoxGeometry(boardW, 0.4, boardD);
  const plateMat = new MeshStandardNodeMaterial({
    roughness: 0.95,
    metalness: 0,
    transparent: true,
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = -0.2;
  plate.receiveShadow = cfg.shadowMap > 0;
  deck.add(plate);

  // ---- the beacon ---------------------------------------------------------
  // Still the site's one moving light, now grazing the cap tops so a highlight
  // travels across the board as you scroll. Penumbra 0 keeps edges hard.
  const spot = new THREE.SpotLight(GLOW, 13, 0, 1.1, 0, 1.8);
  spot.castShadow = cfg.shadowMap > 0;
  if (cfg.shadowMap > 0) {
    spot.shadow.mapSize.set(cfg.shadowMap, cfg.shadowMap);
    spot.shadow.camera.near = 0.5;
    spot.shadow.camera.far = 40;
    spot.shadow.bias = -0.002;
  }
  spot.target.position.set(0, 0, 0);
  deck.add(spot, spot.target);

  const amb = new THREE.AmbientLight(GLOW, 0.05);
  deck.add(amb);

  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const lightPos = new THREE.Vector3();

  let opacity = 0;

  return {
    object: group,
    dprScale: cfg.dprScale,
    shadows: cfg.shadowMap > 0,

    update() {
      const p = frame.progress;
      const energy = frame.energy;

      const pressOf = (k: Key) =>
        smoothstepF(0.86, 1.0, Math.sin(p * CYCLES + k.seed * TAU));

      for (const { mesh, keys: ks } of capMeshes) {
        for (let i = 0; i < ks.length; i++) {
          const k = ks[i];
          const press = pressOf(k);
          const depth = press * (0.11 + energy * 0.05);
          pos.set(k.x, -depth, k.z);
          // Geometry is already built at the right width, so no X/Z scaling —
          // only the press tilt varies.
          euler.set(press * 0.04, 0, 0);
          quat.setFromEuler(euler);
          scl.set(1, 1, 1);
          m.compose(pos, quat, scl);
          mesh.setMatrixAt(i, m);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }

      // Legends ride their cap down. Four vertices each, written straight into
      // the merged position buffer — 300 floats, cheaper than 75 matrices.
      for (let i = 0; i < keys.length; i++) {
        const press = pressOf(keys[i]);
        const y = CAP_TOP + 0.02 - press * (0.11 + energy * 0.05);
        const b = i * 4;
        lPos[b * 3 + 1] = y;
        lPos[(b + 1) * 3 + 1] = y;
        lPos[(b + 2) * 3 + 1] = y;
        lPos[(b + 3) * 3 + 1] = y;
      }
      legendGeo.attributes.position.needsUpdate = true;

      beaconPositionCPU(lightPos, frame.time, p, frame.pointer, 1);
      spot.position.copy(lightPos);

      spot.intensity = 13 * opacity;
      amb.intensity = 0.05 * opacity;
      uRim.value = 0.85 * opacity;
      legendMat.opacity = 0.62 * opacity;
    },

    setOpacity(v) {
      opacity = v;
      capMat.opacity = v;
      plateMat.opacity = v;
    },

    dispose() {
      geometries.forEach((g) => g.dispose());
      legendGeo.dispose();
      plateGeo.dispose();
      capMat.dispose();
      legendMat.dispose();
      plateMat.dispose();
      atlas.dispose();
      capMeshes.forEach(({ mesh }) => mesh.dispose());
      spot.dispose();
    },
  };
};
