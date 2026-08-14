import type { Metadata } from "next";
import Link from "next/link";
import { getWriting } from "@/lib/content";
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
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main id="main">
      <section className="section shell">
        <p className="eyebrow">Notes on production systems</p>
        <h1 className="h1">Writing</h1>
        <p className="lead" style={{ marginBlockStart: "1.25rem" }}>
          A numbered series of teardowns, engineer to engineer. Lead with the problem, one concrete
          number, name the cost as well as the win. All {posts.length} are written and readable
          here; the dates are when each goes out on LinkedIn.
        </p>
      </section>

      <section className="shell section" style={{ paddingBlockStart: 0 }}>
        <ul className="post-list" role="list">
          {posts.map((p) => {
            // "Scheduled" now means *not yet posted to LinkedIn*, not
            // "not yet published here" — every post has been readable since it
            // was written. `date` is the real publish date; `shareOn` is the
            // editorial queue.
            const upcoming = !!p.meta.shareOn && p.meta.shareOn > today;
            return (
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
                    {upcoming && <span className="post-row__pill">scheduled</span>}
                  </span>
                  <Scramble as="span" className="post-row__title h3">{p.meta.title}</Scramble>
                  <span className="post-row__summary">{p.meta.summary}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
