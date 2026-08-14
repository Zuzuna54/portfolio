import type * as THREE from "three";

/**
 * A scene is a plain factory, not a React component.
 *
 * R3F 9.7.0 has no WebGPU support and v10 exists only as a canary, so the
 * canvas is driven imperatively. For a background layer with no interactive 3D
 * objects, R3F was never earning much anyway — it was reconciling a tree that
 * changes once per route.
 */
export type Scene3D = {
  object: THREE.Object3D;
  /** Called every frame with delta seconds. */
  update(dt: number): void;
  /** 0→1, driven by the cross-fade during navigation. */
  setOpacity(v: number): void;
  dispose(): void;
  /**
   * Multiplier on the canvas pixel ratio while this scene is on screen.
   *
   * Particle scenes leave it alone. A fullscreen raymarch cannot: every pixel
   * costs dozens of SDF evaluations, so resolution — not step count — is the
   * first-order lever, and the only one that scales quadratically. Softness is
   * also the right trade for this layer specifically, since it sits behind body
   * text.
   */
  dprScale?: number;
  /**
   * Whether this scene needs the renderer's shadow map.
   *
   * Off by default and enabled only while a scene that casts shadows is on
   * screen — a shadow pass is a second render of every caster, and the particle
   * scenes have nothing to cast.
   */
  shadows?: boolean;
};

export type SceneFactory = (ctx: {
  count: number;
  /** Lets a scene size its own work, not just its particle budget. */
  tier: "high" | "mid" | "low";
}) => Scene3D;
