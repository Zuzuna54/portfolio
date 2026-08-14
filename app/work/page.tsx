import type { Metadata } from "next";
import Link from "next/link";
import { getWork, projects } from "@/lib/content";

/**
 * Counted, never hardcoded.
 *
 * This page said "Three systems" and the terminal said "three case studies" on
 * the day a fourth shipped — two surfaces stating a number that the content
 * directory already knew. Anything countable here is derived from `getWork()`,
 * so adding an MDX file cannot leave a stale claim behind.
 */
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight"];
const count = (n: number) => WORDS[n] ?? String(n);

export function generateMetadata(): Metadata {
  const work = getWork();
  return {
    title: "Work",
    description: `${count(work.length)[0].toUpperCase()}${count(work.length).slice(1)} production systems — ${work
      .map((d) => d.meta.kicker.toLowerCase())
      .slice(0, 3)
      .join("; ")}.`,
    alternates: { canonical: "/work" },
  };
}

export default function WorkIndex() {
  const work = getWork();
  const encumbered = work.filter((d) => d.meta.encumbered).length;
  return (
    <main id="main">
      <section className="section shell">
        <p className="eyebrow">Case studies</p>
        <h1 className="h1">Work</h1>
        <p className="lead" style={{ marginBlockStart: "1.25rem" }}>
          {count(work.length)[0].toUpperCase()}
          {count(work.length).slice(1)} systems I architected. {count(encumbered)[0].toUpperCase()}
          {count(encumbered).slice(1)} were built for employers and are described without naming
          them — the architecture is the part worth arguing about anyway.
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
