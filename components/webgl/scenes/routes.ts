import { createNetwork } from "./substrate";
import type { Scene3D, SceneFactory } from "../types";

/**
 * The five non-home route scenes.
 *
 * All one system — the constellation network in `substrate.ts` — differing only
 * in the seed and the volume the field occupies, so each route has its own
 * arrangement without any of them being a separate codebase.
 *
 * They used to carry per-route *meaning*: queue lanes for `/work`, diverging
 * streams for the agent pipeline, a waveform for LUMI, and so on. That was
 * dropped deliberately. Those formations are strongly anisotropic, and a
 * k-nearest mesh over a set of thin stripes links along the stripe and nowhere
 * else, so they read as hatching rather than as a web. Given a choice between a
 * background that means something and one that looks right, the background
 * should look right — it is a background.
 *
 * Scroll input is gone from all five. Scroll drives the keyboard on `/` and
 * nothing else; these breathe and answer the pointer.
 */

const variant = (seed: number, width: number, height: number, depth: number): SceneFactory =>
  ({ tier }): Scene3D => createNetwork({ tier, seed, width, height, depth });

// Wider, flatter fields on the index pages; deeper and tighter on the long-form
// pages, where the reader sits with the page longer and the parallax of a deeper
// field is worth more.
export const createPipeline = variant(0x91e11, 32, 15, 7);
export const createFanout   = variant(0xfa207, 30, 16, 9);
export const createVoice    = variant(0x5017e, 28, 15, 9);
export const createGlyph    = variant(0x91d0f, 33, 14, 6);
export const createStrata   = variant(0x57a7a, 30, 16, 8);
