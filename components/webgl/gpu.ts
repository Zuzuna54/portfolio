"use client";

/**
 * Renderer capability probe.
 *
 * WebGPU is ~95% covered and gives us compute shaders, but "navigator.gpu
 * exists" is not the same as "a device can be acquired" — a blocklisted driver,
 * a headless context, or a machine under memory pressure will advertise the API
 * and then fail at requestAdapter(). So we actually ask for an adapter before
 * committing, and fall back to WebGL2 silently.
 *
 * The result is cached: probing costs an async round-trip and the answer cannot
 * change within a page lifetime.
 */
export type Backend = "webgpu" | "webgl2" | "none";

let cached: Backend | null = null;
let inflight: Promise<Backend> | null = null;

export function forcedBackend(): Backend | null {
  if (typeof window === "undefined") return null;
  // ?gl=webgl2 / ?gl=webgpu — so both paths can be verified on one machine
  // rather than taken on trust.
  const q = new URLSearchParams(window.location.search).get("gl");
  return q === "webgpu" || q === "webgl2" || q === "none" ? q : null;
}

export async function detectBackend(): Promise<Backend> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async (): Promise<Backend> => {
    const forced = forcedBackend();
    if (forced) return (cached = forced);

    const nav = navigator as Navigator & {
      gpu?: { requestAdapter(): Promise<unknown | null> };
    };

    if (nav.gpu) {
      try {
        const adapter = await nav.gpu.requestAdapter();
        if (adapter) return (cached = "webgpu");
      } catch {
        // fall through — an exception here is exactly the case the probe exists for
      }
    }

    // Acquire a real context rather than sniffing: support can be advertised
    // and still fail on a blocklisted driver.
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      if (gl) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return (cached = "webgl2");
      }
    } catch {
      /* no-op */
    }

    return (cached = "none");
  })();

  return inflight;
}
