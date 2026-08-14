import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Open to everything, and pointing at the sitemap and the feed.
 *
 * Both references earn their keep: Google formally accepts an RSS/Atom feed as
 * a sitemap format, so listing it gives a second, independent discovery
 * channel — and this is how Bing finds the URL list without being told through
 * its console. Yahoo results are served by Bing, and ChatGPT Search runs
 * primarily on Bing's index, so those two lines reach further than they look.
 *
 * **Nothing is disallowed, deliberately.** An earlier version blocked the
 * generated OG image routes to keep the cards out of image search. That was a
 * mistake twice over: social crawlers ignore robots.txt so it never affected
 * the cards, and a disallowed URL's indexing rules are *never read* — so it
 * also left the site with no crawlable 1200×630 image at all, forfeiting image
 * results and any image-bearing rich result. Those routes now carry
 * `X-Robots-Tag: noindex` from `next.config.ts` instead, which Google can only
 * obey if it is allowed to fetch them.
 *
 * No AI-crawler blocks either: GPTBot, OAI-SearchBot, ClaudeBot and
 * PerplexityBot are all permitted on purpose. Blocking them would forfeit
 * exactly the surfaces this site wants to appear in.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/feed.xml`],
    host: SITE_URL,
  };
}
