/**
 * Architecture diagrams, as data.
 *
 * Sourced from the real design records, not sketched:
 *   · `Zuzuna54/systems-architecture-studies` — C4 context/container/component
 *     and sequence diagrams for the two production systems.
 *   · `PhaethonLabs/brain/unified_design` — the ten-document design spec for the
 *     companion device, including its per-stage latency budget.
 *
 * Every number here is the real one — 7 queues, 9 workers, 3072-dim, 27 tables,
 * 49 indexes, 384-dim, L1 <5ms / L2 <50ms / L3 <150ms, an 800ms budget against
 * a 520ms target. A diagram that rounds its numbers off stops being evidence
 * and becomes decoration.
 *
 * Each case study gets several: the shape of the system, then the one or two
 * decisions that made it worth writing about.
 */

export type NodeKind = "io" | "compute" | "queue" | "store" | "surface" | "control";

export type DNode = {
  id: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  kind?: NodeKind;
};

export type DEdge = {
  from: string;
  to: string;
  /** Explicit path, for feedback loops that shouldn't route straight through. */
  d?: string;
  label?: string;
  /** A travelling dot — reserve it for the path that carries the real work. */
  pulse?: boolean;
  dashed?: boolean;
};

/** A latency-budget bar. Width is drawn proportional to `ms`. */
export type DBar = {
  label: string;
  ms: number;
  target: number;
  note?: string;
};

export type DiagramSpec = {
  title: string;
  caption: string;
  vw: number;
  vh: number;
  nodes?: DNode[];
  edges?: DEdge[];
  /** Set instead of nodes/edges to render a budget waterfall. */
  bars?: DBar[];
  barTotal?: { budget: number; target: number };
};

const W = 132;
const H = 54;

/* ============================================================ */
/* ================ conversation-intelligence ================ */
/* ============================================================ */

// --- kept from the live site (components/diagrams/specs.ts), verbatim ---

const CIP_TOPOLOGY: DiagramSpec = {
  title: "Pipeline topology",
  caption:
    "Upload lands in object storage, seven FIFO queues fan work across nine workers, one Postgres holds state, and two surfaces read it. Every queue has a dead-letter queue behind it — a stage that fails three times stops retrying and becomes visible instead of silently looping.",
  vw: 1000,
  vh: 330,
  nodes: [
    { id: "up", x: 16, y: 26, w: 118, label: "Upload", sub: "presigned PUT", kind: "io" },
    { id: "s3", x: 166, y: 26, w: 118, label: "Object store", sub: "versioned · 30d", kind: "store" },
    { id: "ing", x: 316, y: 26, w: 122, label: "Ingestion", sub: "10MB × 4 parts", kind: "compute" },
    { id: "q", x: 470, y: 18, w: 150, h: 72, label: "7 FIFO queues", sub: "+ 7 DLQs · retry ×3", kind: "queue" },
    { id: "w", x: 656, y: 18, w: 160, h: 72, label: "9 workers", sub: "ECS on EC2 · binpack", kind: "compute" },
    { id: "pg", x: 470, y: 160, w: 160, h: 66, label: "Postgres", sub: "RLS · 50+ models", kind: "store" },
    { id: "pgv", x: 470, y: 244, w: 160, h: 62, label: "pgvector", sub: "3072-dim · HNSW", kind: "store" },
    { id: "chat", x: 700, y: 160, w: 148, label: "Chat assistant", sub: "24-tool registry", kind: "surface" },
    { id: "mcp", x: 700, y: 244, w: 148, label: "MCP server", sub: "JSON-RPC 2.0", kind: "surface" },
  ],
  edges: [
    { from: "up", to: "s3" },
    { from: "s3", to: "ing" },
    { from: "ing", to: "q", pulse: true },
    { from: "q", to: "w", pulse: true },
    { from: "w", to: "pg", pulse: true },
    { from: "pg", to: "pgv" },
    { from: "pg", to: "chat" },
    { from: "pgv", to: "mcp" },
  ],
};

const CIP_CASCADE: DiagramSpec = {
  title: "Speaker identification — a 7-stage cascade",
  caption:
    "Anonymous labels resolve to real people through seven checks ordered by confidence, not by cleverness. The cheap deterministic matches run first and settle most cases; the expensive vision call sits at stage three and therefore almost never runs. Every match records how it was made, so a wrong one can be traced and reversed.",
  vw: 1000,
  vh: 430,
  nodes: [
    { id: "in", x: 16, y: 180, w: 132, h: 60, label: "Speaker_A", sub: "from the vendor", kind: "io" },
    { id: "s1", x: 200, y: 12, w: 250, h: 44, label: "1 · Calendar attendees", sub: "match on email — exact", kind: "control" },
    { id: "s2", x: 200, y: 68, w: 250, h: 44, label: "2 · Internal directory", sub: "name + company", kind: "control" },
    { id: "s3", x: 200, y: 124, w: 250, h: 44, label: "3 · Video frame → vision model", sub: "the expensive one", kind: "compute" },
    { id: "s4", x: 200, y: 180, w: 250, h: 44, label: "4 · Search enrichment", kind: "compute" },
    { id: "s5", x: 200, y: 236, w: 250, h: 44, label: "5 · Manual curation", kind: "io" },
    { id: "s6", x: 200, y: 292, w: 250, h: 44, label: "6 · Inferred from context", sub: "nicknames, references", kind: "compute" },
    { id: "s7", x: 200, y: 348, w: 250, h: 44, label: "7 · Anonymous fallback", sub: "left unresolved, not guessed", kind: "queue" },
    { id: "out", x: 520, y: 152, w: 200, h: 68, label: "Resolved speaker", sub: "with match_source", kind: "store" },
    { id: "rev", x: 770, y: 152, w: 214, h: 68, label: "Reversible", sub: "original_speaker_id kept", kind: "surface" },
  ],
  edges: [
    { from: "in", to: "s1" },
    { from: "s1", to: "s2", dashed: true, label: "no match" },
    { from: "s2", to: "s3", dashed: true },
    { from: "s3", to: "s4", dashed: true },
    { from: "s4", to: "s5", dashed: true },
    { from: "s5", to: "s6", dashed: true },
    { from: "s6", to: "s7", dashed: true },
    { from: "s1", to: "out", pulse: true },
    { from: "s2", to: "out" },
    { from: "s7", to: "out" },
    { from: "out", to: "rev" },
  ],
};

const CIP_SCALING: DiagramSpec = {
  title: "Scaling on backlog, not CPU",
  caption:
    "A Lambda computes backlog-per-task every sixty seconds and target tracking holds it at five messages per task. CPU is a lagging indicator — it tells you a worker is busy, not that work is waiting. Queue depth is the honest signal, and switching to it is most of where the ~94% compute saving came from.",
  vw: 1000,
  vh: 250,
  nodes: [
    { id: "q", x: 16, y: 90, w: 150, h: 62, label: "Queue depth", sub: "messages visible", kind: "queue" },
    { id: "lam", x: 214, y: 90, w: 168, h: 62, label: "Backlog metric", sub: "Lambda · every 60s", kind: "control" },
    { id: "cw", x: 430, y: 90, w: 160, h: 62, label: "CloudWatch", sub: "BacklogPerTask", kind: "store" },
    { id: "aas", x: 638, y: 90, w: 168, h: 62, label: "Target tracking", sub: "5 messages / task", kind: "control" },
    { id: "ecs", x: 854, y: 90, w: 130, h: 62, label: "Desired count", sub: "0 … N tasks", kind: "compute" },
  ],
  edges: [
    { from: "q", to: "lam", pulse: true },
    { from: "lam", to: "cw" },
    { from: "cw", to: "aas" },
    { from: "aas", to: "ecs", pulse: true },
    { from: "ecs", to: "q", dashed: true, d: "M 919 152 V 210 H 91 V 152" },
  ],
};

// --- new: the promotion ladder, drawn out (currently prose-only on the site) ---

const CIP_LADDER: DiagramSpec = {
  title: "A ladder that only climbs",
  caption:
    "Four stages, promoted on evidence thresholds — 3 pieces to emerging, 5 across 2 conversations to validated, 10 across 3 to decision-grade. There is no path back down: a signal's stage is a fact about evidence accumulated, not a value that can flap between runs, so 31 downstream artifact types can gate on a threshold comparison instead of a graph walk.",
  vw: 1000,
  vh: 280,
  nodes: [
    { id: "in", x: 16, y: 98, w: 150, h: 56, label: "Per-call learning", sub: "Gemini extract", kind: "io" },
    { id: "s1", x: 196, y: 98, w: 150, h: 56, label: "1 · Candidate", sub: "single mention", kind: "control" },
    { id: "s2", x: 396, y: 98, w: 150, h: 56, label: "2 · Emerging", sub: "≥3 evidence", kind: "control" },
    { id: "s3", x: 596, y: 98, w: 150, h: 56, label: "3 · Validated", sub: "≥5 · 2 convos", kind: "control" },
    { id: "s4", x: 796, y: 98, w: 170, h: 56, label: "4 · Decision-grade", sub: "≥10 · 3 convos", kind: "surface" },
    { id: "lock", x: 396, y: 200, w: 350, h: 50, label: "No path back down", sub: "monotonic by design", kind: "store" },
    { id: "gate", x: 796, y: 200, w: 170, h: 50, label: "Gates 31 artifacts", sub: "2 queries, not a walk", kind: "surface" },
  ],
  edges: [
    { from: "in", to: "s1" },
    { from: "s1", to: "s2", label: "3 evidence" },
    { from: "s2", to: "s3", label: "5 · 2 convos" },
    { from: "s3", to: "s4", label: "10 · 3 convos", pulse: true },
    { from: "s2", to: "lock", dashed: true },
    { from: "s3", to: "lock", dashed: true },
    { from: "s4", to: "gate", pulse: true },
  ],
};

// --- new: the chat assistant's trust boundary, sitting below the LLM ---

const CIP_CHAT_FANOUT: DiagramSpec = {
  title: "The tenant boundary lives below the LLM",
  caption:
    "Thinking tokens stream on their own channel while the model decides which of 24 tools to call; every call is dispatched in parallel and passes through one executor that rewrites venture scope before anything touches the database. A prompt injection that convinces the model to name a foreign venture still can't reach it — the boundary isn't the model's judgment, it's the layer underneath it.",
  vw: 1000,
  vh: 300,
  nodes: [
    { id: "in", x: 16, y: 130, w: 130, h: 56, label: "User query", sub: "+ venture scope", kind: "io" },
    { id: "ctx", x: 180, y: 130, w: 150, h: 56, label: "Context assembler", sub: "embed + prompt", kind: "compute" },
    { id: "gem", x: 364, y: 60, w: 170, h: 52, label: "Gemini 2.5 Pro", sub: "generateContentStream", kind: "compute" },
    { id: "think", x: 364, y: 140, w: 170, h: 44, label: "Thinking stream", sub: "separate SSE channel", kind: "surface" },
    { id: "calls", x: 364, y: 200, w: 170, h: 44, label: "Function calls", sub: "collected from stream", kind: "control" },
    { id: "scope", x: 570, y: 140, w: 190, h: 60, label: "enforceVentureScope", sub: "the trust boundary", kind: "control" },
    { id: "t1", x: 800, y: 30, w: 180, h: 40, label: "rag_search_segments", kind: "compute" },
    { id: "t2", x: 800, y: 82, w: 180, h: 40, label: "list_conversations", kind: "compute" },
    { id: "t3", x: 800, y: 134, w: 180, h: 40, label: "+ 22 more tools", sub: "Promise.allSettled", kind: "compute" },
    { id: "db", x: 800, y: 200, w: 180, h: 50, label: "Postgres + pgvector", kind: "store" },
  ],
  edges: [
    { from: "in", to: "ctx" },
    { from: "ctx", to: "gem", pulse: true },
    { from: "gem", to: "think", dashed: true },
    { from: "gem", to: "calls" },
    { from: "calls", to: "scope", pulse: true },
    { from: "scope", to: "t1" },
    { from: "scope", to: "t2" },
    { from: "scope", to: "t3" },
    { from: "t1", to: "db" },
    { from: "t2", to: "db" },
    { from: "t3", to: "db" },
  ],
};

/* ============================================================ */
/* ========================= agent-pipeline ==================== */
/* ============================================================ */

// --- kept from the live site, verbatim ---

const AP_FANOUT: DiagramSpec = {
  title: "Fan out the reads, serialise the writes",
  caption:
    "Ten agents read the same batch in parallel and exactly one thing writes. Letting each agent own its slice of state feels more autonomous and is how most agent systems get built — it also means every new agent multiplies the interleavings you have to reason about, and the failures arrive as corrupted relationships at 3am rather than as a stack trace.",
  vw: 1000,
  vh: 430,
  nodes: [
    { id: "in", x: 16, y: 180, w: 118, label: "Messages", sub: "signed", kind: "io" },
    { id: "acc", x: 160, y: 180, w: 126, label: "Accumulator", sub: "Redis batching", kind: "queue" },
    { id: "con", x: 316, y: 180, w: 132, label: "Orchestrator", sub: "fans out parallel", kind: "compute" },
    { id: "a1", x: 496, y: 14, w: 128, h: 38, label: "sentiment", kind: "compute" },
    { id: "a2", x: 496, y: 60, w: 128, h: 38, label: "embed · 384-d", kind: "compute" },
    { id: "a3", x: 496, y: 106, w: 128, h: 38, label: "toxicity", kind: "compute" },
    { id: "a4", x: 496, y: 152, w: 128, h: 38, label: "spam", kind: "compute" },
    { id: "a5", x: 496, y: 198, w: 128, h: 38, label: "emoji", kind: "compute" },
    { id: "a6", x: 496, y: 244, w: 128, h: 38, label: "topic · 70%", kind: "compute" },
    { id: "a7", x: 496, y: 290, w: 128, h: 38, label: "relationship", kind: "compute" },
    { id: "a8", x: 496, y: 336, w: 128, h: 38, label: "3 graph agents", sub: "non-AI", kind: "control" },
    { id: "sto", x: 682, y: 166, w: 150, h: 68, label: "Single writer", sub: "only path to state", kind: "control" },
    { id: "graph", x: 866, y: 166, w: 118, h: 68, label: "Social graph", sub: "users · topics", kind: "store" },
  ],
  edges: [
    { from: "in", to: "acc" },
    { from: "acc", to: "con", pulse: true },
    ...["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"].map((to, i) => ({
      from: "con",
      to,
      pulse: i === 3,
    })),
    ...["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"].map((from, i) => ({
      from,
      to: "sto",
      pulse: i === 3,
    })),
    { from: "sto", to: "graph", pulse: true },
  ],
};

const AP_REPLAY: DiagramSpec = {
  title: "Why the pipeline is replayable",
  caption:
    "Every write goes through a content hash first. Re-running the pipeline over the same source events produces the same graph, which means Postgres is a cache rather than the record — it can be wiped and rebuilt from source. That one property at the storage layer is what turns a pipeline you are afraid to re-run into one you can.",
  vw: 1000,
  vh: 300,
  nodes: [
    { id: "src", x: 16, y: 110, w: 140, h: 66, label: "Source events", sub: "the actual record", kind: "io" },
    { id: "dd", x: 210, y: 110, w: 166, h: 66, label: "Delta detector", sub: "content-hash compare", kind: "control" },
    { id: "esm", x: 424, y: 40, w: 166, h: 60, label: "Entity writes", sub: "normalised rows", kind: "compute" },
    { id: "gs", x: 424, y: 186, w: 166, h: 60, label: "Graph snapshot", sub: "JSONB blob", kind: "compute" },
    { id: "pg", x: 640, y: 40, w: 160, h: 60, label: "Postgres", sub: "27 tables · 49 idx", kind: "store" },
    { id: "pgv", x: 640, y: 186, w: 160, h: 60, label: "pgvector", sub: "384-dim", kind: "store" },
    { id: "wipe", x: 840, y: 110, w: 144, h: 66, label: "Disposable", sub: "wipe → rebuild", kind: "surface" },
  ],
  edges: [
    { from: "src", to: "dd", pulse: true },
    { from: "dd", to: "esm" },
    { from: "dd", to: "gs" },
    { from: "esm", to: "pg", pulse: true },
    { from: "gs", to: "pgv" },
    { from: "pg", to: "wipe" },
    { from: "pgv", to: "wipe" },
    { from: "wipe", to: "src", dashed: true, label: "rebuild", d: "M 912 176 V 262 H 86 V 176" },
  ],
};

// --- new: batch before you fan out to the model ---

const AP_BATCH: DiagramSpec = {
  title: "Batch before you fan out to the model",
  caption:
    "A Redis-only raft collects incoming messages until a threshold or timeout before the ten-agent fan-out ever runs. Batching amortises the Gemini call across every message in the batch instead of paying full model latency and cost per message — the fan-out pattern only works economically because this stage exists in front of it.",
  vw: 1000,
  vh: 220,
  nodes: [
    { id: "src", x: 16, y: 80, w: 150, h: 56, label: "Signed messages", sub: "ed25519 verified", kind: "io" },
    { id: "cce", x: 196, y: 80, w: 160, h: 56, label: "Signature guard", sub: "compute engine", kind: "control" },
    { id: "acc", x: 386, y: 80, w: 170, h: 56, label: "AccumulatorRaft", sub: "Redis · batches", kind: "queue" },
    { id: "con", x: 586, y: 80, w: 170, h: 56, label: "Meta-orchestrator", sub: "fans out per batch", kind: "compute" },
    { id: "note", x: 386, y: 160, w: 370, h: 44, label: "1 Gemini call / batch", sub: "not one per message", kind: "surface" },
  ],
  edges: [
    { from: "src", to: "cce" },
    { from: "cce", to: "acc", pulse: true },
    { from: "acc", to: "con", pulse: true },
    { from: "acc", to: "note", dashed: true },
  ],
};

// --- new: the 70% threshold decision, made concrete ---

const AP_CLUSTERING: DiagramSpec = {
  title: "70% is a threshold, not a law",
  caption:
    "384-dimension embeddings — an order of magnitude smaller than the 3,072-dim used in the conversation-intelligence platform, deliberately, because clustering short chat messages into topics doesn't need the resolution that distinguishing fine semantic shades across long transcripts does. The single global 70% cutoff is the rough edge: it serves the middle of the topic-density distribution well and the tails poorly.",
  vw: 1000,
  vh: 280,
  nodes: [
    { id: "msg", x: 16, y: 110, w: 130, h: 56, label: "Chat message", kind: "io" },
    { id: "emb", x: 180, y: 110, w: 150, h: 56, label: "Embed · 384-d", sub: "Gemini, not OpenAI", kind: "compute" },
    { id: "sim", x: 364, y: 110, w: 170, h: 56, label: "Cosine similarity", sub: "vs. existing clusters", kind: "compute" },
    { id: "join", x: 580, y: 40, w: 190, h: 56, label: "≥70% → join cluster", kind: "store" },
    { id: "new", x: 580, y: 150, w: 190, h: 56, label: "<70% → new cluster", kind: "store" },
    { id: "note", x: 800, y: 95, w: 180, h: 66, label: "One global constant", sub: "tails served poorly", kind: "surface" },
  ],
  edges: [
    { from: "msg", to: "emb" },
    { from: "emb", to: "sim", pulse: true },
    { from: "sim", to: "join", dashed: true, label: "above" },
    { from: "sim", to: "new", dashed: true, label: "below" },
    { from: "join", to: "note" },
    { from: "new", to: "note" },
  ],
};

// --- new: declaring a query gets you an MCP tool for free ---

const AP_MCP_QUERIES: DiagramSpec = {
  title: "Declare a query, get an LLM tool for free",
  caption:
    "Five query operations sit on top of the same 27-table schema — semantic search, three demand/engagement signals, and a profile lookup. None of them is a hand-written endpoint: declaring a query operation on the storage raft is what makes the gateway expose it as an MCP tool automatically, so an external LLM can ask what a chat group cares about without anyone writing that route.",
  vw: 1000,
  vh: 260,
  nodes: [
    { id: "pg", x: 16, y: 100, w: 160, h: 60, label: "Postgres + pgvector", sub: "27 tables · graph", kind: "store" },
    { id: "q1", x: 240, y: 20, w: 200, h: 38, label: "semantic_tree_query", kind: "compute" },
    { id: "q2", x: 240, y: 64, w: 200, h: 38, label: "what_people_want", kind: "compute" },
    { id: "q3", x: 240, y: 108, w: 200, h: 38, label: "what_people_care_about", kind: "compute" },
    { id: "q4", x: 240, y: 152, w: 200, h: 38, label: "user_details", kind: "compute" },
    { id: "q5", x: 240, y: 196, w: 200, h: 38, label: "topics_talked_about", kind: "compute" },
    { id: "mcp", x: 520, y: 108, w: 170, h: 56, label: "MCP gateway", sub: "auto-exposed", kind: "control" },
    { id: "llm", x: 770, y: 108, w: 190, h: 56, label: "External LLM client", kind: "surface" },
  ],
  edges: [
    { from: "pg", to: "q1" },
    { from: "pg", to: "q2" },
    { from: "pg", to: "q3" },
    { from: "pg", to: "q4" },
    { from: "pg", to: "q5" },
    { from: "q1", to: "mcp" },
    { from: "q2", to: "mcp" },
    { from: "q3", to: "mcp" },
    { from: "q4", to: "mcp" },
    { from: "q5", to: "mcp", pulse: true },
    { from: "mcp", to: "llm", pulse: true },
  ],
};

/* ============================================================ */
/* ===================== decentralized-platform ================ */
/* ============================================================ */
/*
 * New fourth case study: the Substrate chain + content-addressed storage
 * platform that the agent-pipeline case study's 10-agent NLP vertical runs
 * on top of. These five diagrams are what the existing site is missing —
 * the platform itself, not just the one vertical built on it.
 */

const DP_TOPOLOGY: DiagramSpec = {
  title: "One chain that only holds registry state",
  caption:
    "Signed events flow from source apps through Kafka into content-addressed storage — the heavy, high-volume path never touches consensus. The chain sits to the side holding only identities, clusters, customers, staking, and governance; that split is what lets a data-heavy platform run on a blockchain without the blockchain becoming the bottleneck.",
  vw: 1000,
  vh: 300,
  nodes: [
    { id: "clients", x: 10, y: 150, w: 130, h: 56, label: "Source apps", sub: "bots · drones", kind: "io" },
    { id: "sdk", x: 168, y: 150, w: 130, h: 56, label: "Signed SDK", sub: "sign every event", kind: "compute" },
    { id: "gw", x: 326, y: 150, w: 130, h: 56, label: "Ingress gateway", sub: "verify + encrypt", kind: "control" },
    { id: "kafka", x: 484, y: 110, w: 130, h: 56, label: "Kafka topics", sub: "per-app streams", kind: "queue" },
    { id: "etl", x: 484, y: 196, w: 130, h: 56, label: "Stream ETL", sub: "DAG writer", kind: "compute" },
    { id: "storage", x: 642, y: 110, w: 130, h: 56, label: "Content store", sub: "CID-addressed", kind: "store" },
    { id: "chain", x: 642, y: 196, w: 130, h: 56, label: "Chain", sub: "registry only", kind: "store" },
    { id: "query", x: 810, y: 150, w: 150, h: 56, label: "Query gateway", sub: "→ MCP verticals", kind: "surface" },
  ],
  edges: [
    { from: "clients", to: "sdk" },
    { from: "sdk", to: "gw" },
    { from: "gw", to: "kafka", pulse: true },
    { from: "gw", to: "chain", dashed: true, label: "account check" },
    { from: "kafka", to: "etl" },
    { from: "etl", to: "storage", pulse: true },
    { from: "etl", to: "chain", dashed: true, label: "CID refs" },
    { from: "storage", to: "query" },
    { from: "chain", to: "query", dashed: true },
  ],
};

const DP_ONCHAIN_BOUNDARY: DiagramSpec = {
  title: "What's on-chain, what's off-chain, and why",
  caption:
    "Five pallets hold registry state — node identities, clusters, customer accounts, staking, governance. The actual bytes live off-chain on staked storage and CDN nodes, addressed by content hash. Staking is enforced on-chain but pays or slashes based on off-chain behaviour, and a tampered file simply produces a different CID — content addressing is what lets an on-chain economic incentive govern off-chain data without the chain ever storing it.",
  vw: 1000,
  vh: 300,
  nodes: [
    { id: "p1", x: 16, y: 16, w: 170, h: 40, label: "Nodes pallet", kind: "control" },
    { id: "p2", x: 16, y: 64, w: 170, h: 40, label: "Clusters pallet", kind: "control" },
    { id: "p3", x: 16, y: 112, w: 170, h: 40, label: "Customers pallet", kind: "control" },
    { id: "p4", x: 16, y: 160, w: 170, h: 40, label: "Staking pallet", kind: "control" },
    { id: "p5", x: 16, y: 208, w: 170, h: 40, label: "ClustersGov pallet", kind: "control" },
    { id: "sn", x: 420, y: 60, w: 180, h: 56, label: "Storage nodes", sub: "content-addressed", kind: "store" },
    { id: "cdn", x: 420, y: 150, w: 180, h: 56, label: "CDN nodes", sub: "cache CIDs", kind: "store" },
    { id: "op", x: 660, y: 100, w: 170, h: 56, label: "Node operator", sub: "stakes, gets paid", kind: "io" },
    { id: "cid", x: 660, y: 190, w: 220, h: 50, label: "CID mismatch → slash", sub: "tamper-evident", kind: "surface" },
  ],
  edges: [
    { from: "p4", to: "op", dashed: true, label: "enforces stake" },
    { from: "p1", to: "sn", dashed: true, label: "tracks" },
    { from: "p1", to: "cdn", dashed: true, label: "tracks" },
    { from: "op", to: "sn", label: "runs" },
    { from: "op", to: "cdn", label: "runs" },
    { from: "sn", to: "cid" },
    { from: "cdn", to: "cid" },
    { from: "cid", to: "p4", dashed: true, label: "slash" },
  ],
};

const DP_SIGNED_INGEST: DiagramSpec = {
  title: "Attribution is enforced at the edge, not assumed",
  caption:
    "Every client signs its own events with an ed25519 or sr25519 key before anything is admitted. The gateway's only chain interaction on this path is a read — confirming the signer is a known account — so signature verification never becomes a write bottleneck against consensus; forgery is cryptographically prevented before the event exists downstream.",
  vw: 1000,
  vh: 220,
  nodes: [
    { id: "app", x: 16, y: 80, w: 140, h: 56, label: "Client app", kind: "io" },
    { id: "sign", x: 196, y: 80, w: 160, h: 56, label: "Sign event", sub: "ed25519 / sr25519", kind: "compute" },
    { id: "gw", x: 396, y: 80, w: 170, h: 56, label: "Gateway verify", sub: "sig + account check", kind: "control" },
    { id: "chain", x: 606, y: 20, w: 180, h: 50, label: "Chain — read only", sub: "account exists?", kind: "store" },
    { id: "kafka", x: 606, y: 110, w: 180, h: 50, label: "Kafka", sub: "event admitted", kind: "queue" },
    { id: "reject", x: 826, y: 20, w: 160, h: 50, label: "Rejected", sub: "unknown signer", kind: "surface" },
  ],
  edges: [
    { from: "app", to: "sign" },
    { from: "sign", to: "gw", pulse: true },
    { from: "gw", to: "chain", dashed: true, label: "lookup" },
    { from: "chain", to: "gw", dashed: true },
    { from: "gw", to: "kafka", pulse: true, label: "admitted" },
    { from: "gw", to: "reject", dashed: true, label: "unverified" },
  ],
};

const DP_KAFKA_DAG: DiagramSpec = {
  title: "Why Kafka Streams, specifically",
  caption:
    "A persistent, RocksDB-backed state store holds the previous content ID for every stream key, so each new event reads it, writes a new DAG node referencing it, and updates the store — the same pattern a plain consumer or Flink wouldn't guarantee. Two events racing for the same 'previous CID' would corrupt the DAG, and Kafka's exactly-once transactional semantics are specifically what rules that race out.",
  vw: 1000,
  vh: 260,
  nodes: [
    { id: "kafka", x: 16, y: 100, w: 140, h: 56, label: "Kafka topic", kind: "queue" },
    { id: "topo", x: 196, y: 100, w: 170, h: 56, label: "Streams topology", sub: "processValues", kind: "compute" },
    { id: "state", x: 406, y: 40, w: 190, h: 56, label: "Last-CID store", sub: "RocksDB · persistent", kind: "store" },
    { id: "dag", x: 406, y: 160, w: 190, h: 56, label: "DAG write", sub: "node → prev CID", kind: "compute" },
    { id: "storage", x: 636, y: 160, w: 170, h: 56, label: "Content store", kind: "store" },
    { id: "idx", x: 636, y: 40, w: 170, h: 56, label: "ES + Postgres idx", kind: "store" },
    { id: "once", x: 846, y: 100, w: 140, h: 56, label: "Exactly-once", sub: "Kafka transaction", kind: "surface" },
  ],
  edges: [
    { from: "kafka", to: "topo", pulse: true },
    { from: "topo", to: "state", label: "read prev CID" },
    { from: "state", to: "topo", dashed: true, label: "returns" },
    { from: "topo", to: "dag", pulse: true },
    { from: "dag", to: "storage" },
    { from: "topo", to: "idx" },
    { from: "dag", to: "once", dashed: true },
    { from: "state", to: "once", dashed: true },
  ],
};

const DP_RAFT_IAC: DiagramSpec = {
  title: "A new pipeline is a stack file, not a service",
  caption:
    "Four custom Terraform resource types — Stream, Raft, Agent, Engagement — let a pipeline be declared instead of coded. The moment a Raft's query operations deploy, the gateway exposes them as MCP tools with zero change to the platform itself; that's what let an entirely separate team ship a computer-vision vertical without ever touching this codebase.",
  vw: 1000,
  vh: 260,
  nodes: [
    { id: "stack", x: 16, y: 100, w: 150, h: 56, label: "CDKTF stack file", sub: "TypeScript", kind: "compute" },
    { id: "res1", x: 196, y: 40, w: 170, h: 40, label: "Stream resource", kind: "control" },
    { id: "res2", x: 196, y: 90, w: 170, h: 40, label: "Raft resource", sub: "index + query", kind: "control" },
    { id: "res3", x: 196, y: 140, w: 170, h: 40, label: "Agent resource", kind: "control" },
    { id: "res4", x: 196, y: 190, w: 170, h: 40, label: "Engagement", kind: "control" },
    { id: "deploy", x: 406, y: 100, w: 140, h: 56, label: "cdktf deploy", kind: "compute" },
    { id: "provider", x: 586, y: 100, w: 180, h: 56, label: "Custom TF provider", kind: "control" },
    { id: "runtime", x: 806, y: 60, w: 170, h: 56, label: "Platform runtime", sub: "runs scripts", kind: "compute" },
    { id: "mcp", x: 806, y: 150, w: 170, h: 56, label: "MCP gateway", sub: "auto-exposed", kind: "surface" },
  ],
  edges: [
    { from: "stack", to: "res1" },
    { from: "stack", to: "res2" },
    { from: "stack", to: "res3" },
    { from: "stack", to: "res4" },
    { from: "res1", to: "deploy" },
    { from: "res2", to: "deploy" },
    { from: "res3", to: "deploy" },
    { from: "res4", to: "deploy", pulse: true },
    { from: "deploy", to: "provider", pulse: true },
    { from: "provider", to: "runtime" },
    { from: "runtime", to: "mcp", pulse: true },
  ],
};

/* ============================================================ */
/* ============================= lumi =========================== */
/* ============================================================ */

// --- kept from the live site, verbatim (already accurate — see 00-corrections.md) ---

const LUMI_BUDGET: DiagramSpec = {
  title: "The latency budget",
  caption:
    "Every stage between a child finishing a sentence and hearing a reply, with the time it is allowed to take. The budget totals 800ms and the target 520ms — and the way you hit it is that these stages overlap rather than queue: transcription streams partial text, the model streams tokens, and speech synthesis starts before the sentence is finished.",
  vw: 1000,
  vh: 400,
  barTotal: { budget: 800, target: 520 },
  bars: [
    { label: "Audio in", ms: 20, target: 10, note: "network + buffering" },
    { label: "Speech to text", ms: 150, target: 100, note: "streaming partials" },
    { label: "Context", ms: 30, target: 20, note: "intent + emotion" },
    { label: "Memory recall", ms: 50, target: 30, note: "L1/L2/L3 in parallel" },
    { label: "Reasoning", ms: 300, target: 200, note: "streamed tokens" },
    { label: "Safety + format", ms: 50, target: 30 },
    { label: "Speech out", ms: 150, target: 100, note: "synthesised streaming" },
    { label: "Audio out", ms: 50, target: 30 },
  ],
};

const LUMI_MEMORY: DiagramSpec = {
  title: "Three tiers of memory",
  caption:
    "Recall is split by how fast it has to be and how much it has to hold. All three are queried at once, and a slow tier is dropped rather than waited on — a companion that pauses to remember has already broken the illusion. Emotional memory lives inside the semantic tier as a type, not as a fourth store — the split is by access pattern, not by content.",
  vw: 1000,
  vh: 380,
  nodes: [
    { id: "turn", x: 16, y: 150, w: 148, h: 70, label: "Conversation turn", sub: "what was just said", kind: "io" },
    { id: "ctx", x: 214, y: 150, w: 150, h: 70, label: "Context builder", sub: "queries all three", kind: "control" },
    { id: "l1", x: 428, y: 22, w: 244, h: 66, label: "L1 · Working", sub: "Redis · < 5ms · ~100KB", kind: "store" },
    { id: "l2", x: 428, y: 150, w: 244, h: 66, label: "L2 · Semantic", sub: "vectors · < 50ms · ~10MB", kind: "store" },
    { id: "l3", x: 428, y: 278, w: 244, h: 66, label: "L3 · Graph", sub: "entities · < 150ms · ~1MB", kind: "store" },
    { id: "drop", x: 720, y: 22, w: 264, h: 66, label: "Slow tier dropped", sub: "answer beats completeness", kind: "surface" },
    { id: "rep", x: 720, y: 150, w: 264, h: 66, label: "Decays unless promoted", sub: "30/90/180-day default", kind: "control" },
    { id: "rls", x: 720, y: 278, w: 264, h: 66, label: "Isolated per child", sub: "own collection + subgraph", kind: "surface" },
  ],
  edges: [
    { from: "turn", to: "ctx", pulse: true },
    { from: "ctx", to: "l1", pulse: true },
    { from: "ctx", to: "l2" },
    { from: "ctx", to: "l3" },
    { from: "l1", to: "drop", dashed: true },
    { from: "l2", to: "rep" },
    { from: "l3", to: "rls", dashed: true },
  ],
};

// --- new: failure and degradation, the "graceful degradation" principle drawn out ---

const LUMI_DEGRADATION: DiagramSpec = {
  title: "Fail fast, fall back gracefully",
  caption:
    "A circuit breaker moves closed → open → half-open around every external call, and each of L2 and L3 has its own timeout that skips the tier rather than blocking the turn. Degradation is staged, not binary: normal, then memory-degraded, then LLM-degraded, then a canned emergency response — the child is never left waiting on a stalled component to decide what happens next.",
  vw: 1000,
  vh: 320,
  nodes: [
    { id: "req", x: 16, y: 40, w: 140, h: 50, label: "Request", kind: "io" },
    { id: "cb", x: 196, y: 40, w: 170, h: 50, label: "Circuit breaker", sub: "closed → open → half", kind: "control" },
    { id: "prim", x: 406, y: 10, w: 170, h: 44, label: "Primary endpoint", kind: "compute" },
    { id: "sec", x: 406, y: 66, w: 170, h: 44, label: "Secondary AZ", kind: "compute" },
    { id: "l2to", x: 196, y: 170, w: 170, h: 44, label: "L2 timeout 50ms", sub: "skip, don't block", kind: "queue" },
    { id: "l3to", x: 196, y: 224, w: 170, h: 44, label: "L3 timeout 100ms", sub: "skip, don't block", kind: "queue" },
    { id: "normal", x: 650, y: 10, w: 170, h: 40, label: "Normal mode", kind: "surface" },
    { id: "degmem", x: 650, y: 58, w: 170, h: 40, label: "Degraded memory", sub: "L1 only", kind: "surface" },
    { id: "deglm", x: 650, y: 106, w: 170, h: 40, label: "Degraded LLM", sub: "fallback model", kind: "surface" },
    { id: "emerg", x: 650, y: 154, w: 170, h: 40, label: "Emergency", sub: "canned response", kind: "surface" },
  ],
  edges: [
    { from: "req", to: "cb" },
    { from: "cb", to: "prim" },
    { from: "cb", to: "sec", dashed: true, label: "on failure" },
    { from: "prim", to: "normal" },
    { from: "sec", to: "deglm", dashed: true },
    { from: "l2to", to: "degmem", dashed: true },
    { from: "l3to", to: "degmem", dashed: true },
    { from: "degmem", to: "emerg", dashed: true },
    { from: "deglm", to: "emerg", dashed: true },
  ],
};

// --- new: mode switching, with the one rule that matters ---

const LUMI_MODE_SWITCH: DiagramSpec = {
  title: "Emotional support can interrupt anything",
  caption:
    "Four task modes sit under Normal — math help, homework help, story time, games — and any of them can be entered and exited on its own terms. Emotional support is the exception: it can interrupt every other mode, including itself never being interrupted back, because a child's wellbeing is the one priority the state machine encodes as absolute rather than negotiable.",
  vw: 1000,
  vh: 300,
  nodes: [
    { id: "normal", x: 400, y: 20, w: 200, h: 56, label: "Normal", kind: "compute" },
    { id: "math", x: 40, y: 130, w: 170, h: 50, label: "Math help", kind: "compute" },
    { id: "hw", x: 260, y: 130, w: 170, h: 50, label: "Homework help", kind: "compute" },
    { id: "story", x: 480, y: 130, w: 170, h: 50, label: "Story time", kind: "compute" },
    { id: "game", x: 700, y: 130, w: 170, h: 50, label: "Game mode", kind: "compute" },
    { id: "es", x: 400, y: 232, w: 200, h: 56, label: "Emotional support", sub: "can interrupt ANY mode", kind: "surface" },
  ],
  edges: [
    { from: "normal", to: "math" },
    { from: "normal", to: "hw" },
    { from: "normal", to: "story" },
    { from: "normal", to: "game" },
    { from: "math", to: "normal", dashed: true, label: "task complete" },
    { from: "hw", to: "normal", dashed: true },
    { from: "story", to: "normal", dashed: true },
    { from: "game", to: "normal", dashed: true },
    { from: "normal", to: "es", pulse: true, label: "trigger — priority" },
    { from: "math", to: "es", dashed: true },
    { from: "hw", to: "es", dashed: true },
    { from: "story", to: "es", dashed: true },
    { from: "game", to: "es", dashed: true },
    { from: "es", to: "normal", label: "resolved" },
  ],
};

// --- new: dedicated worker lanes so safety is never starved ---

const LUMI_BACKGROUND_PRIORITY: DiagramSpec = {
  title: "Dedicated lanes so safety never waits",
  caption:
    "Eight background agents route through four priority queues, but the pool isn't shared evenly — workers 1 and 2 are reserved for critical and high-priority work only, so safety monitoring always has processing capacity regardless of how backed up personality evolution or index optimisation get. The alternative, one shared pool, would let a burst of low-priority work delay a safety check.",
  vw: 1000,
  vh: 260,
  nodes: [
    { id: "ev", x: 16, y: 100, w: 140, h: 56, label: "Event bus", sub: "Redis Streams", kind: "queue" },
    { id: "qc", x: 210, y: 20, w: 150, h: 44, label: "Critical queue", sub: "safety", kind: "queue" },
    { id: "qh", x: 210, y: 74, w: 150, h: 44, label: "High queue", sub: "memory", kind: "queue" },
    { id: "qm", x: 210, y: 128, w: 150, h: 44, label: "Medium queue", kind: "queue" },
    { id: "ql", x: 210, y: 182, w: 150, h: 44, label: "Low queue", kind: "queue" },
    { id: "w1", x: 420, y: 20, w: 150, h: 44, label: "Worker 1", sub: "crit/high only", kind: "compute" },
    { id: "w2", x: 420, y: 74, w: 150, h: 44, label: "Worker 2", sub: "crit/high only", kind: "compute" },
    { id: "w3", x: 420, y: 128, w: 150, h: 44, label: "Worker 3", sub: "medium", kind: "compute" },
    { id: "w4", x: 420, y: 182, w: 150, h: 44, label: "Worker 4", sub: "low", kind: "compute" },
    { id: "safety", x: 630, y: 20, w: 180, h: 44, label: "Safety monitoring", sub: "never starved", kind: "surface" },
  ],
  edges: [
    { from: "ev", to: "qc" },
    { from: "ev", to: "qh" },
    { from: "ev", to: "qm" },
    { from: "ev", to: "ql" },
    { from: "qc", to: "w1", pulse: true },
    { from: "qc", to: "w2" },
    { from: "qh", to: "w1" },
    { from: "qh", to: "w2" },
    { from: "qm", to: "w3" },
    { from: "ql", to: "w4" },
    { from: "w1", to: "safety", pulse: true },
  ],
};

/* ========================================================================= */

export const DIAGRAMS: Record<string, DiagramSpec[]> = {
  "conversation-intelligence": [CIP_TOPOLOGY, CIP_CASCADE, CIP_SCALING, CIP_LADDER, CIP_CHAT_FANOUT],
  "agent-pipeline": [AP_FANOUT, AP_REPLAY, AP_BATCH, AP_CLUSTERING, AP_MCP_QUERIES],
  "decentralized-platform": [DP_TOPOLOGY, DP_ONCHAIN_BOUNDARY, DP_SIGNED_INGEST, DP_KAFKA_DAG, DP_RAFT_IAC],
  lumi: [LUMI_BUDGET, LUMI_MEMORY, LUMI_DEGRADATION, LUMI_MODE_SWITCH, LUMI_BACKGROUND_PRIORITY],
};

export const DEFAULT_W = W;
export const DEFAULT_H = H;
