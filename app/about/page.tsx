import type { Metadata } from "next";
import { CONTACT } from "@/lib/site";
import DrawLine from "@/components/motion/DrawLine";
import GitHubActivity from "@/components/GitHubActivity";

export const metadata: Metadata = {
  title: "About",
  description:
    "Nine years of production engineering, and the harnesses I build around AI coding tools so that an agent has to prove a feature works, not just report it.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", type: "profile" },
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
            drawing is the argument. One node per section heading — five now that
            the toolchain section exists.

            The nodes are placed geometrically at even fractions of the track, not
            measured against the headings, so this only reads correctly while the
            headings stay roughly evenly spaced. Change the count here whenever an
            h2 is added or removed below, or every node slides off the heading it
            is supposed to mark. */}
        <DrawLine nodes={5} />
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

        <h2>The toolchain, and what I&rsquo;ve built on it</h2>
        <p>
          I work in Claude Code and Cursor, with Codex and OpenCode where a second opinion helps.
          The interesting part isn&rsquo;t which one — it&rsquo;s that an agent will tell you a
          feature is done, and you need something other than its word for it. Most of what I&rsquo;ve
          built around these tools exists to answer that.
        </p>
        <p>
          <a href="https://github.com/Zuzuna54/loop-kit">loop-kit</a> is the build loop I extracted
          from a private project of roughly 1,200 commits. One feature per iteration, fresh context
          each time, and state on disk rather than in the conversation. Its whole argument lives in
          one 12&nbsp;KB script, <code>mark.sh</code>, which refuses to mark a feature done five
          different ways: it re-runs the feature&rsquo;s own verify command at mark time; it refuses
          a verify that exits zero having run nothing; it snapshots the feature&rsquo;s contract
          fields so a feature can&rsquo;t edit its way past a gate mid-run; it refuses a diff that
          weakens another already-passing test; and it requires an independent verdict to already
          exist in the changelog. Each refusal has its own exit code, so a failure says which rule
          it broke.
        </p>
        <p>
          The judge is a separate agent from the builder, and the separation is enforced by tools
          rather than by instructions — the verifier is granted read and search only, no write, no
          edit. It is mechanically incapable of touching the code it is judging. Two Claude Code
          hooks make the rest structural: one blocks <code>git commit</code> without a green gate
          receipt matching the current working tree, the other blocks ending the session while the
          exit gate is red. &ldquo;I ran the checks&rdquo; stops being a claim.
        </p>
        <p>
          The same instinct shows up in{" "}
          <a href="https://github.com/Zuzuna54/jobsearch-automation">jobsearch-automation</a>, where
          a language model writes and a deterministic check decides. Numbers in generated text must
          appear in the source document; employer names are checked against an allowlist derived
          from that document rather than a list someone maintains; every claimed skill must quote
          the source verbatim. An LLM-as-judge runs too, and a comment in the code says it is never
          authoritative. The pipeline can tailor and queue a dozen applications a day and{" "}
          <em>cannot submit one</em> — not by policy, but because there is no submit path in the
          module, which ends at a pause and hands back to a human.
        </p>
        <p>
          A metered-billing service I built carries 38 decision records, and a script fails the
          build if one lacks a rejected alternative with real reasoning behind it — measured per
          alternative, so a hollow option can&rsquo;t hide behind a substantial one. Its
          commit-time gate returns <em>ask</em> rather than <em>deny</em>, and the reason is written
          in the file: a gate that blocks normal work gets switched off, after which it protects
          nothing. That sentence is the closest thing I have to a philosophy of guardrails.
        </p>
        <p>
          The rest is smaller.{" "}
          <a href="https://github.com/Zuzuna54/inspector-hook">inspector-hook</a> watches what a
          coding agent is doing to your files and lets you keep or revert its edits one at a time,
          or roll a file back to any earlier version.{" "}
          <a href="https://github.com/Zuzuna54/sprint-harness">sprint-harness</a> gates a sprint
          through phases and can prove a guardrail fires by injecting a real violation, watching the
          gate catch it, then reversing the patch and checking the tree came back clean — it also
          runs an upstream MCP server,{" "}
          <a href="https://github.com/ruvnet/ruflo">ruflo</a>, which isn&rsquo;t mine; I use it and
          have patched a race in it. And I run my own tooling: the twenty skills, eighteen agents
          and twenty-three hook scripts in my <code>~/.claude</code> are the same set I publish, with
          install instructions, for anyone who wants them.
        </p>
        <p>
          The thing I&rsquo;d most want read as method rather than tooling: I keep a file of things
          that went wrong, dated, each mapped to the mechanism that now prevents it — a test that
          was skipped unconditionally and would have passed a build green, a schema I imagined
          instead of read. And I&rsquo;ve deleted an AI step that turned out to be decorative: a
          consensus call that returned empty and reported &ldquo;pending&rdquo; on every run,
          replaced with five deterministic checks that actually decide something.
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

      {/* Outside `.about-track` on purpose. DrawLine places one node per heading
          in that section, so a heading added here rather than there would slide
          every node off the heading it marks. This renders nothing at all when
          the API is unreachable, so the page has to read correctly without it,
          and does. */}
      <GitHubActivity />
    </main>
  );
}
