import type { Metadata } from "next";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Résumé",
  description: "Senior AI Platform Engineer — nine years building production systems.",
};

type Role = {
  company: string;
  title: string;
  period: string;
  bullets: string[];
};

// Two employers are withheld on the public page. Employment history is not itself
// confidential — it's on LinkedIn — but the choice was to name no employer anywhere
// public, and a page that names the company directly above a description of its
// internal architecture is exactly the pairing that creates exposure.
//
// The downloadable PDF is the artifact that names them: it goes to a named recruiter
// rather than to a search index. That split is deliberate, not an oversight.
const ROLES: Role[] = [
  {
    company: "Sunny Labs Inc.",
    title: "Founder & Principal Engineer",
    period: "Aug 2025 – Present",
    bullets: [
      "Architected an AI companion platform end to end: custom ESP32-S3 hardware, a multi-layer memory system, and a multi-tenant cloud backend licensed as a white-label platform to third-party brands.",
      "Built four memory layers across Redis, PostgreSQL and a graph store — short-term context, episodic facts, emotional state, and a long-term relationship graph. Every session reprocesses full prior history rather than a retention window, so recall does not degrade as the window slides.",
      "Built a streaming voice pipeline (streaming STT → LLM → custom TTS) holding under 500ms for real-time dialogue.",
      "Enforced per-device memory isolation across licensed brands with PostgreSQL row-level security. Hardware went from concept to first functional module in under four weeks.",
    ],
  },
  {
    company: "Venture studio (name withheld)",
    title: "Senior Platform Engineer",
    period: "Nov 2025 – Apr 2026",
    bullets: [
      "Architected a multi-tenant conversation-intelligence platform converting ~100 hours of calls a week into structured business intelligence for several teams.",
      "Built a 9-worker, queue-driven pipeline across 7 queues with 7 dead-letter queues, bounded retries, and a shared concurrent message-pool library as the reliability backbone.",
      "Designed a 4-stage signal promotion ladder that never demotes, lifting per-call learnings into cross-call signals and 31 prerequisite-chained artifact types evaluated in 2 database queries.",
      "Built retrieval over 3,072-dimension embeddings in pgvector across transcript segments, summaries and reflection insights.",
      "Shipped a chat assistant with a 24-tool function-calling registry using thinking-token streaming and parallel tool dispatch over SSE, plus an MCP server exposing the intelligence layer to external agents.",
      "Guaranteed tenant isolation via PostgreSQL row-level security in a single-deployment architecture, with all infrastructure as code at full dev/prod parity.",
      "Cut compute cost ~94% by moving off per-task serverless containers to 3 EC2 capacity providers tuned per workload shape, autoscaled on queue backlog per task rather than CPU.",
    ],
  },
  {
    company: "Decentralized data platform (name withheld)",
    title: "Senior Software Engineer",
    period: "Apr 2025 – Oct 2025",
    bullets: [
      "Built the NLP vertical on a decentralized data platform: a 10-agent pipeline where a meta-orchestrator fans batched events out to 7 model-backed agents and 3 coordination agents in parallel, merging into a social graph through a single writer.",
      "Implemented content-hash idempotency making the pipeline fully replayable — Postgres can be wiped and rebuilt from source events with identical output.",
      "Built semantic retrieval over 384-dimension embeddings in pgvector with dynamic topic clustering at a 70% similarity threshold, over a 27-table schema with 49 indexes.",
      "Exposed 5 query operations as MCP tools through the platform gateway, making the social graph directly queryable by external LLMs.",
      "Declared pipelines as infrastructure-as-code over custom resource types, so a new pipeline ships as a stack file and deploys without recompiling any backend service.",
    ],
  },
  {
    company: "YellowPad",
    title: "Founding Engineer",
    period: "Apr 2024 – Feb 2025",
    bullets: [
      "Founding engineer at a legal-AI startup; built the full platform from zero (AWS, Next.js, Node.js, TypeScript), serving 2,000 users.",
      "Built the document-intelligence pipeline behind contract due diligence: parsing and chunking, embeddings, and LLM-driven extraction, cutting the manual review hours attorneys spent per deal.",
      "Orchestrated that pipeline as coordinated Lambdas with SQS queueing, offloading heavier LLM processing to EC2 where Lambda limits bound throughput.",
      "Designed AppSync GraphQL endpoints for real-time updates and offline sync, cutting API response times 40%.",
      "Led the company through SOC 2 Type 2 certification.",
    ],
  },
  {
    company: "Remotasks (Scale AI)",
    title: "NLP & Prompt Engineering, Contract",
    period: "Sep 2023 – Apr 2024",
    bullets: [
      "Developed prompt strategies and evaluation loops for LLM output quality, iterating on model behaviour against project-defined objectives.",
    ],
  },
  {
    company: "Genentech",
    title: "Software Engineer",
    period: "Aug 2021 – Aug 2023",
    bullets: [
      "Built a model-federation dashboard letting researchers schedule, sequence and automate model-training jobs, removing most of the manual coordination from the training workflow.",
      "Visualised the full training-node topology and inter-job relationships as an interactive browser graph over Neo4j.",
      "Built full-stack applications (React/Redux, Java/Vert.x, Node.js, GraphQL) deployed on AWS with Docker and Kubernetes.",
    ],
  },
];

const SKILLS: [string, string][] = [
  [
    "AI & LLM systems",
    "Multi-agent orchestration, agentic workflows, agent runtimes, RAG pipelines, vector search (pgvector), embeddings, semantic clustering, MCP servers, streaming STT/TTS, prompt versioning, LLM observability, cost and latency optimization",
  ],
  [
    "Cloud & infrastructure",
    "AWS (ECS, SQS, Lambda, S3, RDS, AppSync, CloudWatch, ECR, EC2, VPC, CloudFront), Pulumi, CDKTF, Docker, Kubernetes, GitHub Actions, GCP",
  ],
  [
    "Data",
    "PostgreSQL 17 (row-level security, pgvector), Redis, FalkorDB, Neo4j, DynamoDB, MongoDB, Elasticsearch, Kafka, Prisma, TypeORM",
  ],
  ["Languages", "TypeScript, JavaScript, Python, C/C++ (embedded firmware), Java, SQL, Cypher"],
  ["Backend & API", "Node.js, Express, FastAPI, GraphQL, AppSync, Flask, Vert.x"],
  ["Frontend", "React, Next.js, React Native, Redux, Tailwind, D3.js"],
];

export default function Resume() {
  return (
    <main id="main">
      <section className="section shell">
        <div className="resume-head">
          <div>
            <p className="eyebrow">Résumé</p>
            <h1 className="h1">{CONTACT.name}</h1>
            <p className="lead" style={{ marginBlockStart: "0.75rem" }}>
              {CONTACT.title} · {CONTACT.location} · {CONTACT.remote}
            </p>
          </div>
          <a className="btn" href="/resume.pdf" download>
            Download PDF
          </a>
        </div>
      </section>

      <section className="shell prose" style={{ paddingBlockEnd: "3rem" }}>
        <p>
          Senior AI platform engineer with nine years building production systems, specialised in
          LLM and agent infrastructure. Architect of multi-tenant conversation-intelligence and
          multi-agent orchestration platforms. Depth in agent runtimes, retrieval-augmented
          generation over pgvector, streaming voice pipelines, multi-tenant data isolation, and
          infrastructure-as-code on AWS.
        </p>
      </section>

      <section className="shell section" style={{ paddingBlockStart: 0 }}>
        <hr className="rule rule--accent" />
        <h2 className="h2" style={{ marginBlockStart: "2rem" }}>
          Experience
        </h2>
        {ROLES.map((r) => (
          <article className="resume-role" key={`${r.company}-${r.period}`}>
            <div className="resume-role__head">
              <h3 className="h3">{r.company}</h3>
              <p className="mono resume-role__meta">
                {r.title} · {r.period}
              </p>
            </div>
            <ul role="list" className="resume-role__bullets">
              {r.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="shell section" style={{ paddingBlockStart: 0 }}>
        <hr className="rule rule--strong" />
        <h2 className="h2" style={{ marginBlockStart: "2rem" }}>
          Skills
        </h2>
        <dl className="skills">
          {SKILLS.map(([k, v]) => (
            <div key={k}>
              <dt className="mono">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        <hr className="rule rule--strong" style={{ marginBlockStart: "3rem" }} />
        <h2 className="h2" style={{ marginBlockStart: "2rem" }}>
          Education
        </h2>
        <dl className="skills">
          <div>
            <dt className="mono">App Academy</dt>
            <dd>Full-Stack Web Development, New York, NY — 2017</dd>
          </div>
          <div>
            <dt className="mono">SUNY Plattsburgh</dt>
            <dd>B.S. Business Administration, New York — 2015</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
