import { createKeyboard } from "./keyboard";
import {
  createPipeline, createFanout, createVoice, createGlyph, createStrata,
} from "./routes";
import type { SceneFactory } from "../types";

/**
 * Route → scene factory.
 *
 * `beacon` is the home hero — the keyboard, raked by the beacon light. The name
 * is kept because it is what `sceneForPath` already returns and what the light
 * rig is called; the geometry changed, the route mapping did not.
 *
 * The other five are variants of the constellation network in `substrate.ts`,
 * differing only in seed and field volume. They take no scroll input — scroll
 * drives the keyboard and nothing else. When verifying, check `__scene.current`
 * matches the route: "something renders" is not the same as "the right scene
 * renders", and these five pointed at a generic field for weeks unnoticed.
 */
export const SCENES = {
  beacon: createKeyboard,
  pipeline: createPipeline,
  fanout: createFanout,
  voice: createVoice,
  glyph: createGlyph,
  strata: createStrata,
} satisfies Record<string, SceneFactory>;

export type SceneName = keyof typeof SCENES;

/** Kept here so routes don't each hardcode their own mapping. */
export function sceneForPath(path: string): SceneName {
  if (path === "/") return "beacon";
  if (path.startsWith("/work/agent-pipeline")) return "fanout";
  if (path.startsWith("/work/lumi")) return "voice";
  if (path.startsWith("/work")) return "pipeline";
  if (path.startsWith("/writing")) return "glyph";
  if (path.startsWith("/about") || path.startsWith("/resume")) return "strata";
  return "beacon";
}
