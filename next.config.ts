import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  sassOptions: {
    // Pin the implementation. `sass` is present transitively, and whichever of
    // the two resolves first wins silently — sass-embedded is the faster one
    // and the one we actually declared, so say so explicitly.
    implementation: "sass-embedded",
    // Lets any .scss file `@use 'mixins'` without walking back up the tree.
    includePaths: [path.join(process.cwd(), "styles")],
  },

  // The three architecture diagrams are hand-authored inline SVG driven by
  // GSAP, so they must stay as markup rather than being emitted as <img>.
  images: {
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
