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
export default function sitemap(): MetadataRoute.Sitemap {
  const work = getWork();
  const writing = getWriting();

  // The résumé and the case studies are what a name search should land on, so
  // they carry the highest priority after the home page.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/work`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/resume`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/writing`, changeFrequency: "weekly", priority: 0.7 },
  ];

  return [
    ...staticRoutes,
    ...work.map((d) => ({
      url: `${SITE_URL}/work/${d.meta.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...writing.map((d) => ({
      url: `${SITE_URL}/writing/${d.meta.slug}`,
      lastModified: new Date(d.meta.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
