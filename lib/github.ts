/**
 * Live public GitHub activity.
 *
 * Two constraints shape everything below.
 *
 * **There is no token.** Anonymous GitHub allows 60 requests/hour *per IP*, and
 * a build that prerenders 27 routes can burn that on its own before a single
 * reader arrives. So there is exactly one request, cached for an hour, shared
 * by every route that renders the strip.
 *
 * **A broken widget on a job-search site is worse than no widget.** Every
 * failure mode — DNS, rate limit, 404, 5xx, a body that isn't the JSON we
 * expect, a socket that never answers — returns the same empty array. Nothing
 * in this file throws, so nothing in this file can fail a build or half-render
 * a page. The cost of that guarantee is that a genuine outage is indistinguish-
 * able from "he hasn't pushed anything", and it is paid deliberately: the
 * component renders nothing either way.
 */

const USER = "Zuzuna54";

// `per_page` is generous because the list is filtered hard afterwards — noise
// events, other people's repos and repeated pushes all come out. The 26 events
// GitHub returned on 14 Aug reduced to 6 rows. Asking for more costs nothing:
// it is the same one request either way.
const ENDPOINT = `https://api.github.com/users/${USER}/events/public?per_page=60`;

// Long enough for a cold TLS handshake on a slow builder, short enough that a
// wedged API cannot hold a prerender open. If it expires, the page ships
// without the strip.
const TIMEOUT_MS = 4000;

const MAX_ITEMS = 6;

/** The event kinds worth a line. Everything else — stars, forks, comments,
 *  issue traffic — is reaction rather than work, and is dropped. */
export type ActivityKind = "push" | "branch" | "tag" | "repo" | "pull-request" | "release";

export type Activity = {
  /** GitHub's own event id. Stable, so it works as a React key. */
  id: string;
  kind: ActivityKind;
  /** `owner/name`, canonical. */
  repo: string;
  /** One factual line — "Pushed to main", "Merged #12 — …". */
  description: string;
  /** ISO 8601 straight from the API. Feeds `<time dateTime>`. */
  at: string;
  /**
   * "3 days ago", resolved on the server. Formatting this in a client
   * component would read a different `Date.now()` than the render that
   * produced the HTML, which is a hydration mismatch by construction.
   */
  ago: string;
  /** Always a real github.com URL. */
  url: string;
};

/** Pre-collapse working shape. `group` exists only so repeated pushes to one
 *  branch can be folded into a single line; it never escapes this module. */
type Draft = Omit<Activity, "ago"> & { group: string };

/**
 * Recent public activity, newest first, at most {@link MAX_ITEMS}.
 * Returns `[]` on every failure. Never throws.
 */
export async function getRecentActivity(): Promise<Activity[]> {
  const raw = await fetchEvents();
  if (!raw) return [];

  try {
    const drafts: Draft[] = [];
    for (const event of raw) {
      const draft = toDraft(event);
      if (draft) drafts.push(draft);
    }

    // The API returns newest-first, but collapsing keeps the first of each
    // group and therefore depends on it. Make it true rather than trust it —
    // sorting 30 items is not an economy worth making.
    drafts.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    // One `now` for the whole list: two items an hour apart should not be able
    // to disagree about what "now" was.
    const now = Date.now();

    // Rebuilt field by field rather than spread: `group` is scaffolding and
    // must not leak into the public shape.
    return collapse(drafts)
      .slice(0, MAX_ITEMS)
      .map((draft) => ({
        id: draft.id,
        kind: draft.kind,
        repo: draft.repo,
        description: draft.description,
        at: draft.at,
        ago: ago(draft.at, now),
        url: draft.url,
      }));
  } catch {
    // Nothing above should throw — but "should" is not a guarantee, and the
    // guarantee is the point of the module.
    return [];
  }
}

async function fetchEvents(): Promise<unknown[] | null> {
  try {
    const res = await fetch(ENDPOINT, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        // GitHub rejects requests that don't identify themselves.
        "User-Agent": "giorgobiani.dev (+https://github.com/Zuzuna54)",
      },
      // The whole rate-limit budget, spent once an hour. Next dedupes this
      // across every route in a build, so 27 prerenders cost one request.
      next: { revalidate: 3600 },
      // Next drops the signal on background revalidation and honours it on the
      // blocking path, which is exactly the behaviour we want: a reader never
      // waits on a hung socket, and a refresh never aborts itself.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // 403 is the rate limit, 404 a renamed account, 5xx GitHub itself. Same
    // answer to all of them.
    if (!res.ok) return null;

    const body: unknown = await res.json();
    return Array.isArray(body) ? body : null;
  } catch {
    // Network failure, DNS failure, abort, or a body that isn't JSON. Also
    // covers a runtime without `AbortSignal.timeout`, which throws on access.
    return null;
  }
}

// --------------------------------------------------------------- normalising
//
// The API's payload shape differs per event type and is not ours to depend on,
// so everything below reads `unknown` through total accessors — a missing or
// wrong-typed field degrades to an empty value, and one guard at the end drops
// anything that lost something it needed.

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** An `href` is the one place a malformed payload reaches the reader, so a URL
 *  is used only if it is unmistakably GitHub's. */
function githubUrl(value: unknown, fallback: string): string {
  const url = text(value);
  return url.startsWith("https://github.com/") ? url : fallback;
}

/** `refs/heads/main` → `main`. Tags arrive bare already. */
function branchName(ref: string): string {
  return ref.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : ref;
}

/** A git ref can contain slashes; each segment is escaped, the separators are
 *  not, so `feat/thing` stays a path rather than becoming one component. */
function refPath(ref: string): string {
  return ref.split("/").map(encodeURIComponent).join("/");
}

function toDraft(raw: unknown): Draft | null {
  const event = record(raw);
  const id = text(event.id);
  const at = text(event.created_at);
  const repo = text(record(event.repo).name);
  const payload = record(event.payload);

  // Only repos he owns. A drive-by contribution to someone else's project is
  // somebody else's story, and `owner/name` makes ownership free to check.
  if (!id || !repo.startsWith(`${USER}/`)) return null;
  if (!at || Number.isNaN(Date.parse(at))) return null;

  const home = `https://github.com/${repo}`;
  // The default group is the event's own id, so nothing merges by accident —
  // only PushEvent overrides it.
  const base = { id, repo, at, group: id };

  switch (text(event.type)) {
    case "PushEvent": {
      const ref = branchName(text(payload.ref));
      const head = text(payload.head);
      // No commit count, deliberately. The documented PushEvent payload carries
      // `size` and `distinct_size`, and the live public feed does not — checked
      // against 15 real push events on 14 Aug 2026, every one of which had a
      // payload of exactly {repository_id, push_id, ref, head, before}. Reading
      // a count from it produced `undefined`, so an earlier version of this
      // function dropped every push as "0 commits" and the strip rendered as
      // six rows of branch-creation noise instead. Saying less is the fix; a
      // count would need a second request per push and there is no budget.
      return {
        ...base,
        kind: "push",
        // Repeated pushes to one branch fold into one line; see `collapse`.
        group: `push:${repo}:${ref}`,
        description: ref ? `Pushed to ${ref}` : "Pushed",
        url: head ? `${home}/commit/${encodeURIComponent(head)}` : home,
      };
    }

    case "CreateEvent": {
      const ref = text(payload.ref);
      const kind = text(payload.ref_type);
      if (kind === "repository") {
        return { ...base, kind: "repo", description: "Started the repository", url: home };
      }
      if (!ref) return null;
      // `/tree/` rather than `/releases/tag/`: a tag with no release attached
      // 404s on the releases path, and this site does not ship dead links.
      if (kind === "tag") {
        return { ...base, kind: "tag", description: `Tagged ${ref}`, url: `${home}/tree/${refPath(ref)}` };
      }
      if (kind === "branch") {
        // Creating the default branch is what an initial push looks like from
        // the outside — GitHub emits it alongside the PushEvent, for every new
        // repo. It is an artefact of starting, not a decision, and six of them
        // in a row is what this strip looked like before the filter.
        if (ref === text(payload.master_branch)) return null;
        return { ...base, kind: "branch", description: `Opened branch ${ref}`, url: `${home}/tree/${refPath(ref)}` };
      }
      return null;
    }

    case "PullRequestEvent": {
      const pr = record(payload.pull_request);
      const number = count(pr.number) || count(payload.number);
      if (!number) return null;
      const action = text(payload.action);
      // `labeled`, `synchronize`, `review_requested` and friends are bookkeeping
      // — they say a PR exists, which the open/merge lines already said.
      const verb =
        action === "opened" ? "Opened"
          : action === "reopened" ? "Reopened"
            : action === "closed" ? (pr.merged === true ? "Merged" : "Closed")
              : "";
      if (!verb) return null;
      const title = text(pr.title);
      return {
        ...base,
        kind: "pull-request",
        description: title ? `${verb} #${number} — ${title}` : `${verb} pull request #${number}`,
        url: githubUrl(pr.html_url, `${home}/pull/${number}`),
      };
    }

    case "ReleaseEvent": {
      if (text(payload.action) !== "published") return null;
      const release = record(payload.release);
      const name = text(release.tag_name) || text(release.name);
      return {
        ...base,
        kind: "release",
        description: name ? `Released ${name}` : "Published a release",
        url: githubUrl(release.html_url, `${home}/releases`),
      };
    }

    // WatchEvent (starring), ForkEvent, IssueCommentEvent, DeleteEvent, …
    default:
      return null;
  }
}

/**
 * One line per branch pushed to, keeping the most recent.
 *
 * Without it the whole strip is one afternoon's work on one repo: the live feed
 * on 14 Aug held seven separate pushes to `portfolio/main` in the six newest
 * events, which would have rendered as six identical rows teaching the reader
 * one fact. Grouping is global rather than run-length because the runs are
 * interleaved — a push to a second repo in the middle of an afternoon would
 * otherwise split one repo into two rows.
 *
 * The cost: the surviving row is dated at the newest push, so "pushed to main,
 * an hour ago" can stand for a whole day of them. It reads as a summary, which
 * is what it is. Non-push events carry their own event id as a group and so
 * never merge — "opened #12" and "merged #12" are two different facts.
 */
function collapse(drafts: Draft[]): Draft[] {
  const seen = new Set<string>();
  return drafts.filter((draft) => {
    if (seen.has(draft.group)) return false;
    seen.add(draft.group);
    return true;
  });
}

// ------------------------------------------------------------ relative time

let relative: Intl.RelativeTimeFormat | undefined;

/** Lazy, and reached only from inside the caller's try: constructing an Intl
 *  formatter at module scope would be one more way for this file to break a
 *  build, which is the one thing it must not do. */
function formatter(): Intl.RelativeTimeFormat {
  if (!relative) relative = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  return relative;
}

// Each entry is a unit and how many of it make up the next one. 4.348 weeks
// per month is the average, which is the right kind of wrong for a label that
// already says "about".
const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.348],
  ["month", 12],
  ["year", Infinity],
];

function ago(iso: string, now: number): string {
  // Clamped: a few seconds of clock skew between GitHub and the builder should
  // not render "in 4 seconds".
  const seconds = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (seconds < 45) return "just now";

  let value = seconds;
  for (const [unit, per] of UNITS) {
    if (value < per) return formatter().format(-Math.round(value), unit);
    value /= per;
  }
  return formatter().format(-Math.round(value), "year");
}
