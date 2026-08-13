import Link from "next/link";
import { getWork, getWriting } from "@/lib/content";
import { CONTACT, SUMMARY } from "@/lib/site";

export default function Home() {
  const work = getWork();
  const latest = getWriting().slice(0, 3);

  return (
    <main id="main">
      {/* Hero. The WebGL particle field and terminal boot mount over this in
          phase 4 — the markup underneath stays server-rendered and readable so
          LCP measures real content rather than an animation. */}
      <section className="hero section shell">
        <p className="eyebrow">{CONTACT.location} · {CONTACT.remote}</p>
        <h1 className="display hero__name">
          Giorgi
          <br />
          Giorgobiani
        </h1>
        <p className="lead hero__lead">{SUMMARY}</p>
        <p className="hero__sub">
          Nine years of production engineering, the last several on LLM and agent platforms.
        </p>
        <div className="cluster hero__cta">
          <Link className="btn" href="/work">
            See the work
          </Link>
          <a className="mono hero__link" href={CONTACT.github}>
            GitHub
          </a>
          <a className="mono hero__link" href={CONTACT.linkedin}>
            LinkedIn
          </a>
          <a className="mono hero__link" href="/resume">
            Résumé
          </a>
        </div>
      </section>

      <hr className="rule rule--accent" />

      {/* Short-form case studies. Long-form lives on the detail pages. */}
      <section className="section shell">
        <p className="eyebrow">Selected work</p>
        <h2 className="h1" style={{ marginBlockStart: "0.5rem" }}>
          Three systems
        </h2>
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
                <span className="work-card__kicker">{d.meta.summary}</span>
                <span className="metrics work-card__metrics">
                  {d.meta.metrics.map((m) => (
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

      <section className="section invert-crimson">
        <div className="shell">
          <p className="eyebrow">The through-line</p>
          <h2 className="h1">
            Systems you can
            <br />
            operate, not just demo
          </h2>
          <p className="lead" style={{ marginBlockStart: "1.5rem", maxWidth: "50ch" }}>
            Is it replayable. Does the state machine have a path backwards. Is the scaling signal
            honest, or merely available. Those questions are unglamorous, and they are the
            difference between a system that survives production and one that only survives a
            demo.
          </p>
        </div>
      </section>

      <section className="section shell">
        <p className="eyebrow">Writing</p>
        <h2 className="h1" style={{ marginBlockStart: "0.5rem" }}>
          Production teardowns
        </h2>
        <ul className="post-list" role="list" style={{ marginBlockStart: "2.5rem" }}>
          {latest.map((p) => (
            <li key={p.meta.slug}>
              <Link href={`/writing/${p.meta.slug}`} className="post-row">
                <time className="mono post-row__date" dateTime={p.meta.date}>
                  {new Date(p.meta.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <span className="post-row__title h3">{p.meta.title}</span>
                <span className="post-row__summary">{p.meta.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
