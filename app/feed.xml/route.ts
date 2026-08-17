import { getWriting } from "@/lib/content";
import { CONTACT, SITE_URL, SUMMARY } from "@/lib/site";

/**
 * Atom feed for the writing section.
 *
 * The usual argument for a feed in 2026 — "AI agents read RSS" — is unevidenced.
 * The real reason is narrower and documented: Google formally accepts RSS and
 * Atom **as a sitemap format**, so this is a second discovery channel that can
 * be submitted to Search Console independently of `sitemap.xml`. Aggregators
 * (Feedly, dev.to importers, newsletter tools) are a free extra.
 *
 * Atom rather than RSS 2.0 because it requires an explicit `updated` timestamp
 * and a stable `id` per entry, which is exactly the discipline that went wrong
 * in the sitemap when post dates ran into the future.
 *
 * Static: there is no request-time data here, so it prerenders with everything
 * else rather than running on every fetch.
 */
export const dynamic = "force-static";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function GET() {
  const posts = getWriting();

  // Never emit a future timestamp — same rule as the sitemap, same reason.
  const now = new Date();
  const stamp = (iso: string) => {
    const d = new Date(iso);
    return (Number.isNaN(d.valueOf()) || d > now ? now : d).toISOString();
  };

  const updated = posts.length
    ? posts.map((p) => stamp(p.meta.date)).sort().at(-1)!
    : now.toISOString();

  // `getWriting()` already returns newest work first, which is what aggregators
  // expect. It used to sort ascending by series number, so the feed arrived
  // oldest-first with non-monotonic timestamps — readers show that as a jumble.
  const entries = posts
    .map((p) => {
      const url = `${SITE_URL}/writing/${p.meta.slug}`;
      return `  <entry>
    <title>${esc(p.meta.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${stamp(p.meta.date)}</updated>
    <summary>${esc(p.meta.summary)}</summary>
    <author><name>${esc(CONTACT.name)}</name></author>
  </entry>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(CONTACT.name)} — Writing</title>
  <subtitle>${esc(SUMMARY)}</subtitle>
  <link href="${SITE_URL}/feed.xml" rel="self"/>
  <link href="${SITE_URL}/writing"/>
  <id>${SITE_URL}/</id>
  <updated>${updated}</updated>
  <author><name>${esc(CONTACT.name)}</name><uri>${SITE_URL}</uri></author>
${entries}
</feed>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
