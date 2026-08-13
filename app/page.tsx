import Link from "next/link";
import { getWork, getWriting } from "@/lib/content";
import { CONTACT, SUMMARY } from "@/lib/site";
import SplitReveal from "@/components/motion/SplitReveal";
import Reveal from "@/components/motion/Reveal";
import MagneticLink from "@/components/motion/MagneticLink";
import HorizontalRail from "@/components/motion/HorizontalRail";
import InvertScene from "@/components/motion/InvertScene";
import PinnedScene from "@/components/motion/PinnedScene";
import HeroDrivers from "@/components/webgl/HeroDrivers";

const TIMELINE: { year: string; what: string; note: string }[] = [
  { year: "2017", what: "Biz2Credit", note: "Monolith to microservices. React and Redux frontends. The ordinary work that teaches you what breaks." },
  { year: "2019", what: "StoreTasker", note: "A proxy layer for request capture, and leading the move to React and Node." },
  { year: "2021", what: "Genentech", note: "ML platform tooling in biotech — a model-federation dashboard and the training topology as an interactive graph." },
  { year: "2023", what: "Scale AI", note: "Prompt strategies and evaluation loops for LLM output quality." },
  { year: "2024", what: "YellowPad", note: "Founding engineer at a legal-AI startup. Platform from zero, 2,000 users, SOC 2 Type 2." },
  { year: "2025", what: "Agent platforms", note: "A ten-agent replayable pipeline, then a multi-tenant conversation-intelligence platform." },
  { year: "2025", what: "Sunny Labs", note: "My own company. Custom hardware, four memory layers, a voice loop under half a second." },
];

export default function Home() {
  const work = getWork();
  const latest = getWriting().slice(0, 4);

  return (
    <main id="main">
      {/* The particle field now lives in the root layout so it persists across
          navigation. Only the boot overlay and the hero's scroll drivers are
          page-local. */}
      <HeroDrivers />

      <section className="hero section shell">
        <p className="eyebrow">
          {CONTACT.location} · {CONTACT.remote}
        </p>
        <SplitReveal as="h1" className="display hero__name">
          Giorgi Giorgobiani
        </SplitReveal>
        <Reveal from="up" delay={0.1}>
          <p className="lead hero__lead">{SUMMARY}</p>
          <p className="hero__sub">
            Nine years of production engineering, the last several on LLM and agent platforms.
          </p>
        </Reveal>
        <Reveal from="up" delay={0.2}>
          <div className="cluster hero__cta">
            <MagneticLink>
              <Link className="btn" href="/work">
                See the work
              </Link>
            </MagneticLink>
            <MagneticLink strength={8}>
              <a className="mono hero__link" href={CONTACT.github}>GitHub</a>
            </MagneticLink>
            <MagneticLink strength={8}>
              <a className="mono hero__link" href={CONTACT.linkedin}>LinkedIn</a>
            </MagneticLink>
            <MagneticLink strength={8}>
              <Link className="mono hero__link" href="/resume">Résumé</Link>
            </MagneticLink>
          </div>
        </Reveal>
      </section>

      <hr className="rule rule--accent" />

      <section className="section shell">
        <p className="eyebrow">Selected work</p>
        <SplitReveal as="h2" className="h1" scrub>
          Three systems
        </SplitReveal>
      </section>

      <section className="shell">
        <ul className="work-list" role="list">
          {work.map((d, i) => (
            <li key={d.meta.slug}>
              <Reveal from="up" delay={i * 0.05}>
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
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Full-bleed palette inversion. Every colour is a custom property, so
          the whole subtree follows — borders, links, diagrams included. */}
      <InvertScene palette="crimson">
        {/* Pinned: the section holds while the three questions advance with
            scroll progress. Each question is gated on --scene-progress, so
            scrolling back genuinely un-reveals them. */}
        <PinnedScene length={1.6} className="through">
          <div className="shell">
            <p className="eyebrow">The through-line</p>
            <SplitReveal as="h2" className="h1">
              Systems you can operate, not just demo
            </SplitReveal>
            <ol className="through__list" role="list">
              <li style={{ "--at": 0.15 } as React.CSSProperties}>
                Is it replayable?
                <span>Or is every incident archaeology?</span>
              </li>
              <li style={{ "--at": 0.42 } as React.CSSProperties}>
                Does the state machine have a path backwards?
                <span>Monotonic state is cacheable state.</span>
              </li>
              <li style={{ "--at": 0.69 } as React.CSSProperties}>
                Is the scaling signal honest, or merely available?
                <span>CPU is available. Backlog per worker is honest.</span>
              </li>
            </ol>
          </div>
        </PinnedScene>
      </InvertScene>

      <section className="section">
        <div className="shell">
          <p className="eyebrow">Nine years</p>
          <SplitReveal as="h2" className="h1">
            How I got here
          </SplitReveal>
        </div>
        <HorizontalRail className="timeline">
          {TIMELINE.map((t) => (
            <article className="rail__item timeline__card" key={`${t.year}-${t.what}`}>
              <p className="timeline__year mono">{t.year}</p>
              <h3 className="h3">{t.what}</h3>
              <p className="timeline__note">{t.note}</p>
            </article>
          ))}
        </HorizontalRail>
      </section>

      <section className="section shell">
        <p className="eyebrow">Writing</p>
        <SplitReveal as="h2" className="h1">
          Production teardowns
        </SplitReveal>
        <ul className="post-list" role="list" style={{ marginBlockStart: "2.5rem" }}>
          {latest.map((p) => (
            <li key={p.meta.slug}>
              <Link href={`/writing/${p.meta.slug}`} className="post-row">
                <span className="post-row__date mono">
                  <span className="post-row__n">{String(p.meta.n).padStart(2, "0")}</span>
                  <time dateTime={p.meta.date}>
                    {new Date(p.meta.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </span>
                <span className="post-row__title h3">{p.meta.title}</span>
                <span className="post-row__summary">{p.meta.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p style={{ marginBlockStart: "2rem" }}>
          <Link href="/writing" className="mono hero__link">
            All 16 →
          </Link>
        </p>
      </section>
    </main>
  );
}
