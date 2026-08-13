import type { Metadata } from "next";
import Link from "next/link";
import { getWriting } from "@/lib/content";

export const metadata: Metadata = {
  title: "Writing",
  description: "Production teardowns — engineer to engineer. One problem, one number, one diagram.",
};

export default function WritingIndex() {
  const posts = getWriting();
  return (
    <main id="main">
      <section className="section shell">
        <p className="eyebrow">Notes</p>
        <h1 className="h1">Writing</h1>
        <p className="lead" style={{ marginBlockStart: "1.25rem" }}>
          Production teardowns, engineer to engineer. Lead with the problem, one concrete number,
          under two hundred words.
        </p>
      </section>
      <section className="shell section" style={{ paddingBlockStart: 0 }}>
        <ul className="post-list" role="list">
          {posts.map((p) => (
            <li key={p.meta.slug}>
              <Link href={`/writing/${p.meta.slug}`} className="post-row">
                <time className="mono post-row__date" dateTime={p.meta.date}>
                  {new Date(p.meta.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <span className="post-row__title h3">{p.meta.title}</span>
                <span className="post-row__summary">{p.meta.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
