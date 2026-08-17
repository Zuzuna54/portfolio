import type { Metadata } from "next";
import Link from "next/link";
import { getWriting } from "@/lib/content";
import { monthLabel } from "@/lib/dates";
import Scramble from "@/components/motion/Scramble";

// Counted, not written down — and no longer claiming "under two hundred words",
// which stopped being true when the posts were rewritten for depth (~380 now).
// Descriptions target 150–160 chars: Google truncates around there, and the
// previous one wasted the budget on a number that dates itself.
export function generateMetadata(): Metadata {
  const n = getWriting().length;
  const description =
    `${n} production teardowns, engineer to engineer — replayable pipelines, queue-driven ` +
    `workers, promotion ladders, voice latency. One problem, one real number each.`;
  return {
    title: "Writing",
    description,
    alternates: { canonical: "/writing" },
    openGraph: {
      title: `Writing — ${n} production teardowns`,
      description,
      url: "/writing",
      type: "website",
    },
  };
}

export default function WritingIndex() {
  const posts = getWriting();

  return (
    <main id="main">
      <section className="section shell">
        <p className="eyebrow">Notes on production systems</p>
        <h1 className="h1">Writing</h1>
        <p className="lead" style={{ marginBlockStart: "1.25rem" }}>
          Teardowns of systems I built, engineer to engineer. Each one leads with the problem, gives
          one concrete number, and names the cost as well as the win. Dated by when the work
          happened, newest first.
        </p>
      </section>

      <section className="shell section" style={{ paddingBlockStart: 0 }}>
        <ul className="post-list" role="list">
          {posts.map((p) => (
            <li key={p.meta.slug}>
              <Link href={`/writing/${p.meta.slug}`} className="post-row">
                {/* The system and the month it was built — what a reader
                    actually wants to know, and honest in a way a backdated
                    publish date would not be. The real publish date stays in
                    `datePublished` and the sitemap; it is not this. */}
                <span className="post-row__when mono">
                  <span className="post-row__system">{p.meta.system}</span>
                  <span className="post-row__worked">{monthLabel(p.meta.worked)}</span>
                </span>
                <Scramble as="span" className="post-row__title h3">{p.meta.title}</Scramble>
                <span className="post-row__summary">{p.meta.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
