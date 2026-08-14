#!/usr/bin/env node
/**
 * Tell Bing the URL list changed.
 *
 *   INDEXNOW_KEY=<key> node scripts/indexnow.mjs
 *
 * Google does not support IndexNow — it evaluated the protocol and never
 * adopted it, so this does nothing for Google Search. It is here because **Bing
 * does**, and Bing is the index ChatGPT Search runs on. One submission reaches
 * Bing, Yahoo (Bing-served), DuckDuckGo, Yandex and Seznam.
 *
 * No-ops without a key rather than failing, so a clean checkout still builds.
 * Never throws: a search-engine ping is not a reason for a deploy to fail.
 *
 * Setup, one time:
 *   1. Generate a key at https://www.bing.com/indexnow/getstarted
 *   2. Save it as `public/<key>.txt` containing exactly the key
 *   3. Set INDEXNOW_KEY in the environment
 */

const KEY = process.env.INDEXNOW_KEY;
const HOST = "giorgobiani.dev";

if (!KEY) {
  console.log("indexnow: no INDEXNOW_KEY set, skipping");
  process.exit(0);
}

// Read the URL list from the sitemap we just built rather than keeping a second
// list here — one source of truth, and it cannot drift as content is added.
const res = await fetch(`https://${HOST}/sitemap.xml`).catch(() => null);
if (!res?.ok) {
  console.log("indexnow: could not fetch sitemap, skipping");
  process.exit(0);
}

const xml = await res.text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (!urlList.length) {
  console.log("indexnow: sitemap had no URLs, skipping");
  process.exit(0);
}

// The endpoint caps a submission at 10,000 URLs. This site has ~25.
const body = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList };

try {
  const post = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  // 200 = accepted, 202 = accepted pending key validation. Both are fine.
  console.log(`indexnow: submitted ${urlList.length} URLs → ${post.status}`);
} catch (err) {
  console.log(`indexnow: submission failed, ignoring — ${err instanceof Error ? err.message : err}`);
}
