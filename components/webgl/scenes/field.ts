import * as THREE from "three";
import {
  Fn, vec3, float, uniform, instancedBufferAttribute, mix, smoothstep,
  clamp, sin, cos, length, normalize, uv,
} from "three/tsl";
import { SpriteNodeMaterial } from "three/webgpu";
import { frame } from "../store";
import { scatter, graph, field as driftField } from "../formations";
import type { Scene3D, SceneFactory } from "../types";

/**
 * The shared particle substrate, written once in TSL.
 *
 * **Instanced sprites, not THREE.Points.** WebGPU has no equivalent of
 * gl_PointSize — point primitives are locked to a single pixel — and three.js
 * carries that limitation through: PointsNodeMaterial's `size` is silently
 * ignored under WebGPURenderer (three.js #30612). That failure is unusually
 * hard to diagnose because everything reports success: the material compiles,
 * the renderer reports 14,000 points drawn per frame, nothing is logged, and
 * the screen stays black.
 *
 * SpriteNodeMaterial over an InstancedMesh is the supported pattern. Each
 * particle is a billboarded quad sized in world space, so it behaves the same
 * on both backends.
 *
 * TSL rather than GLSL means one node graph compiles to WGSL on WebGPU and to
 * GLSL on the WebGL2 fallback — and it was the previous hand-written GLSL pair
 * that produced the precision mismatch which stopped the shader linking at all.
 */
export const createField: SceneFactory = ({ count, light }): Scene3D => {
  const s = scatter(count), gr = graph(count), df = driftField(count);
  const seeds = new Float32Array(count);
  // Golden-ratio sequence: even distribution without clustering, deterministic
  // so the scene is identical on every load.
  for (let i = 0; i < count; i++) seeds[i] = (i * 0.61803398875) % 1;

  const aScatter = new THREE.InstancedBufferAttribute(s, 3);
  const aGraph = new THREE.InstancedBufferAttribute(gr, 3);
  const aField = new THREE.InstancedBufferAttribute(df, 3);
  const aSeed = new THREE.InstancedBufferAttribute(seeds, 1);

  const u = {
    progress: uniform(0),
    settle: uniform(0),
    time: uniform(0),
    velocity: uniform(0),
    opacity: uniform(0),
    pointer: uniform(new THREE.Vector2(999, 999)),
    gold: uniform(new THREE.Color("#e8a72c")),
    violet: uniform(new THREE.Color("#9b4dff")),
    crimson: uniform(new THREE.Color("#e0143c")),
  };

  const material = new SpriteNodeMaterial({
    transparent: true,
    depthWrite: false,
    // Additive accumulates into light on the dark ground; on paper it does
    // nothing at all, because adding to white is white.
    blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
  });

  const nScatter = instancedBufferAttribute<"vec3">(aScatter);
  const nGraph = instancedBufferAttribute<"vec3">(aGraph);
  const nField = instancedBufferAttribute<"vec3">(aField);
  const nSeed = instancedBufferAttribute<"float">(aSeed);

  material.positionNode = Fn(() => {
    // Per-particle offset so the formation resolves as a wave rather than
    // snapping into place all at once.
    const stagger = clamp(u.progress.sub(nSeed.mul(0.35)).div(0.65), 0, 1);
    const eased = stagger.mul(stagger).mul(float(3).sub(stagger.mul(2)));

    let pos = mix(nScatter, nGraph, eased);
    pos = mix(pos, nField, u.settle);

    // Idle drift, so a formed graph breathes rather than freezing.
    const t = u.time.mul(0.25).add(nSeed.mul(6.2831));
    pos = pos.add(
      vec3(sin(t), cos(t.mul(0.9)), sin(t.mul(0.7)))
        .mul(0.06)
        .mul(float(1).sub(u.settle.mul(0.5))),
    );

    // Scroll velocity smears the field along Y and pushes it back in Z: a fast
    // flick stretches it, stopping lets it settle. Signed, so scrolling back
    // pulls the other way.
    const smear = u.velocity.mul(2.4);
    pos = pos.add(vec3(0, smear.mul(nSeed.add(0.4)), smear.abs().mul(-0.6)));

    // Pointer repulsion, falling off sharply so it reads as touch rather than
    // a global warp.
    const d = pos.xy.sub(u.pointer);
    const push = smoothstep(3.2, 0, length(d)).mul(0.9);
    pos = pos.add(vec3(normalize(d.add(1e-5)).mul(push), 0));

    return pos;
  })();

  // World-space size. At a camera distance of 17 with a 46° fov the viewport
  // spans ~14.4 units, so 0.075 lands around 6px — close to what the old
  // gl_PointSize maths produced, and now identical on both backends.
  material.scaleNode = float(0.07);

  material.colorNode = Fn(() => {
    // Palette split on the particle's own seed, so the field carries all three
    // site accents rather than one flat hue.
    const col = mix(u.violet, u.gold, smoothstep(0.35, 0.75, nSeed)).toVar();
    return mix(col, u.crimson, smoothstep(0.86, 1.0, nSeed));
  })();

  material.opacityNode = Fn(() => {
    // Round sprite: fade out the corners of the quad.
    const c = uv().sub(0.5);
    const r = c.dot(c);
    const disc = float(1).sub(smoothstep(0.16, 0.25, r));
    // Tuned against the real page. At 0.34 base the field competed with body
    // copy sitting over it; at 0.09 it vanished. This sits between.
    //
    // Judge the final value on a real screen, not on a screenshot: JPEG
    // compression crushes faint additive violet against the near-black ground,
    // so captures consistently under-represent how present the field is.
    return float(0.22).add(u.progress.mul(0.35)).mul(disc).mul(u.opacity);
  })();

  const geometry = new THREE.PlaneGeometry(1, 1);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  // The shader places every instance, so three must not cull against the
  // default per-instance matrices.
  mesh.frustumCulled = false;
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

  return {
    object: mesh,
    update() {
      u.progress.value = frame.heroProgress;
      u.settle.value = frame.heroSettle;
      u.time.value = frame.time;
      u.velocity.value = frame.velocity;
      u.pointer.value.copy(frame.pointer);
      material.blending = frame.light ? THREE.NormalBlending : THREE.AdditiveBlending;
    },
    setOpacity(v) {
      u.opacity.value = v;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
};
