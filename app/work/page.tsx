import type { Metadata } from "next";
import Link from "next/link";
import { getWork, projects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Three production systems — multi-tenant conversation intelligence, a ten-agent replayable pipeline, and an embedded AI companion platform.",
};

export default function WorkIndex() {
  const work = getWork();
  return (
    <main id="main">
      <section className="section shell">
        <p className="eyebrow">Case studies</p>
        <h1 className="h1">Work</h1>
        <p className="lead" style={{ marginBlockStart: "1.25rem" }}>
          Three systems I architected. Two were built for employers and are described without
          naming them — the architecture is the part worth arguing about anyway.
        </p>
      </section>

      <section className="shell">
        <ul className="work-list" role="list">
          {work.map((d) => (
            <li key={d.meta.slug}>
              <Link href={`/work/${d.meta.slug}`} className="work-card">
                <span className="work-card__meta mono">
                  {d.meta.role} · {d.meta.period}
                </span>
                <span className="h2 work-card__title">{d.meta.title}</span>
                <span className="work-card__kicker">{d.meta.kicker}</span>
                <span className="metrics work-card__metrics">
                  {d.meta.metrics.slice(0, 4).map((m) => (
                    <span className="metric" key={m.label}>
                      <b>{m.value}</b>
                      <span>{m.label}</span>
                    </span>
                  ))}
                </span>
                <span className="work-card__go mono">Read the teardown →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section shell">
        <hr className="rule rule--accent" />
        <p className="eyebrow" style={{ marginBlockStart: "2rem" }}>
          Things I build on my own time
        </p>
        <h2 className="h2">Open source</h2>
        <ul className="grid grid--2 repo-grid" role="list" style={{ marginBlockStart: "2rem" }}>
          {projects.map((p) => (
            <li key={p.repo} className="repo">
              <a href={`https://github.com/${p.repo}`}>
                <span className="repo__name mono">{p.name}</span>
                <span className="repo__lang mono">{p.language}</span>
              </a>
              <p className="repo__blurb">{p.blurb}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
