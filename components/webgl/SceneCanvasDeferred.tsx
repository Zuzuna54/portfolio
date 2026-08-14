"use client";

import dynamic from "next/dynamic";
import Deferred from "@/components/motion/Deferred";

/**
 * The canvas, code-split and mounted after first paint.
 *
 * Two separate savings, and they are worth distinguishing:
 *
 * 1. `ssr: false` + `dynamic` puts three.js in its own chunk (242 KB) that is
 *    not in the initial hydration graph. React stops paying for it up front.
 * 2. `Deferred` then holds the mount until the browser is idle, so building 75
 *    keycap geometries and compiling shaders cannot land in the same frame as
 *    the hero's reveal.
 *
 * **This does not weaken the persistence guarantee.** The rule is that the
 * canvas, once mounted, is never unmounted — that is what keeps the GPU context
 * alive across navigation. Mounting it a few hundred milliseconds later still
 * satisfies it; `SceneCanvas` reads `sceneForPath(pathname)` at mount, so it
 * arrives already showing the right scene for wherever the visitor landed.
 *
 * `ssr: false` is safe here because the canvas renders nothing on the server
 * anyway, and the site is required to be a complete readable document without
 * it (HANDOFF §2.3).
 */
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

export default function SceneCanvasDeferred() {
  return (
    <Deferred>
      <SceneCanvas />
    </Deferred>
  );
}
