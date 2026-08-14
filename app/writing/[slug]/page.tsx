import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import Byline from "@/components/Byline";
import ArticleSchema from "@/components/ArticleSchema";
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

  // Neighbours in the series. `getWriting()` is already sorted, so this is
  // reading order rather than an arbitrary "related posts" guess.
  const all = getWriting();
  const i = all.findIndex((d) => d.meta.slug === slug);
  const prev = i > 0 ? all[i - 1] : undefined;
  const next = i >= 0 && i < all.length - 1 ? all[i + 1] : undefined;

  return (
    <main id="main">
      <ArticleSchema
        type="BlogPosting"
        slug={slug}
        section="writing"
        sectionName="Writing"
        headline={doc.meta.title}
        description={doc.meta.summary}
        datePublished={doc.meta.date}
      />
      <article className="section shell--narrow shell">
        <p className="eyebrow">Note {String(doc.meta.n).padStart(2, "0")}</p>
        <h1 className="h1" style={{ marginBlockStart: "0.75rem" }}>
          {doc.meta.title}
        </h1>
        {/* Visible byline — and the precondition for the `author` property in
            the schema above. */}
        <Byline date={doc.meta.date} />
        <div className="prose" style={{ marginBlockStart: "2.5rem" }}>
          <MDXRemote source={doc.body} />
        </div>
        <hr className="rule" style={{ marginBlockStart: "3rem" }} />

        {/* Lateral links. Sixteen posts previously dead-ended on a single
            "← All writing", which is both a crawl cul-de-sac and exactly the
            non-descriptive anchor text Google's crawlable-links guidance warns
            about. Prev/next uses the *post's own title* as the anchor, so the
            link says what it points at. */}
        <nav className="post-nav" aria-label="More writing">
          {prev && (
            <Link href={`/writing/${prev.meta.slug}`} className="post-nav__link">
              <span className="post-nav__dir mono">Previous</span>
              <span className="post-nav__title">{prev.meta.title}</span>
            </Link>
          )}
          {next && (
            <Link
              href={`/writing/${next.meta.slug}`}
              className="post-nav__link post-nav__link--next"
            >
              <span className="post-nav__dir mono">Next</span>
              <span className="post-nav__title">{next.meta.title}</span>
            </Link>
          )}
        </nav>

        <p style={{ marginBlockStart: "2rem" }}>
          <Link href="/writing" className="mono">
            ← All {all.length} teardowns
          </Link>
        </p>
      </article>
    </main>
  );
}
