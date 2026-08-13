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
};

export type SceneFactory = (ctx: { count: number; light: boolean }) => Scene3D;
