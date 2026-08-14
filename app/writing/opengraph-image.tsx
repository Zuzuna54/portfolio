import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CONTACT } from "@/lib/site";
import { getWriting } from "@/lib/content";

// See app/opengraph-image.tsx for why each of these files is self-contained and
// for the Satori CSS constraints these styles are written against. Hex values
// are the fallback line of the matching token in styles/_tokens.scss.
const GROUND = "#100d16"; // --ground
const INK = "#f0edf5"; // --ink
const INK_DIM = "#b0a8bd"; // --ink-dim
const INK_FAINT = "#8b8298"; // --ink-faint
const VIOLET = "#9b4dff"; // --violet — the brand/WebGL accent, used for the
// writing section so the three surfaces read apart at thumbnail size.

const RECURSIVE = readFileSync(join(process.cwd(), "public", "recursive-700.ttf"));

// Kept in step with the `metadata` export in app/writing/page.tsx.
const LEAD =
  "Production teardowns, engineer to engineer. One problem, one concrete number, and the cost named alongside the win.";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Writing — production teardowns by ${CONTACT.name}. ${LEAD}`;

export default function Image() {
  const count = getWriting().length;

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
        <div style={{ display: "flex", width: "100%", height: 10, backgroundColor: VIOLET }} />

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
              <div style={{ display: "flex", width: 16, height: 16, backgroundColor: VIOLET, marginRight: 18 }} />
              <div style={{ display: "flex", fontSize: 22, letterSpacing: 4 }}>
                {CONTACT.name.toUpperCase()}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: INK_FAINT }}>
              GIORGOBIANI.DEV
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: 1056 }}>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: VIOLET }}>
              NOTES ON PRODUCTION SYSTEMS
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 124,
                lineHeight: 0.9,
                letterSpacing: -6,
                marginTop: 18,
              }}
            >
              WRITING
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
              {LEAD}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 20, letterSpacing: 2, color: INK_FAINT }}>
            {`${count} POSTS · GIORGOBIANI.DEV/WRITING`}
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
