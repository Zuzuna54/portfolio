import { CONTACT, SITE_URL } from "@/lib/site";

/**
 * `BlogPosting` / `TechArticle` + `BreadcrumbList` for a detail page.
 *
 * Scope note, because it is easy to over-invest here: a controlled study of
 * 1,885 pages that added JSON-LD found **no meaningful change in AI citation
 * rates** (−4.6% in AI Overviews, +2.4% AI Mode, +2.2% ChatGPT — all noise),
 * and Google states outright that structured data *"isn't required for
 * generative AI search"*. So this is not here to win AI citations.
 *
 * It is here for two things that are documented:
 *
 * - **`author` → the Person `@id`.** This attaches twenty technical documents
 *   to the same entity the homepage declares, which is the one thing that
 *   actually helps a contested name query. The visible `<Byline>` is a
 *   prerequisite — marking up an author who does not appear on the page
 *   violates Google's structured-data policy.
 * - **`BreadcrumbList`.** One of the few types still producing a live rich
 *   result, with its own Search Console report.
 *
 * Deliberately absent: `FAQPage` (rich result removed May 2026), `HowTo`
 * (deprecated 2023), `ItemList`/Carousel (only Course, Movie, Recipe and
 * Restaurant are eligible), and `WebSite` + `SearchAction` (removed Nov 2024).
 */
export default function ArticleSchema({
  type,
  slug,
  section,
  sectionName,
  headline,
  description,
  datePublished,
}: {
  type: "BlogPosting" | "TechArticle";
  slug: string;
  /** URL segment of the parent index, e.g. `writing`. */
  section: string;
  /** Human name of that index, e.g. `Writing`. */
  sectionName: string;
  headline: string;
  description: string;
  /** ISO date. Must not be in the future — see lib/content.ts. */
  datePublished?: string;
}) {
  const url = `${SITE_URL}/${section}/${slug}`;
  const personId = `${SITE_URL}/#person`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": type,
      "@id": `${url}#article`,
      headline,
      description,
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      // Both the author and the publisher are the same person. Referencing the
      // node by @id rather than restating it keeps one description of him in
      // the graph instead of twenty that can drift.
      author: { "@id": personId },
      publisher: { "@id": personId },
      inLanguage: "en-US",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      ...(datePublished ? { datePublished, dateModified: datePublished } : {}),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: CONTACT.name, item: SITE_URL },
        { "@type": "ListItem", position: 2, name: sectionName, item: `${SITE_URL}/${section}` },
        { "@type": "ListItem", position: 3, name: headline, item: url },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Literals and content frontmatter only; no user input reaches this.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
