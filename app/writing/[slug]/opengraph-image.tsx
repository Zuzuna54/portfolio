import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CONTACT } from "@/lib/site";
import { getWriting, getWritingBySlug } from "@/lib/content";
import { monthLabel } from "@/lib/dates";

// See app/opengraph-image.tsx for why each of these files is self-contained and
// for the Satori CSS constraints these styles are written against. Hex values
// are the fallback line of the matching token in styles/_tokens.scss.
const GROUND = "#100d16"; // --ground
const INK = "#f0edf5"; // --ink
const INK_DIM = "#b0a8bd"; // --ink-dim
const INK_FAINT = "#8b8298"; // --ink-faint
const VIOLET = "#9b4dff"; // --violet — the writing section's accent.

const RECURSIVE = readFileSync(join(process.cwd(), "public", "recursive-700.ttf"));

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-route rather than per-slug — see the note in app/work/[slug]/opengraph-image.tsx.
export const alt = `A production teardown by ${CONTACT.name} — one problem, one concrete number, and the cost as well as the win.`;

// Mirrors app/writing/[slug]/page.tsx so every card prerenders alongside its post.
export function generateStaticParams() {
  return getWriting().map((p) => ({ slug: p.meta.slug }));
}

// Satori has no way to shrink text to fit, so the step-down is done here.
// Post titles run long — several clear 60 characters — so this bottoms out
// lower than the case-study card, which also has to leave room for chips.
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 20) return 100;
  if (n <= 32) return 86;
  if (n <= 46) return 72;
  if (n <= 62) return 62;
  return 54;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getWritingBySlug(slug);

  const eyebrow = doc ? `${doc.meta.system} · ${monthLabel(doc.meta.worked)}` : "Writing";
  const title = (doc ? doc.meta.title : "Writing").toUpperCase();
  const lead = doc
    ? doc.meta.summary
    : "Production teardowns, engineer to engineer. One problem, one concrete number.";
  const fs = titleSize(title);

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
              {eyebrow.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: fs,
                lineHeight: 0.95,
                letterSpacing: -Math.round(fs * 0.03),
                marginTop: 20,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                lineHeight: 1.4,
                color: INK_DIM,
                marginTop: 22,
                width: 980,
              }}
            >
              {lead}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 20, letterSpacing: 2, color: INK_FAINT }}>
            PRODUCTION TEARDOWNS · GIORGOBIANI.DEV/WRITING
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
