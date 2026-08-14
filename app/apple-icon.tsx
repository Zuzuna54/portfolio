import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The iOS home-screen icon.
 *
 * `icon.svg` covers browsers, but iOS ignores SVG for touch icons and falls back
 * to a screenshot of the page — which, on a near-black site with a WebGL hero,
 * is an unreadable dark square. So this one is a real PNG.
 *
 * Same two marks as `icon.svg`, drawn larger. iOS applies its own rounding and
 * composites onto its own background, so this is full-bleed with generous
 * padding rather than a bordered tile.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const alt = "Giorgi Giorgobiani — terminal prompt";

// --ground and --gold from styles/_tokens.scss. Hard-coded because Satori has
// no stylesheet and does not understand oklch().
const GROUND = "#100d16";
const GOLD = "#e8a72c";

export default async function AppleIcon() {
  const font = readFileSync(join(process.cwd(), "public", "recursive-700.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: GROUND,
          color: GOLD,
          fontFamily: "Recursive",
          // Tuned so the two glyphs fill the tile without touching the edges
          // that iOS rounds off.
          fontSize: 96,
          letterSpacing: -4,
        }}
      >
        {">_"}
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Recursive", data: font, weight: 700, style: "normal" }],
    },
  );
}
