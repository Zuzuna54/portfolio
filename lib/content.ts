import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Prose lives in content/**/*.mdx rather than inline in components for one
// specific reason: the confidentiality gate (scripts/redact-check.sh in the
// presence-control repo) scans a directory. Keeping every published sentence
// under one tree means the gate can't miss a file.
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
  diagram: "pipeline" | "fanout" | "voice";
  order: number;
  /** Employer-encumbered work is described, never named. */
  encumbered: boolean;
};

export type WritingMeta = {
  slug: string;
  n: number;
  title: string;
  date: string;
  summary: string;
  diagram?: string;
  status: "draft" | "published";
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

export function getWriting(): Doc<WritingMeta>[] {
  return readDir("writing")
    .map(({ slug, raw }) => {
      const { data, content } = matter(raw);
      return { meta: { ...(data as Omit<WritingMeta, "slug">), slug }, body: content };
    })
    .sort((a, b) => b.meta.n - a.meta.n);
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
    blurb:
      "Real-time chat analysis into a social graph with relationship intelligence and LLM-driven topic modelling.",
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
