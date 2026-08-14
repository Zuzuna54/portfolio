import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CONTACT, SUMMARY } from "@/lib/site";

// ---------------------------------------------------------------------------
// Home OG card.
//
// Every opengraph-image file on this site is deliberately self-contained: the
// palette, the font load and the card markup are repeated rather than factored
// into a shared module. Metadata image files are route modules with a fixed
// export contract, so a shared helper would have to live outside `app/`, and
// duplicating ~40 lines of constants is cheaper than the indirection.
//
// Satori (what `next/og` renders through) supports a strict CSS subset:
// flexbox only, no grid, no float, no CSS custom properties, no oklch(), no
// color-mix(), no backdrop-filter. Every element with more than one child
// carries an explicit `display: "flex"`. Colours below are the *hex* fallbacks
// already authored in `styles/_tokens.scss` — the oklch() line that overrides
// each one in the browser is unrepresentable here.
// ---------------------------------------------------------------------------
const GROUND = "#100d16"; // --ground
const INK = "#f0edf5"; // --ink
const INK_DIM = "#b0a8bd"; // --ink-dim
const INK_FAINT = "#8b8298"; // --ink-faint
const GOLD = "#e8a72c"; // --gold

// Recursive is loaded through next/font/google for the site itself, but that
// loader is unusable inside ImageResponse — Satori needs the raw binary. This
// is the static wght-700 instance from Google Fonts (SIL OFL 1.1), vendored so
// the build never reaches the network. One weight only: Satori parses a
// variable font's fvar table but never applies it, so a variable file would
// render at its 400 default everywhere. 700 is the compromise between the
// site's 800 headings and its 400 body.
const RECURSIVE = readFileSync(join(process.cwd(), "public", "recursive-700.ttf"));

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${CONTACT.name} — ${CONTACT.title}. ${SUMMARY}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: GROUND,
          color: INK,
          fontFamily: "Recursive",
        }}
      >
        {/* The slab across the top is the same 4px accent rule the site uses
            between sections, scaled for thumbnail viewing. */}
        <div style={{ display: "flex", width: "100%", height: 10, backgroundColor: GOLD }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "space-between",
            padding: "52px 72px 56px 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", width: 16, height: 16, backgroundColor: GOLD, marginRight: 18 }} />
              <div style={{ display: "flex", fontSize: 22, letterSpacing: 4 }}>
                {CONTACT.name.toUpperCase()}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: INK_FAINT }}>
              GIORGOBIANI.DEV
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: 1056 }}>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: GOLD }}>
              {CONTACT.title.toUpperCase()}
            </div>
            {/* .display on the site: uppercase, -0.045em tracking, 0.86 leading. */}
            <div
              style={{
                display: "flex",
                fontSize: 100,
                lineHeight: 0.9,
                letterSpacing: -4,
                marginTop: 22,
              }}
            >
              {CONTACT.name.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.42,
                color: INK_DIM,
                marginTop: 24,
                width: 980,
              }}
            >
              {SUMMARY}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 20, letterSpacing: 2, color: INK_FAINT }}>
            {`NINE YEARS OF PRODUCTION ENGINEERING · ${CONTACT.location} · ${CONTACT.remote}`.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Recursive", data: RECURSIVE, weight: 700, style: "normal" }],
    },
  );
}
