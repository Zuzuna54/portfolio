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

  // The 20 architecture diagrams are hand-authored inline SVG driven by GSAP,
  // so they must stay as markup rather than being emitted as <img>. Trade-off
  // accepted knowingly: inline SVG is not indexable by Google Images. Each one
  // carries <title>/<desc>, which is what a screen reader and a text-extracting
  // crawler actually read.
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
          // Two years, all subdomains, preload-eligible. The apex was serving a
          // weaker policy than the *.vercel.app alias, which had both flags.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // The résumé PDF is linked from the footer and the résumé page, so
        // Google will find it regardless. Left alone it competes with the HTML
        // /resume for "giorgi giorgobiani resume" and usually wins — a PDF is
        // the worse landing page: no nav, no internal links, no canonical.
        //
        // `noindex` does not block downloading. The file stays fully reachable;
        // it just stops being a rival result. A PDF cannot carry a meta robots
        // tag, so the header is the only way to say this.
        source: "/resume.pdf",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      // Crawlable — so Google can read these rules — but kept out of the index.
      // See the note in app/robots.ts for why `Disallow` was the wrong tool.
      //
      // Two entries, not one pattern: `source` is path-to-regexp, where a
      // wildcard must occupy whole segments. `/:path*opengraph-image` is not a
      // valid pattern and fails the build outright with "Can not repeat 'rest'
      // without a prefix and suffix".
      {
        source: "/opengraph-image",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/:path*/opengraph-image",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/apple-icon",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
