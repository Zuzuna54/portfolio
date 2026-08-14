import type { Metadata } from "next";
import { CONTACT } from "@/lib/site";
import GridReveal from "@/components/motion/GridReveal";

export const metadata: Metadata = {
  title: "Résumé",
  description: "Senior AI Platform Engineer — nine years building production systems.",
  alternates: { canonical: "/resume" },
};

type Role = {
  company: string;
  title: string;
  period: string;
  bullets: string[];
  // Optional, terse technology attribution for roles where distinctive tech
  // doesn't fold naturally into achievement-bullet prose (e.g. adjacent
  // systems that were integrated against rather than built).
  stack?: string;
};

// Every employer is named (owner's decision, 14 Aug, under written approval).
// Employment history is not confidential — it is on LinkedIn and verified by any
// background check, so withholding it here bought nothing a recruiter couldn't
// resolve in one search.
//
// What stays redacted is the layer that actually carries exposure, and the
// denylist still enforces it: product names, client names, internal package and
// file paths, instance types and regions. The line is employer-yes,
// product-and-internals-no — which is the pairing the confidentiality clause is
// actually about. Do not relax that half without asking.
const ROLES: Role[] = [
  {
    company: "Sunny Labs Inc.",
    title: "Founder & Principal Engineer",
    period: "Aug 2025 – Present",
    bullets: [
      "Architected an AI companion platform end to end in Rust (tokio, axum, tonic): custom ESP32-S3 hardware, a three-tier memory system, and a multi-tenant cloud backend licensed as a white-label platform to third-party brands.",
      "Built three memory tiers queried in parallel every turn — Redis for session state and hot facts (<5ms), Qdrant for episodic, semantic and emotional memory ranked by similarity (<50ms), and an Amazon Neptune knowledge graph for entities and relationships (<150ms). Episodic memories decay on a 30/90/180-day schedule by domain; anything accessed repeatedly and high-confidence is promoted into the permanent graph.",
      "Built a streaming voice pipeline (streaming STT → LLM → custom TTS) tuned to a 520ms latency target against an 800ms hard budget, with self-hosted LLM, embedding and emotion-model inference on AWS SageMaker (Inferentia/Trainium) behind a trait-based provider abstraction with multi-AZ failover.",
      "Enforced per-child memory isolation across licensed brands with a separate Qdrant collection and a separate Neptune subgraph per child. Internal services communicate over gRPC/tonic, with WebSocket binary framing for the real-time audio protocol and OpenTelemetry/X-Ray tracing across the critical path.",
    ],
  },
  {
    company: "Builders Studio",
    title: "Senior Platform Engineer",
    period: "Nov 2025 – Jul 2026",
    bullets: [
      "Architected a multi-tenant conversation-intelligence platform converting ~100 hours of calls a week into structured business intelligence for several teams.",
      "Built a 9-worker, queue-driven pipeline across 7 queues with 7 dead-letter queues, bounded retries, and a shared concurrent message-pool library as the reliability backbone.",
      "Designed a 4-stage signal promotion ladder that never demotes, lifting per-call learnings into cross-call signals and 31 prerequisite-chained artifact types evaluated in 2 database queries.",
      "Built retrieval over 3,072-dimension embeddings in pgvector across transcript segments, summaries and reflection insights.",
      "Shipped a chat assistant with a 24-tool function-calling registry using thinking-token streaming and parallel tool dispatch over SSE, plus an MCP server exposing the intelligence layer to external agents.",
      "Guaranteed tenant isolation via PostgreSQL row-level security over a 50+ model Prisma schema in a single-deployment architecture, with all infrastructure as code at full dev/prod parity.",
      "Cut compute cost ~94% by moving off per-task serverless containers to 3 EC2 capacity providers tuned per workload shape, autoscaled on queue backlog per task rather than CPU.",
    ],
  },
  {
    company: "Cere Network",
    title: "Senior Software Engineer",
    period: "Apr 2025 – Oct 2025",
    bullets: [
      "Built the NLP vertical on a decentralized data platform: a 10-agent pipeline where a meta-orchestrator fans batched events out to 7 model-backed agents and 3 coordination agents in parallel, merging into a social graph through a single writer.",
      "Implemented content-hash idempotency making the pipeline fully replayable — Postgres can be wiped and rebuilt from source events with identical output.",
      "Built semantic retrieval over 384-dimension embeddings in pgvector with dynamic topic clustering at a 70% similarity threshold, over a 27-table schema with 49 indexes.",
      "Exposed 5 query operations as MCP tools through the platform gateway, making the social graph directly queryable by external LLMs.",
      "Declared pipelines as infrastructure-as-code (CDKTF, custom resource types), so a new pipeline ships as a stack file and deploys without recompiling any backend service.",
      "Integrated the NLP vertical against a Substrate-based chain (five custom runtime pallets) and a signed-event ingestion pipeline — ed25519/sr25519 client signing, content-addressed storage — consuming from the same Kafka Streams topics and RocksDB-backed state store the platform's stream-ETL layer runs on.",
    ],
    stack:
      "Also read and integrated directly against, without owning: Go (the platform's unified ingestion/compute engine), Kotlin (Quarkus webhook service, Kafka Streams ETL topology).",
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
  // These two were missing, and their absence was load-bearing: the page claims
  // nine years while the roles above only span 2021–2026. A reader who counts —
  // and a recruiter does — finds five. Both are on the home-page timeline and in
  // the master résumé; only this page had dropped them.
  {
    company: "StoreTasker",
    title: "Software Engineer",
    period: "Jul 2019 – Jul 2021",
    bullets: [
      "Built a Ruby proxy layer for frontend request capture and third-party integration, and led the team's adoption of React and Node.js.",
    ],
  },
  {
    company: "Biz2Credit",
    title: "Software Engineer",
    period: "Jul 2017 – Jul 2019",
    bullets: [
      "Contributed to a monolith-to-microservices migration (Node.js/Express, Ruby on Rails), built React/Redux/TypeScript frontends, and deployed serverless services on AWS Lambda.",
    ],
  },
];

const SKILLS: [string, string][] = [
  [
    "AI & LLM systems",
    "Multi-agent orchestration, agentic workflows, agent runtimes, RAG pipelines, vector search (pgvector, Qdrant), embeddings, semantic clustering, MCP servers (client + server), streaming STT/TTS, self-hosted inference (AWS SageMaker, Inferentia/Trainium, AWS Neuron SDK), prompt versioning, LLM observability (OpenTelemetry, AWS X-Ray), cost and latency optimization",
  ],
  [
    "Cloud & infrastructure",
    "AWS (ECS on EC2, SQS, Lambda, S3, RDS, SageMaker, ElastiCache, Neptune, AppSync, CloudWatch, X-Ray, Route 53, WAF, Secrets Manager, ECR, EC2, VPC, CloudFront), CDKTF (incl. authoring custom Terraform providers), Pulumi, Docker, Kubernetes, GitHub Actions, GCP",
  ],
  [
    "Data",
    "PostgreSQL (row-level security, pgvector), Redis, Qdrant, Neo4j, Amazon Neptune, DynamoDB, MongoDB, Elasticsearch, Kafka (incl. Kafka Streams), RocksDB, Prisma, TypeORM",
  ],
  [
    "Languages",
    "Rust (tokio, axum, tonic), TypeScript, JavaScript, Python, Go, Kotlin, Java, Ruby, SQL, Cypher/openCypher, C/C++ (embedded firmware)",
  ],
  [
    "Backend & API",
    "Node.js, NestJS, Express, axum, tonic (gRPC), tokio, FastAPI, GraphQL, AppSync, Flask, Vert.x, WebSocket protocols, JSON-RPC",
  ],
  [
    "Protocols & cryptography",
    "ed25519/sr25519 signing, Curve25519, content-addressed storage (CID), Substrate/Polkadot SDK (integration), HMAC request signing",
  ],
  ["Frontend", "React, Next.js, React Native, Redux, Tailwind, D3.js"],
];

export default function Resume() {
  return (
    <main id="main">
      <GridReveal
        rules="hr"
        rows=".resume-role, .resume-role__bullets li, .skills li, .resume-head p"
      >
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
          multi-agent orchestration platforms, and of a Rust-based cloud backend for real-time
          voice AI. Depth in agent runtimes, retrieval-augmented generation over vector search,
          streaming voice pipelines, multi-tenant data isolation, and infrastructure-as-code on
          AWS.
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
            {r.stack && (
              // Not part of the GridReveal `rows` selector above, so it is
              // never subject to the reveal animation and is always visible
              // — no risk of the opacity-0/never-fires bug this page has
              // already shipped once.
              <p className="mono resume-role__meta" style={{ marginBlockStart: "0.6rem" }}>
                {r.stack}
              </p>
            )}
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
    </GridReveal>
    </main>
  );
}
