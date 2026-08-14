import { CONTACT } from "@/lib/site";
import { getRecentActivity } from "@/lib/github";

/**
 * A strip of recent public GitHub activity.
 *
 * A server component, and deliberately not a client one: the timestamps are
 * relative, and a relative timestamp computed in the browser reads a different
 * clock than the render that produced the HTML. It also means the strip works
 * with JavaScript off, which is the whole reason it can be trusted to be here.
 *
 * When there is nothing to show — API down, rate limited, or genuinely no
 * activity — it renders `null`. Not a spinner, not "couldn't load activity",
 * not an empty box. A widget visibly failing on a page whose job is to get its
 * author hired is worse than a page that never mentions GitHub.
 */
export default async function GitHubActivity() {
  const events = await getRecentActivity();

  if (events.length === 0) return null;

  return (
    <section className="shell activity" aria-labelledby="activity-title">
      <h2 className="eyebrow activity__title" id="activity-title">
        Still shipping
      </h2>

      <ul className="activity__list" role="list">
        {events.map((event) => (
          <li key={event.id}>
            <a className="activity__row" href={event.url}>
              {/* Every repo here is his, so the owner segment is six identical
                  words of noise. The heading and the trailing link carry it. */}
              <span className="activity__repo mono">
                {event.repo.slice(event.repo.indexOf("/") + 1)}
              </span>
              <span className="activity__what">{event.description}</span>
              <time className="activity__when mono" dateTime={event.at}>
                {event.ago}
              </time>
            </a>
          </li>
        ))}
      </ul>

      <p className="activity__more">
        <a className="mono hero__link" href={CONTACT.github}>
          All activity on GitHub →
        </a>
      </p>
    </section>
  );
}
