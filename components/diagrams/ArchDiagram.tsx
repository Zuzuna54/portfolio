"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useMotion } from "@/components/motion/MotionProvider";
import {
  DIAGRAMS, DEFAULT_W, DEFAULT_H,
  type DiagramSpec, type DNode, type DEdge,
} from "./specs";

/**
 * Scroll-driven architecture diagrams.
 *
 * Nodes fade in, edges draw themselves stroke-by-stroke, and a pulse travels the
 * path the real work takes. Scrubbed, so scrolling back un-draws it — the same
 * bidirectional property as everything else on the site.
 *
 * **SVG in the DOM, not canvas.** The diagram is content: it has a `<title>` and
 * `<desc>`, it prints, it survives a failed script, and it is legible to a
 * screen reader. A canvas would be none of those for a picture whose entire job
 * is explaining a system.
 *
 * With reduced motion or without JS the diagram renders complete and static. The
 * animation only ever removes the journey, never the destination.
 */

const nodeBox = (n: DNode) => ({
  x: n.x,
  y: n.y,
  w: n.w ?? DEFAULT_W,
  h: n.h ?? DEFAULT_H,
});

/**
 * Route an edge between two boxes.
 *
 * Exits on whichever axis actually separates them, then bends with a cubic.
 * Straight lines between arbitrary boxes cut through other boxes; this keeps the
 * flow readable without hand-authoring every path.
 */
function routeEdge(a: DNode, b: DNode): string {
  const A = nodeBox(a);
  const B = nodeBox(b);
  const ac = { x: A.x + A.w / 2, y: A.y + A.h / 2 };
  const bc = { x: B.x + B.w / 2, y: B.y + B.h / 2 };
  const dx = bc.x - ac.x;
  const dy = bc.y - ac.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const from = { x: dx > 0 ? A.x + A.w : A.x, y: ac.y };
    const to = { x: dx > 0 ? B.x : B.x + B.w, y: bc.y };
    const mid = (from.x + to.x) / 2;
    return `M ${from.x} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`;
  }

  const from = { x: ac.x, y: dy > 0 ? A.y + A.h : A.y };
  const to = { x: bc.x, y: dy > 0 ? B.y : B.y + B.h };
  const mid = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${mid}, ${to.x} ${mid}, ${to.x} ${to.y}`;
}

/** Renders one spec, wired to its own scroll trigger. */
function Figure({ spec, id }: { spec: DiagramSpec; id: string }) {
  const { enabled } = useMotion();
  const root = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!enabled || !root.current) return;
    gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
    const el = root.current;

    const ctx = gsap.context(() => {
      const nodes = el.querySelectorAll("[data-dnode]");
      const edges = el.querySelectorAll("[data-dedge]");
      const pulses = el.querySelectorAll("[data-dpulse]");
      const bars = el.querySelectorAll("[data-dbar]");

      gsap.set(nodes, { opacity: 0, y: 8 });
      gsap.set(edges, { drawSVG: "0%" });
      gsap.set(pulses, { opacity: 0 });
      gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          end: "bottom 68%",
          scrub: 0.6,
        },
      });

      tl.to(nodes, { opacity: 1, y: 0, stagger: 0.03, duration: 0.45 }, 0)
        // Edges start after the nodes they connect, so the picture builds as
        // structure-then-connection rather than all at once.
        .to(edges, { drawSVG: "100%", stagger: 0.025, duration: 0.55 }, 0.16)
        .to(bars, { scaleX: 1, stagger: 0.06, duration: 0.5, ease: "power2.out" }, 0.1)
        .to(pulses, { opacity: 1, duration: 0.2 }, 0.65);

      // Pulses run on their own clock, not the scrub: traffic doesn't stop
      // because the reader stopped scrolling.
      pulses.forEach((p, i) => {
        // Its edge is the sibling immediately before it — sampling the real path
        // means the dot follows the curve exactly.
        const path = p.previousElementSibling as SVGPathElement | null;
        if (!path) return;
        const len = path.getTotalLength();
        const state = { t: 0 };
        gsap.to(state, {
          t: 1,
          duration: 2.6,
          repeat: -1,
          ease: "none",
          delay: i * 0.4,
          onUpdate: () => {
            const pt = path.getPointAtLength(state.t * len);
            (p as SVGCircleElement).setAttribute("cx", String(pt.x));
            (p as SVGCircleElement).setAttribute("cy", String(pt.y));
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [enabled, spec]);

  const byId = new Map((spec.nodes ?? []).map((n) => [n.id, n]));
  const pathFor = (e: DEdge) => {
    if (e.d) return e.d;
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    return a && b ? routeEdge(a, b) : "";
  };

  // ---- budget waterfall ---------------------------------------------------
  // A different shape of truth from a node graph, so it gets its own rendering:
  // bar length is time, and the eye should be able to compare stages at a glance
  // without reading a single number.
  const bars = spec.bars;
  // The track has to leave room for the value+note that trails the longest bar,
  // or that text runs off the right edge of the viewBox and is simply gone —
  // SVG doesn't clip, it just paints outside and the browser drops it. 220 left
  // for the stage name, 220 right for the trailing label.
  const scale = bars ? (spec.vw - 440) / Math.max(...bars.map((b) => b.ms)) : 1;

  return (
    <figure className="diagram">
      <figcaption className="diagram__title eyebrow">{spec.title}</figcaption>
      <svg
        ref={root}
        className="diagram__svg"
        viewBox={`0 0 ${spec.vw} ${spec.vh}`}
        role="img"
        aria-labelledby={`${id}-t ${id}-d`}
      >
        <title id={`${id}-t`}>{spec.title}</title>
        <desc id={`${id}-d`}>{spec.caption}</desc>

        {bars ? (
          <g className="diagram__bars">
            {bars.map((b, i) => {
              const y = 18 + i * 44;
              return (
                <g key={b.label}>
                  <text x={0} y={y + 18} className="diagram__label">{b.label}</text>
                  <rect data-dbar x={220} y={y} width={b.ms * scale} height={22} className="diagram__bar" />
                  <rect data-dbar x={220} y={y} width={b.target * scale} height={22} className="diagram__bar--target" />
                  <text x={220 + b.ms * scale + 10} y={y + 16} className="diagram__sub">
                    {b.ms}ms{b.note ? ` · ${b.note}` : ""}
                  </text>
                </g>
              );
            })}
            {spec.barTotal && (
              <text x={0} y={spec.vh - 12} className="diagram__sub">
                budget {spec.barTotal.budget}ms · target {spec.barTotal.target}ms · stages overlap, so the total is not their sum
              </text>
            )}
          </g>
        ) : (
          <>
            <g className="diagram__edges">
              {(spec.edges ?? []).map((e, i) => (
                <g key={`${e.from}-${e.to}-${i}`}>
                  <path
                    data-dedge
                    d={pathFor(e)}
                    className={`diagram__edge${e.dashed ? " diagram__edge--signal" : ""}`}
                  />
                  {e.pulse && <circle data-dpulse r="3.5" className="diagram__pulse" />}
                </g>
              ))}
            </g>

            <g className="diagram__nodes">
              {(spec.nodes ?? []).map((n) => {
                const b = nodeBox(n);
                return (
                  <g data-dnode key={n.id} className={`diagram__node diagram__node--${n.kind ?? "compute"}`}>
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} />
                    <text x={b.x + 11} y={b.y + (n.sub ? 22 : b.h / 2 + 4)} className="diagram__label">
                      {n.label}
                    </text>
                    {n.sub && (
                      <text x={b.x + 11} y={b.y + 39} className="diagram__sub">
                        {n.sub}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </>
        )}
      </svg>
      <p className="diagram__caption">{spec.caption}</p>
    </figure>
  );
}

export default function ArchDiagram({ slug }: { slug: string }) {
  const specs = DIAGRAMS[slug];
  if (!specs?.length) return null;
  return (
    <div className="diagrams">
      {specs.map((s, i) => (
        <Figure key={s.title} spec={s} id={`${slug}-${i}`} />
      ))}
    </div>
  );
}
