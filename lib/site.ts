/**
 * Single source of truth for identity and contact details.
 *
 * These exist in one place because the last site drifted: its footer shipped
 * `href="#"` placeholders, and the live page linked a LinkedIn slug that 404s
 * (`gio-giorgobiani-…`) while the résumé printed a different one. The slug
 * below is the verified-live one.
 */
export const CONTACT = {
  name: "Giorgi Giorgobiani",
  title: "Senior AI Platform Engineer",
  email: "giorgigiorgobiani54@gmail.com",
  phone: "+1 323 977 9895",
  phoneHref: "tel:+13239779895",
  location: "New York, NY",
  remote: "Remote (US)",
  github: "https://github.com/Zuzuna54",
  // Verified 13 Aug 2026. The `gio-` variant returns "Profile Not Found".
  linkedin: "https://www.linkedin.com/in/giorgi-giorgobiani-282883153",
  siteRepo: "https://github.com/Zuzuna54/portfolio",
} as const;

/**
 * The canonical origin, no trailing slash.
 *
 * Everything that emits an absolute URL reads this — `metadataBase`, the
 * sitemap, robots, the JSON-LD graph, every per-page canonical. The site answers
 * on several `*.vercel.app` hostnames as well as the real domain, and a search
 * engine that indexes both treats them as duplicates and splits the ranking. One
 * constant means one answer to "where does this page actually live".
 */
export const SITE_URL = "https://giorgobiani.dev";

export const SUMMARY =
  "I build the infrastructure that agent systems run on — orchestration, retrieval, evaluation, and the cost and latency controls that decide whether a system survives contact with production.";
