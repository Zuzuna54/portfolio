import type { Metadata } from "next";
import { CONTACT } from "@/lib/site";
import DrawLine from "@/components/motion/DrawLine";
import GitHubActivity from "@/components/GitHubActivity";

export const metadata: Metadata = {
  title: "About",
  description:
    "Nine years of production engineering — legal-AI document pipelines, ML platform tooling in biotech, founding-engineer work through SOC 2 Type 2, and embedded systems.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <main id="main">
      <section className="section shell">
        <p className="eyebrow">About</p>
        <h1 className="h1">Nine years, mostly infrastructure</h1>
      </section>

      <section className="shell shell--narrow prose about-track" style={{ paddingBlockEnd: "4rem" }}>
        {/* One continuous line down the page: a career is a single thing, so the
            drawing is the argument. Four nodes, one per section heading. */}
        <DrawLine nodes={4} />
        <p className="lead">
          I build the infrastructure that agent systems run on — orchestration, retrieval,
          evaluation, and the cost and latency controls that decide whether a system survives
          contact with production.
        </p>

        <p>
          That sentence is doing real work. The interesting problems in this field are mostly not
          about models. They are about what happens when a pipeline fails at stage six, when ten
          agents want to write to the same graph, when the bill arrives, and when someone asks
          whether the thing you built can be re-run.
        </p>

        <h2>What I&rsquo;ve been doing lately</h2>
        <p>
          A multi-tenant conversation-intelligence platform — nine queue-driven workers turning
          about a hundred hours of calls a week into structured intelligence, with retrieval over
          3,072-dimension embeddings and an MCP server exposing the whole layer to external
          agents. Before that, a ten-agent NLP pipeline where seven stateless model agents fan out
          in parallel and a single writer merges into a social graph — content-hash idempotency
          made the whole thing replayable from source events.
        </p>
        <p>
          Alongside both, my own company: an embedded AI companion platform built primarily in
          Rust, with custom ESP32-S3 hardware, three memory tiers — Redis, a vector store, and a
          knowledge graph, queried in parallel every turn — and a streaming voice loop tuned to a
          520ms target against an 800ms hard budget.
        </p>

        <h2>Before that</h2>
        <p>
          Founding engineer at a legal-AI startup, building the platform from zero and taking the
          company through SOC 2 Type 2. ML platform tooling in biotech — a model-federation
          dashboard that removed most of the manual coordination from scheduling training jobs, and
          the training-node topology rendered as an interactive graph. Earlier still, the ordinary
          and useful work: monolith-to-microservices migrations, React frontends, serverless
          services.
        </p>

        <h2>How I work</h2>
        <p>
          I care disproportionately about the properties a system has when nobody is watching it.
          Is it replayable. Does the state machine have a path backwards. Is the scaling signal
          honest or merely available. Those questions are unglamorous and they are the difference
          between a system you can operate and one you can only demo.
        </p>
        <p>
          I also think most architecture writing is too polite about tradeoffs. Every decision in
          the case studies has a cost, and I&rsquo;ve tried to name it rather than present a list
          of wins.
        </p>

        <h2>Where I am</h2>
        <p>
          {CONTACT.location}, and open to remote across the US. Currently looking for Senior AI
          Platform or AI Infrastructure roles.
        </p>
        <p>
          The fastest way to reach me is{" "}
          <a href={`mailto:${CONTACT.email}`}>email</a>, or{" "}
          <a href={CONTACT.linkedin}>LinkedIn</a>.
        </p>
      </section>

      {/* Outside `.about-track` on purpose. DrawLine places four nodes down the
          timeline, one per heading in that section — a fifth heading inside it
          would slide every node off the heading it marks. This renders nothing
          at all when the API is unreachable, so the page has to read correctly
          without it, and does. */}
      <GitHubActivity />
    </main>
  );
}
