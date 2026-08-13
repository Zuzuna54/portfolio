import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="shell site-header__row">
          <a className="brand" href="/">
            Giorgobiani
          </a>
          <nav className="site-nav">
            <a href="/work">Work</a>
            <a href="/writing">Writing</a>
            <a href="/about">About</a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="section shell">
          <p className="eyebrow">Foundation check</p>
          <h1 className="display">
            Giorgi
            <br />
            Giorgobiani
          </h1>
          <p className="lead" style={{ marginBlockStart: "1.5rem" }}>
            I build the infrastructure agent systems run on — orchestration, retrieval,
            evaluation, and the cost and latency controls that decide whether a system
            survives contact with production.
          </p>

          <div className="metrics" style={{ marginBlockStart: "3rem", maxWidth: "52rem" }}>
            <div className="metric"><b>9</b><span>workers</span></div>
            <div className="metric"><b>7</b><span>queues + DLQs</span></div>
            <div className="metric"><b>3,072</b><span>dim pgvector</span></div>
            <div className="metric"><b>24</b><span>tools</span></div>
            <div className="metric"><b>~94%</b><span>cost cut</span></div>
          </div>
        </section>

        <hr className="rule rule--accent" />

        <section className="section invert-crimson">
          <div className="shell">
            <p className="eyebrow">Palette inversion</p>
            <h2 className="h1">Crimson section</h2>
            <p className="lead" style={{ marginBlockStart: "1rem" }}>
              Every colour is a custom property, so a section re-declares the whole palette
              and everything inside it follows — borders, links, diagrams.
            </p>
            <p style={{ marginBlockStart: "1rem" }}>
              <a href="#main">A link inside the inverted section</a>
            </p>
          </div>
        </section>

        <section className="section invert-gold">
          <div className="shell">
            <p className="eyebrow">Palette inversion</p>
            <h2 className="h1">Gold section</h2>
            <p className="lead" style={{ marginBlockStart: "1rem" }}>
              Gold carries interaction because it is the only accent that clears WCAG AA
              for body text on the dark ground.
            </p>
          </div>
        </section>

        <section className="section shell">
          <p className="eyebrow">Type scale</p>
          <div className="stack" style={{ marginBlockStart: "1.5rem" }}>
            <p className="display">Display</p>
            <p className="h1">Heading one</p>
            <p className="h2">Heading two</p>
            <p className="h3">Heading three</p>
            <p className="lead">Lead paragraph, set at the reading measure.</p>
            <p>Body copy at the default size and measure.</p>
            <p className="mono">MONO — the machine voice, same family, MONO axis at 1</p>
          </div>
        </section>
      </main>
    </>
  );
}
