import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getWriting, getWritingBySlug } from "@/lib/content";

export function generateStaticParams() {
  return getWriting().map((p) => ({ slug: p.meta.slug }));
}

export async function generateMetadata(
  { params }: PageProps<"/writing/[slug]">,
): Promise<Metadata> {
  const { slug } = await params;
  const doc = getWritingBySlug(slug);
  if (!doc) return {};
  return {
    title: doc.meta.title,
    description: doc.meta.summary,
    alternates: { canonical: `/writing/${slug}` },
    openGraph: {
      title: doc.meta.title,
      description: doc.meta.summary,
      type: "article",
      url: `/writing/${slug}`,
      publishedTime: doc.meta.date,
    },
  };
}

export default async function WritingDetail({ params }: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const doc = getWritingBySlug(slug);
  if (!doc) notFound();

  return (
    <main id="main">
      <article className="section shell--narrow shell">
        <p className="eyebrow">
          <time dateTime={doc.meta.date}>
            {new Date(doc.meta.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </p>
        <h1 className="h1" style={{ marginBlockStart: "0.75rem" }}>
          {doc.meta.title}
        </h1>
        <div className="prose" style={{ marginBlockStart: "2.5rem" }}>
          <MDXRemote source={doc.body} />
        </div>
        <hr className="rule" style={{ marginBlockStart: "3rem" }} />
        <p style={{ marginBlockStart: "2rem" }}>
          <Link href="/writing" className="mono">
            ← All writing
          </Link>
        </p>
      </article>
    </main>
  );
}
