"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMotion } from "@/components/motion/MotionProvider";
import { useDeviceTier, tierBelow, configFor, type Tier } from "./useDeviceTier";
import { scatter, graph, field } from "./formations";

/* ------------------------------------------------------------------ shaders */

const VERT = /* glsl */ `
  // Explicitly mediump. uProgress is shared with the fragment shader, which
  // declares 'precision mediump float' for fill-rate reasons; a uniform whose
  // precision differs between the two stages fails to link with
  // "Precisions of uniform 'uProgress' differ between VERTEX and FRAGMENT".
  // Qualifying it here keeps the fragment shader's mediump default intact
  // rather than forcing the whole thing to highp.
  uniform mediump float uProgress;   // 0 scatter → 1 graph
  uniform float uSettle;     // 0 graph → 1 drift field
  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uSize;

  attribute vec3 aScatter;
  attribute vec3 aGraph;
  attribute vec3 aField;
  attribute float aSeed;

  varying float vSeed;
  varying float vDepth;

  void main() {
    // Per-particle offset so the formation resolves as a wave rather than all
    // at once — the difference between "assembling" and "snapping".
    float stagger = clamp((uProgress - aSeed * 0.35) / 0.65, 0.0, 1.0);
    float eased = stagger * stagger * (3.0 - 2.0 * stagger);

    vec3 pos = mix(aScatter, aGraph, eased);
    pos = mix(pos, aField, uSettle);

    // Idle drift so the graph breathes instead of freezing once formed.
    float t = uTime * 0.25 + aSeed * 6.2831;
    pos += vec3(sin(t), cos(t * 0.9), sin(t * 0.7)) * 0.06 * (1.0 - uSettle * 0.5);

    // Pointer repulsion in world space, falling off sharply so it reads as
    // touch rather than a global warp.
    vec2 d = pos.xy - uPointer;
    float dist = length(d);
    float push = smoothstep(3.2, 0.0, dist) * 0.9;
    pos.xy += normalize(d + 1e-5) * push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mv.z;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.0 / max(vDepth, 0.6));
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uGold;
  uniform vec3 uViolet;
  uniform vec3 uCrimson;
  uniform mediump float uProgress;   // must match the vertex stage exactly
  varying float vSeed;
  varying float vDepth;

  void main() {
    // Round point sprite; discard early so overdraw stays cheap.
    vec2 c = gl_PointCoord - 0.5;
    float r = dot(c, c);
    if (r > 0.25) discard;

    // Three-way palette split keyed on the particle's own seed, so the field
    // carries the site's colours rather than one flat hue.
    vec3 col = mix(uViolet, uGold, smoothstep(0.35, 0.75, vSeed));
    col = mix(col, uCrimson, smoothstep(0.86, 1.0, vSeed));

    // Unformed particles sit back; the graph reads brighter as it resolves.
    // Tuned against the actual ground colour, not guessed: at 0.16 base the
    // field was invisible on near-black until a debug background proved it
    // had been rendering correctly the whole time.
    float alpha = (0.30 + 0.55 * uProgress) * smoothstep(34.0, 3.0, vDepth);
    alpha *= 1.0 - smoothstep(0.16, 0.25, r);
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ------------------------------------------------------------------- points */

function Points({
  count,
  light,
  onFps,
}: {
  count: number;
  light: boolean;
  onFps: (fps: number) => void;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const s = scatter(count), gr = graph(count), f = field(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = (i * 0.61803398875) % 1;
    g.setAttribute("position", new THREE.BufferAttribute(s.slice(), 3));
    g.setAttribute("aScatter", new THREE.BufferAttribute(s, 3));
    g.setAttribute("aGraph", new THREE.BufferAttribute(gr, 3));
    g.setAttribute("aField", new THREE.BufferAttribute(f, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    // The shader positions everything; without an explicit sphere three.js
    // frustum-culls the whole cloud based on the scatter bounds.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    return g;
  }, [count]);

  useEffect(() => () => geom.dispose(), [geom]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uSettle: { value: 0 },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(999, 999) },
      uSize: { value: 34 },
      uGold: { value: new THREE.Color("#e8a72c") },
      uViolet: { value: new THREE.Color("#9b4dff") },
      uCrimson: { value: new THREE.Color("#e0143c") },
    }),
    [],
  );

  // FPS sampling lives in the render loop rather than a rAF of its own, so it
  // measures the frames that are actually being drawn.
  const frames = useRef(0);
  const last = useRef(performance.now());

  useFrame((state, delta) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value += delta;

    // Scroll drives formation. Written by the page to :root, read here — one
    // scroll clock for CSS, GSAP and WebGL alike.
    const css = getComputedStyle(document.documentElement);
    const p = parseFloat(css.getPropertyValue("--hero-progress") || "0");
    const s = parseFloat(css.getPropertyValue("--hero-settle") || "0");
    u.uProgress.value = THREE.MathUtils.damp(u.uProgress.value, p, 6, delta);
    u.uSettle.value = THREE.MathUtils.damp(u.uSettle.value, s, 5, delta);

    const px = (state.pointer.x * size.width) / size.height;
    u.uPointer.value.lerp(new THREE.Vector2(px * 9, state.pointer.y * 6), 0.12);
    u.uSize.value = 34 * Math.min(state.viewport.dpr, 2);

    frames.current++;
    const now = performance.now();
    if (now - last.current >= 1000) {
      onFps((frames.current * 1000) / (now - last.current));
      frames.current = 0;
      last.current = now;
    }
  });

  return (
    <points geometry={geom} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        // Additive is right on the dark ground — particles accumulate into
        // light. On paper it does nothing at all, because adding to white is
        // white, so the light theme falls back to normal blending.
        blending={light ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------- canvas */

export default function ParticleField() {
  const { enabled } = useMotion();
  const initial = useDeviceTier();
  const [tier, setTier] = useState<Tier>(initial.tier);
  const strikes = useRef(0);

  useEffect(() => setTier(initial.tier), [initial.tier]);

  const cfg = configFor(tier);

  /**
   * Watchdog. Two consecutive seconds under 24fps drops a tier; three under
   * 50 on `high` steps down once. Requiring consecutive samples keeps a single
   * GC pause or a background tab from downgrading a capable machine.
   *
   * It only ever steps down. Oscillating between tiers is more distracting
   * than simply running at the lower one.
   */
  const onFps = (fps: number) => {
    const bad = fps < 24 || (tier === "high" && fps < 50);
    strikes.current = bad ? strikes.current + 1 : 0;
    if (strikes.current >= 2) {
      strikes.current = 0;
      setTier((t) => tierBelow(t));
    }
  };

  // Stop rendering entirely when the hero leaves the viewport. This is the
  // largest saving available: without it, a 40k-point additive-blended scene
  // keeps a GPU busy for the entire length of the page while the visitor reads
  // text that isn't near it. On a laptop that's fan noise; on a phone it's
  // battery and thermal throttling that then degrades the rest of the session.
  const host = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  // Blending mode depends on the theme, so the scene has to know about it.
  const [light, setLight] = useState(false);
  useEffect(() => {
    const read = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      setLight(
        attr === "light" ||
          (attr !== "dark" && window.matchMedia("(prefers-color-scheme: light)").matches),
      );
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", read);
    return () => { obs.disconnect(); mq.removeEventListener("change", read); };
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!enabled || tier === "off" || cfg.count === 0) return null;

  return (
    <div className="particles" aria-hidden="true" data-tier={tier} ref={host}>
      <Canvas
        dpr={[1, cfg.dpr]}
        camera={{ position: [0, 0, 17], fov: 46 }}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        frameloop={onScreen ? "always" : "never"}
      >
        <Points count={cfg.count} light={light} onFps={onFps} />
      </Canvas>
    </div>
  );
}
