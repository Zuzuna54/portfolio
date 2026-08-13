import { createField } from "./field";
import type { SceneFactory } from "../types";

/**
 * Route → scene factory. Phase A ships the substrate under every route;
 * Phase B gives each its own formation and lighting.
 */
export const SCENES = {
  beacon: createField,
  pipeline: createField,
  fanout: createField,
  voice: createField,
  glyph: createField,
  strata: createField,
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
