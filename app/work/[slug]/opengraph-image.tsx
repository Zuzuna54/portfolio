import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CONTACT } from "@/lib/site";
import { getWork, getWorkBySlug, type Metric } from "@/lib/content";

// See app/opengraph-image.tsx for why each of these files is self-contained and
// for the Satori CSS constraints these styles are written against. Hex values
// are the fallback line of the matching token in styles/_tokens.scss.
const GROUND = "#100d16"; // --ground
const INK = "#f0edf5"; // --ink
const INK_DIM = "#b0a8bd"; // --ink-dim
const INK_FAINT = "#8b8298"; // --ink-faint
const LINE = "#362c45"; // --line
const GOLD = "#e8a72c"; // --gold — .metric b is gold on the site regardless of
// the surrounding section's accent, so the chips stay gold here too.
const CRIMSON = "#e0143c"; // --crimson — the work section's accent.

const RECURSIVE = readFileSync(join(process.cwd(), "public", "recursive-700.ttf"));

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-route rather than per-slug. A per-slug alt needs `generateImageMetadata`,
// which changes the generated URL shape and the default export's props — not
// worth the risk for an attribute screen readers announce as one line.
export const alt = `Case study — ${CONTACT.name}. Title, kicker, and the numbers that make it land.`;

// Mirrors app/work/[slug]/page.tsx so every card prerenders alongside its page.
export function generateStaticParams() {
  return getWork().map((d) => ({ slug: d.meta.slug }));
}

// Satori has no way to shrink text to fit, so the step-down is done here.
// Calibrated against Recursive 700 uppercase at a 1056px measure: roughly
// 0.52em average advance, derated for word-boundary wrapping.
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 20) return 104;
  if (n <= 32) return 88;
  if (n <= 46) return 74;
  if (n <= 62) return 62;
  return 54;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getWorkBySlug(slug);

  const eyebrow = doc ? `${doc.meta.role} · ${doc.meta.period}` : "Case study";
  const title = (doc ? doc.meta.title : "Work").toUpperCase();
  const lead = doc ? doc.meta.kicker : "Production systems, described by their architecture.";
  // Two or three chips: past three the labels start colliding at 1056px.
  const metrics: Metric[] = doc ? doc.meta.metrics.slice(0, 3) : [];
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
        <div style={{ display: "flex", width: "100%", height: 10, backgroundColor: CRIMSON }} />

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
              <div style={{ display: "flex", width: 16, height: 16, backgroundColor: CRIMSON, marginRight: 18 }} />
              <div style={{ display: "flex", fontSize: 22, letterSpacing: 4 }}>
                {CONTACT.name.toUpperCase()}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, color: INK_FAINT }}>
              GIORGOBIANI.DEV
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: 1056 }}>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: CRIMSON }}>
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

          {/* .metric on the site: hairline box, gold tabular value, faint
              uppercase label. No rounding — brutalist, --radius is 0. */}
          <div style={{ display: "flex", flexDirection: "row" }}>
            {metrics.map((m) => (
              <div
                key={m.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: LINE,
                  padding: "14px 20px",
                  marginRight: 16,
                }}
              >
                <div style={{ display: "flex", fontSize: 30, color: GOLD, letterSpacing: -1 }}>
                  {m.value}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 15,
                    letterSpacing: 1.6,
                    color: INK_FAINT,
                    marginTop: 8,
                  }}
                >
                  {m.label.toUpperCase()}
                </div>
              </div>
            ))}
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
