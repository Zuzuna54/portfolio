import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Prose lives in content/**/*.mdx rather than inline in components for one
// specific reason: the confidentiality gate scans a directory. Keeping every
// published sentence under one tree means the gate can't miss a file.
const ROOT = path.join(process.cwd(), "content");

export type Metric = { value: string; label: string };

export type WorkMeta = {
  slug: string;
  title: string;
  kicker: string;
  role: string;
  period: string;
  /** ~200 words. Reused verbatim on the home page. */
  summary: string;
  problem: string;
  metrics: Metric[];
  stack: string[];
  order: number;
  /**
   * The employer is named; its product, clients and internals are not, and the
   * denylist enforces that half. This flag drives the note on the case study.
   */
  encumbered: boolean;
};

export type WritingMeta = {
  slug: string;
  n: number;
  title: string;
  /**
   * When the post was published *here*. Machine-readable only: it feeds
   * `datePublished`, the sitemap's `lastmod` and the feed's `updated`, and is
   * never rendered.
   *
   * It has to be a date that has actually happened. All 16 once carried their
   * LinkedIn send date, which ran two months into the future — Google discards a
   * `lastmod` it considers untrustworthy, and a future one qualifies.
   */
  date: string;
  /**
   * The system the post is about, and the month that work happened. This is the
   * date a *reader* sees, because it is the one they actually want: when the
   * thing was built, not when it was written up.
   *
   * It is also the sort key. `n` alternates employers for variety, so sorting by
   * it while displaying work months sawtooths down the page — Oct 2025, Jun 2026,
   * Sep 2025 — which is how you can tell an index was ordered by something other
   * than what it displays.
   */
  system: string;
  worked: string;
  summary: string;
};

export type Doc<T> = { meta: T; body: string };

function readDir(dir: string): { slug: string; raw: string }[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({
      slug: f.replace(/\.mdx$/, ""),
      raw: fs.readFileSync(path.join(full, f), "utf8"),
    }));
}

export function getWork(): Doc<WorkMeta>[] {
  return readDir("work")
    .map(({ slug, raw }) => {
      const { data, content } = matter(raw);
      return { meta: { ...(data as Omit<WorkMeta, "slug">), slug }, body: content };
    })
    .sort((a, b) => a.meta.order - b.meta.order);
}

export function getWorkBySlug(slug: string): Doc<WorkMeta> | undefined {
  return getWork().find((d) => d.meta.slug === slug);
}

/**
 * Newest work first — the blog convention, and the only order that matches what
 * the rows display.
 *
 * This used to sort ascending by `n`, on the theory that it was a series where
 * post 1 sets up post 3. It isn't: there are zero cross-references between the
 * sixteen posts, and `n` actually alternates employers for variety, so it
 * interleaves 2025 and 2026 work. `n` survives only as a stable tiebreak for
 * posts written in the same month.
 */
export function getWriting(): Doc<WritingMeta>[] {
  return readDir("writing")
    .map(({ slug, raw }) => {
      const { data, content } = matter(raw);
      return { meta: { ...(data as Omit<WritingMeta, "slug">), slug }, body: content };
    })
    .sort((a, b) => b.meta.worked.localeCompare(a.meta.worked) || b.meta.n - a.meta.n);
}

export function getWritingBySlug(slug: string): Doc<WritingMeta> | undefined {
  return getWriting().find((d) => d.meta.slug === slug);
}

/**
 * Repos worth showing. These are mine, nameable, and linkable — no clause
 * attached to any of them, which is exactly why they earn a place next to the
 * two case studies I can't name an employer for.
 */
export type Project = {
  name: string;
  repo: string;
  blurb: string;
  language: string;
  topics: string[];
};

export const projects: Project[] = [
  {
    name: "loop-kit",
    repo: "Zuzuna54/loop-kit",
    language: "Shell",
    topics: ["agents", "evidence-gating"],
    blurb:
      "A portable autonomous build loop. Fresh context per iteration, builder separated from judge, and evidence-gated marking so a feature can't go green unless it re-proves green.",
  },
  {
    name: "jobsearch-automation",
    repo: "Zuzuna54/jobsearch-automation",
    language: "TypeScript",
    topics: ["local-first", "llm-harness"],
    blurb:
      "A local-first automation OS: ingest, score, tailor, then a hard human gate before anything is sent. The interesting decision is that it can queue a dozen applications a day and deliberately refuses to submit any of them.",
  },
  {
    name: "systems-architecture-studies",
    repo: "Zuzuna54/systems-architecture-studies",
    language: "Mermaid",
    topics: ["c4", "architecture"],
    blurb:
      "C4, sequence, and component diagrams for two production systems, written as pattern studies — the architecture without the employer.",
  },
  {
    name: "sprint-harness",
    repo: "Zuzuna54/sprint-harness",
    language: "JavaScript",
    topics: ["shape-up", "drift-control"],
    blurb:
      "Shape Up plus SPARC with drift control, using inject-violation-catch-restore to verify the guardrails actually fire rather than assuming they do.",
  },
  {
    name: "Topic-Modelling",
    repo: "Zuzuna54/Topic-Modelling",
    language: "TypeScript",
    topics: ["multi-agent", "social-graph"],
    // Was "relationship intelligence and LLM-driven topic modelling", which the
    // public repo does not support: every agent in it is a `Mock*` class doing
    // keyword matching, with embeddings from `Math.random()`. No LLM calls, no
    // Postgres. The architecture is the real artifact here, so say that.
    blurb:
      "The fan-out/merge architecture for a ten-agent chat pipeline — stateless agents in parallel, one writer into a social graph. Agents stubbed; the topology is the point.",
  },
  {
    name: "inspector-hook",
    repo: "Zuzuna54/inspector-hook",
    language: "JavaScript",
    topics: ["observability", "ai-tooling"],
    blurb:
      "Cross-IDE visibility into what AI coding assistants are doing to your files, in real time.",
  },
];
