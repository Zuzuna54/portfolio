"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { usePathname } from "next/navigation";
import { useMotion } from "@/components/motion/MotionProvider";
import { useDeviceTier, tierBelow, configFor, type Tier } from "./useDeviceTier";
import { detectBackend } from "./gpu";
import { SCENES, sceneForPath, type SceneName } from "./scenes/registry";
import { frame, readScrollVars } from "./store";
import type { Scene3D } from "./types";

/**
 * The single canvas for the whole site, driven imperatively.
 *
 * Mounted once and never unmounted, so the GPU context survives every
 * navigation — unmounting a canvas *forces* a context loss, which is why a
 * per-page canvas can never persist across routes.
 *
 * No React Three Fiber here. R3F 9.7.0 contains no WebGPU support at all and
 * v10 exists only as a canary. Its async-`gl` path silently never finishes
 * initialising: the DOM looks correct, no error is logged, and you get a
 * 300×150 drawing buffer stretched across the viewport with nothing drawn.
 * Driving three directly costs ~150 lines R3F was handling — and for a
 * background layer with no interactive 3D objects, R3F was reconciling a tree
 * that changes once per route.
 *
 * WebGPURenderer is used on *both* paths deliberately: TSL node materials
 * require a node-capable renderer, and WebGPURenderer carries its own WebGL2
 * backend via `forceWebGL`. One renderer, both backends, one shader source.
 */
export default function SceneCanvas() {
  const { enabled } = useMotion();
  const initialTier = useDeviceTier();
  const pathname = usePathname();

  const host = useRef<HTMLDivElement>(null);
  const wanted = useRef<SceneName>(sceneForPath(pathname));
  const tierRef = useRef<Tier>(initialTier.tier);

  useEffect(() => { wanted.current = sceneForPath(pathname); }, [pathname]);
  useEffect(() => { tierRef.current = initialTier.tier; }, [initialTier.tier]);

  useEffect(() => {
    if (!enabled) return;
    const el = host.current;
    if (!el) return;

    let disposed = false;
    let raf = 0;
    let renderer: WebGPURenderer | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
    camera.position.set(0, 0, 17);

    // Both scenes are alive during a cross-fade, so navigation reads as the
    // field re-forming rather than one scene vanishing and another appearing.
    let current: { name: SceneName; scene: Scene3D; opacity: number } | null = null;
    let outgoing: { scene: Scene3D; opacity: number } | null = null;

    const readTheme = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      return (
        attr === "light" ||
        (attr !== "dark" && window.matchMedia("(prefers-color-scheme: light)").matches)
      );
    };

    const mount = (name: SceneName) => {
      const cfg = configFor(tierRef.current);
      if (cfg.count === 0) return;
      const built = SCENES[name]({ count: cfg.count, light: frame.light });
      built.setOpacity(0);
      scene.add(built.object);
      if (current) {
        if (outgoing) {
          scene.remove(outgoing.scene.object);
          outgoing.scene.dispose();
        }
        outgoing = { scene: current.scene, opacity: current.opacity };
      }
      current = { name, scene: built, opacity: 0 };
    };

    const resize = () => {
      if (!renderer) return;
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, configFor(tierRef.current).dpr));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    // Watchdog: two consecutive bad seconds drop a tier. Consecutive samples
    // matter so a single GC pause doesn't permanently downgrade a capable
    // machine, and it only ever steps down — oscillating between tiers is more
    // distracting than simply running at the lower one.
    let strikes = 0, frames = 0, lastSample = performance.now();
    const sampleFps = () => {
      frames++;
      const now = performance.now();
      if (now - lastSample < 1000) return;
      const fps = (frames * 1000) / (now - lastSample);
      frames = 0;
      lastSample = now;
      const bad = fps < 24 || (tierRef.current === "high" && fps < 50);
      strikes = bad ? strikes + 1 : 0;
      if (strikes < 2) return;
      strikes = 0;
      const next = tierBelow(tierRef.current);
      tierRef.current = next;
      el.dataset.tier = next;
      if (current) {
        scene.remove(current.scene.object);
        current.scene.dispose();
        current = null;
      }
      if (next !== "off") mount(wanted.current);
      resize();
    };

    let prevScroll = 0;
    let last = performance.now();
    let visible = true;

    const loop = () => {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      if (!renderer || !visible) return;

      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      frame.time += dt;
      frame.light = readTheme();

      readScrollVars(getComputedStyle(document.documentElement));

      // Velocity in px/second, not px/frame. Lenis reports per-frame deltas,
      // which read completely differently at 30fps and 120fps for the same
      // physical scroll.
      const y = window.scrollY;
      const raw = (y - prevScroll) / Math.max(dt, 1 / 240);
      prevScroll = y;
      const norm = THREE.MathUtils.clamp(raw / (window.innerHeight * 2.5), -1, 1);
      // Asymmetric: react fast to a flick, decay slowly to rest, so stopping
      // reads as settling rather than snapping.
      const rate = Math.abs(norm) > Math.abs(frame.velocity) ? 12 : 3.2;
      frame.velocity = THREE.MathUtils.damp(frame.velocity, norm, rate, dt);

      if (current && current.name !== wanted.current) mount(wanted.current);

      if (current) {
        current.opacity = THREE.MathUtils.damp(current.opacity, 1, 4, dt);
        current.scene.setOpacity(current.opacity);
        current.scene.update(dt);
      }
      if (outgoing) {
        outgoing.opacity = THREE.MathUtils.damp(outgoing.opacity, 0, 4, dt);
        outgoing.scene.setOpacity(outgoing.opacity);
        outgoing.scene.update(dt);
        if (outgoing.opacity < 0.01) {
          scene.remove(outgoing.scene.object);
          outgoing.scene.dispose();
          outgoing = null;
        }
      }

      renderer.render(scene, camera);
      sampleFps();
    };

    (async () => {
      const backend = await detectBackend();
      if (disposed || backend === "none") return;

      renderer = new WebGPURenderer({
        antialias: false,
        alpha: true,
        forceWebGL: backend !== "webgpu",
      });
      await renderer.init();
      if (disposed) {
        renderer.dispose();
        return;
      }

      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      el.dataset.backend = backend;
      el.dataset.tier = tierRef.current;

      frame.light = readTheme();
      resize();
      mount(wanted.current);

      // Exposed in dev so the scene graph is inspectable from the console.
      // Without it, "nothing is drawn" and "nothing is in the scene" look
      // identical from outside, which cost real time to tell apart.
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as Record<string, unknown>).__scene = {
          renderer, scene, camera, frame,
          get current() { return current?.name; },
          get children() { return scene.children.length; },
        };
      }
      prevScroll = window.scrollY;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    })();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    // rAF is already throttled in a hidden tab, but being explicit means no
    // half-frame runs on the way out.
    const onVisibility = () => { visible = document.visibilityState === "visible"; };
    document.addEventListener("visibilitychange", onVisibility);

    const onPointer = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      frame.pointer.lerp(new THREE.Vector2(nx * 12, ny * 7), 0.35);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      current?.scene.dispose();
      outgoing?.scene.dispose();
      const dom = renderer?.domElement;
      renderer?.dispose();
      if (dom && dom.parentElement === el) el.removeChild(dom);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div className="particles" aria-hidden="true" ref={host} />;
}
