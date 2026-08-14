import { CONTACT } from "@/lib/site";

// The previous portfolio shipped with href="#" on both social links. Every
// destination here is a real URL and the build has a test that asserts it.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <hr className="rule rule--strong" />
        <div className="site-footer__row">
          <div>
            <p className="h3">Open to Senior AI Platform &amp; AI Infrastructure roles</p>
            <p className="mono site-footer__loc">
              {CONTACT.location} · {CONTACT.remote}
            </p>
          </div>
          <nav className="site-footer__links" aria-label="Contact">
            {/* `rel="me"` asserts these point at the same person as this page.
                GitHub already emits `rel="me"` back on its profile website
                field, so the claim is reciprocal — that pairing is what
                IndieAuth and Mastodon verification are built on, and it is the
                same identity assertion the JSON-LD makes via `sameAs`. */}
            <a href={CONTACT.github} rel="me">GitHub</a>
            <a href={CONTACT.linkedin} rel="me">LinkedIn</a>
            <a href={`mailto:${CONTACT.email}`}>Email</a>
            <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
            <a href="/resume.pdf">Résumé PDF</a>
          </nav>
        </div>
        <p className="site-footer__fine mono">
          Built with Next.js, GSAP and Three.js. Source on{" "}
          <a href={CONTACT.siteRepo}>GitHub</a>.
        </p>
      </div>
    </footer>
  );
}
