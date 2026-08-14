import type { MetadataRoute } from "next";
import { getWork, getWriting } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/**
 * Generated from the content directory, never hand-maintained.
 *
 * A sitemap that lists routes by hand is a sitemap that silently stops
 * mentioning the newest case study — which is the one worth indexing. Adding an
 * MDX file adds a route here for free, the same way it adds a page.
 *
 * `lastModified` comes from each post's own `date`, not from build time. Stamping
 * every URL with "now" on every deploy tells a crawler that all thirty pages
 * changed when only one did, and crawlers learn to discount a site that cries
 * wolf.
 */
/**
 * `lastmod` is the only hint here Google says it uses — and only *"if it's
 * consistently and verifiably accurate"*. `priority` and `changeFrequency` are
 * ignored outright (Build a Sitemap, updated 2026-07-08); they are kept only
 * because Bing has historically made light use of them, and cost nothing.
 *
 * Two rules, both learned from getting this wrong:
 *
 *  - **Never emit a future date.** Every post previously carried its LinkedIn
 *    send date, which ran two months ahead, so all 16 URLs claimed to have been
 *    modified in the future. Google discards untrustworthy `lastmod` values and
 *    a future one qualifies — the whole file's credibility, not just that row.
 *  - **Never stamp build time.** Telling a crawler all 25 URLs changed on every
 *    deploy teaches it to ignore the signal.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const work = getWork();
  const writing = getWriting();

  // Clamp: content dates are authored by hand, so treat them as claims to be
  // checked rather than facts.
  const now = new Date();
  const noFuture = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.valueOf()) || d > now ? now : d;
  };

  // The freshest post stands in for the pages that list or link it — those
  // pages genuinely do change when it lands, and previously carried no
  // `lastmod` at all.
  const newestPost = writing.reduce<Date>(
    (acc, d) => (noFuture(d.meta.date) > acc ? noFuture(d.meta.date) : acc),
    new Date(0),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: newestPost, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/work`, lastModified: newestPost, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/resume`, lastModified: newestPost, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: newestPost, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/writing`, lastModified: newestPost, changeFrequency: "weekly", priority: 0.7 },
  ];

  return [
    ...staticRoutes,
    ...work.map((d) => ({
      url: `${SITE_URL}/work/${d.meta.slug}`,
      lastModified: newestPost,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...writing.map((d) => ({
      url: `${SITE_URL}/writing/${d.meta.slug}`,
      lastModified: noFuture(d.meta.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
