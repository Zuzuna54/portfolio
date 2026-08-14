import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import ArchDiagram from "@/components/diagrams/ArchDiagram";
import { getWork, getWorkBySlug } from "@/lib/content";

export function generateStaticParams() {
  return getWork().map((d) => ({ slug: d.meta.slug }));
}

export async function generateMetadata(
  { params }: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await params;
  const doc = getWorkBySlug(slug);
  if (!doc) return {};
  return {
    title: doc.meta.title,
    description: doc.meta.problem,
    alternates: { canonical: `/work/${slug}` },
    openGraph: {
      title: doc.meta.title,
      description: doc.meta.problem,
      type: "article",
      url: `/work/${slug}`,
    },
  };
}

export default async function WorkDetail({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const doc = getWorkBySlug(slug);
  if (!doc) notFound();

  return (
    <main id="main">
      <article>
        <header className="section shell">
          <p className="eyebrow">
            {doc.meta.role} · {doc.meta.period}
          </p>
          <h1 className="h1" style={{ marginBlockStart: "0.75rem" }}>
            {doc.meta.title}
          </h1>
          <p className="lead" style={{ marginBlockStart: "1.25rem" }}>
            {doc.meta.kicker}
          </p>

          <div className="metrics" style={{ marginBlockStart: "2.5rem" }}>
            {doc.meta.metrics.map((m) => (
              <div className="metric" key={m.label}>
                <b>{m.value}</b>
                <span>{m.label}</span>
              </div>
            ))}
          </div>

          {doc.meta.encumbered && (
            <p className="note mono">
              Built for an employer, described with their approval. The product, its clients
              and its internals stay unnamed — the architecture carries the signal, those
              names don&rsquo;t.
            </p>
          )}
        </header>

        <div className="shell">
          <ArchDiagram slug={slug} />
        </div>

        <div className="shell split">
          <aside className="split__aside">
            <p className="eyebrow">Stack</p>
            <ul className="stack-list mono" role="list">
              {doc.meta.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </aside>
          <div className="prose">
            <MDXRemote source={doc.body} />
          </div>
        </div>

        <div className="section shell">
          <hr className="rule" />
          <p style={{ marginBlockStart: "2rem" }}>
            <Link href="/work" className="mono">
              ← All work
            </Link>
          </p>
        </div>
      </article>
    </main>
  );
}
