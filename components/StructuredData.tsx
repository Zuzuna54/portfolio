import { CONTACT, SITE_URL, SUMMARY } from "@/lib/site";

/**
 * JSON-LD describing the person and the site.
 *
 * This is the piece that does the work for a name search. Title tags tell a
 * crawler what a page is *about*; `Person` with `sameAs` tells it who this is,
 * and links the site to the GitHub and LinkedIn profiles that already rank for
 * the same name. Without it the three properties compete as unrelated documents;
 * with it they corroborate each other as one entity.
 *
 * `@id` is a stable identifier the graph refers back to, so the `WebSite` and
 * the `Person` are explicitly the same subject rather than two coincidental
 * mentions.
 *
 * Rendered from a server component, so it is in the initial HTML — Googlebot
 * does execute JavaScript, but it queues render-dependent content for later and
 * there is no reason to be in that queue.
 *
 * Keep every claim here identical to what the pages say. Structured data that
 * disagrees with visible content is a manual-action risk, and it is also just
 * the same drift problem as the résumé PDF in a different costume.
 */
export default function StructuredData() {
  const personId = `${SITE_URL}/#person`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: CONTACT.name,
        url: SITE_URL,
        jobTitle: CONTACT.title,
        description: SUMMARY,
        email: `mailto:${CONTACT.email}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "New York",
          addressRegion: "NY",
          addressCountry: "US",
        },
        // The properties that already rank for this name. This is the link that
        // turns three separate results into one entity.
        sameAs: [CONTACT.github, CONTACT.linkedin],
        knowsAbout: [
          "AI platform engineering",
          "Agent orchestration",
          "Retrieval-augmented generation",
          "Multi-tenant infrastructure",
          "Rust",
          "TypeScript",
          "AWS",
        ],
        alumniOf: [
          { "@type": "EducationalOrganization", name: "App Academy" },
          { "@type": "CollegeOrUniversity", name: "SUNY Plattsburgh" },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: `${CONTACT.name} — ${CONTACT.title}`,
        description: SUMMARY,
        publisher: { "@id": personId },
        inLanguage: "en-US",
      },
      {
        // `/about`, not `/`. Google scopes ProfilePage to pages that focus on a
        // single person — an "about me" page, an author page, a forum profile.
        // The homepage is a portfolio landing page that leads with the work.
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/about#profilepage`,
        url: `${SITE_URL}/about`,
        about: { "@id": personId },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is data, not markup, and every value here is a
      // literal from lib/site.ts — no user input reaches this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
