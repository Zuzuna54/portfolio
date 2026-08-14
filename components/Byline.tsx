import { CONTACT } from "@/lib/site";

/**
 * Who wrote this, and when.
 *
 * Sixteen technical essays and four case studies shipped without one. Two
 * reasons that matters, and neither is decoration:
 *
 * 1. Google's helpful-content guidance asks directly whether it is
 *    *"self-evident to your visitors who authored your content"*. On a
 *    personal-brand site whose entire purpose is attribution, twenty documents
 *    that never say who wrote them is a strange gap.
 * 2. It is a hard prerequisite for the `author` property in the page's
 *    JSON-LD. Google's structured-data policy is explicit: **"Don't mark up
 *    content that is not visible to readers of the page."** Adding
 *    `BlogPosting.author` without this would be a policy violation, not a
 *    shortcut.
 *
 * `rel="author"` plus a link to the homepage ties the byline to the `Person`
 * node the JSON-LD declares at `#person`, so the visible text and the markup
 * point at the same entity rather than merely agreeing by coincidence.
 */
export default function Byline({
  date,
  className,
}: {
  /** ISO date. Rendered in a `<time>` so it is machine-readable too. */
  date?: string;
  className?: string;
}) {
  return (
    <p className={`byline mono${className ? ` ${className}` : ""}`}>
      <span className="byline__by">By </span>
      <a href="/" rel="author" className="byline__name">
        {CONTACT.name}
      </a>
      {date && (
        <>
          <span aria-hidden="true"> · </span>
          <time dateTime={date}>
            {new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </>
      )}
    </p>
  );
}
