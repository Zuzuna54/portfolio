import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Open to everything, and pointing at the sitemap.
 *
 * The sitemap reference is the part that earns its keep: it is how Bing and
 * Yandex find the URL list without being told through their consoles, and Yahoo
 * results are served by Bing, so one line covers both.
 *
 * The OG image routes are excluded from crawling — they are 1200x630 PNGs meant
 * for link unfurls, and letting them into image search puts a card that repeats
 * the page title above the actual page in results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/opengraph-image", "/*/opengraph-image", "/apple-icon"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
