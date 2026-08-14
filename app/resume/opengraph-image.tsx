import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CONTACT } from "@/lib/site";

// See app/opengraph-image.tsx for why each of these files is self-contained and
// for the Satori CSS constraints these styles are written against. Hex values
// are the fallback line of the matching token in styles/_tokens.scss.
const GROUND = "#100d16"; // --ground
const INK = "#f0edf5"; // --ink
const INK_DIM = "#b0a8bd"; // --ink-dim
const INK_FAINT = "#8b8298"; // --ink-faint
const GOLD = "#e8a72c"; // --gold

const RECURSIVE = readFileSync(join(process.cwd(), "public", "recursive-700.ttf"));

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `Résumé — ${CONTACT.name}, ${CONTACT.title}. Nine years building production systems.`;

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

          {/* The page's own eyebrow is "Résumé" and its h1 is the name — but the
              name is already the wordmark up top, so the card leads with the
              title line instead. Same three strings as the page metadata. */}
          <div style={{ display: "flex", flexDirection: "column", width: 1056 }}>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: GOLD }}>RÉSUMÉ</div>
            <div
              style={{
                display: "flex",
                fontSize: 88,
                lineHeight: 0.95,
                letterSpacing: -3,
                marginTop: 22,
              }}
            >
              {CONTACT.title.toUpperCase()}
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
              Nine years building production systems — agent orchestration, retrieval, and the cost
              and latency controls that keep them alive.
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 20, letterSpacing: 2, color: INK_FAINT }}>
            {`${CONTACT.location} · ${CONTACT.remote}`.toUpperCase()}
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
