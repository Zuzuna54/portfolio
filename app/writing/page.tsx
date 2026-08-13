import type { Metadata } from "next";
import Link from "next/link";
import { getWriting } from "@/lib/content";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Sixteen production teardowns — engineer to engineer. One problem, one number, under two hundred words.",
};

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
            const upcoming = p.meta.date > today;
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
                  <span className="post-row__title h3">{p.meta.title}</span>
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
