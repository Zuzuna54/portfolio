# giorgobiani.dev

Personal site — case studies, a numbered writing series, an about page and a
résumé, sitting on a single WebGPU canvas that persists across every route.

Live at [giorgobiani.dev](https://giorgobiani.dev). Public because the site is
itself a work sample: the interesting part is how the motion, the GPU layer and
the content pipeline hold together, not how it looks in a screenshot.

## Stack

Eleven runtime dependencies, in full — nine that build the site, plus two that
only report on it once it is deployed:

| Package | Role |
|---|---|
| `next` 16.3.0 | App Router. Every page is a server component; the client boundary starts at the motion provider. |
| `react` 19.2.8 | |
| `react-dom` 19.2.8 | |
| `three` 0.185 | Driven imperatively through `three/webgpu` + TSL node materials. |
| `gsap` 3.15 | ScrollTrigger, DrawSVG, ScrambleText, SplitText. Every animation on the site. |
| `lenis` 1.3 | Smooth scroll, bridged into ScrollTrigger so there is one clock, not two. |
| `next-mdx-remote` 6 | MDX for case studies and posts, rendered in RSC. |
| `gray-matter` 4 | Frontmatter parsing for the content directory. |
| `sass-embedded` 1.102 | Pinned explicitly in `next.config.ts` — `sass` is present transitively, and whichever resolves first otherwise wins silently. |
| `@vercel/analytics` 2 | Page-view telemetry, mounted in the root layout. |
| `@vercel/speed-insights` 2 | Field performance data, same place. |

No animation library beyond GSAP, no UI kit, no CSS framework, no state manager.

TypeScript throughout. Turbopack is Next 16's default dev bundler and the scripts
pass no bundler flags. SCSS uses `@use` / `@forward` only: `styles/_index.scss` is
the authoring API — functions, mixins and token maps, emitting no CSS — and
`styles/main.scss` is the only file that emits.

Colours are authored in OKLCH with hex fallbacks on the preceding line, so
browsers that don't understand OKLCH keep the hex and the rest overwrite it — no
`@supports` needed, just the cascade. Roles are assigned by measured contrast
rather than preference: gold is the only accent that clears AA for body text on
the near-black ground, so it carries links and interactive state; crimson and
violet fail AA at body size and are restricted to large type, fills and
inverted sections. Type is Recursive via `next/font/google`, one variable family
with its `CASL`, `MONO` and `slnt` axes loaded, so the reading voice and the
terminal voice are the same typeface at different axis positions.

## What's here

**A canvas that survives navigation.** One `WebGPURenderer`, mounted once in the
root layout and never unmounted, so the GPU context is never lost on a route
change. Routes only change which scene it holds, and both scenes stay alive
through a cross-fade, so navigation reads as the field re-forming. WebGPU when an
adapter can actually be acquired, WebGL2 through the same renderer's `forceWebGL`
backend otherwise — one shader source, both paths — and `?gl=webgl2` / `?gl=webgpu`
forces either one for verification.

**A lit mechanical keyboard on the home page.** 75 instanced chiclet caps in six
staggered rows, backlight escaping around the rim of every cap, glowing legends
from a texture atlas, and a single orbiting beacon light casting hard-edged
shadows. Presses are a pure function of scroll position, so scrolling back
un-presses exactly and there is no state to desync on a route change.

**Five constellation-network route scenes.** One system in `scenes/substrate.ts`
— bright nodes, k-nearest links that fade by current length — instantiated with
a different seed and field volume per route. Node positions live on the CPU,
because you cannot draw a line between two points that only exist in a shader.
These take no scroll input at all; they breathe and answer the pointer. Scroll
drives the keyboard and nothing else.

**Adaptive fidelity.** A starting tier (high / mid / low / off) is guessed from
device memory, core count and pointer type, then corrected by an FPS watchdog
that steps quality down after two consecutive bad seconds. The watchdog never
samples in a hidden tab, only ever steps down, and floors at `low` — "off" means
no WebGL2 or reduced motion, never a transient frame-rate dip. GPU device loss is
recovered from, bounded to two attempts.

**Four case studies, 20 architecture diagrams.** Five per study, hand-authored as
data in `components/diagrams/specs.ts` and rendered as inline SVG with `<title>`
and `<desc>`. Nodes fade in, edges draw stroke-by-stroke, and a pulse travels the
path the real work takes — scrubbed, so scrolling back un-draws it. SVG rather
than canvas because a picture whose whole job is explaining a system has to
print, survive a failed script, and be legible to a screen reader.

**Sixteen writing posts**, a numbered series in ascending order rather than a
reverse-chronological feed. Counts on the home page, the work index and the
sitemap are all derived from the content directory, never written down — adding
an MDX file cannot leave a stale claim behind.

**An interactive terminal.** Backtick opens it, and never when focus is in a
field. `help`, `whoami`, `ls`, `open <page>`, `contact`, `clear`, with arrow-key
history. Escape closes it from anywhere, and a visible corner badge makes it
reachable on touch, where there is no backtick key. The Konami sequence has an
answer. It owns the site's only global keydown listener, so nothing competes for
those keys.

**Live GitHub activity** on the about page, from a single anonymous request
cached for an hour and shared by every route in the build. Repeated pushes
collapse per branch; stars, forks and issue traffic are dropped. Every failure
mode — rate limit, 404, 5xx, timeout, a body that isn't the JSON expected —
returns the same empty array, and the strip renders nothing at all. It cannot
fail a build and it cannot half-render.

**Per-route OG cards** generated with `next/og` for `/`, `/work`, `/work/[slug]`,
`/writing`, `/writing/[slug]`, `/about` and `/resume`. Sitemap, robots,
canonicals, the Atom feed at `/feed.xml` and the JSON-LD graph all read one
origin constant, so nothing can disagree about which hostname is real. The
sitemap and the feed are both generated from the content directory.

**A résumé PDF built from the site's own `/resume` page.** `npm run resume:pdf`
builds, serves the production output and prints it through headless Chrome; the
`@media print` rules in `styles/_print.scss` *are* the PDF's typography. The
résumé data lives in exactly one file, so there is no second copy to drift.

## Decisions worth knowing

- **Imperative three.js, not React Three Fiber.** R3F 9.7.0 has no WebGPU support
  and v10 exists only as a canary; its async `gl` path silently never finishes
  initialising — correct DOM, no error logged, nothing drawn. For a background
  layer with no interactive 3D objects, R3F was reconciling a tree that changes
  once per route anyway.
- **The canvas mounts once and never unmounts.** Unmounting a canvas *forces*
  context loss, which is why a per-page canvas can never persist across routes.
  It is still code-split and deferred, which delays the first mount without
  weakening the rule.
- **Deferred to first paint, not to idle.** `requestIdleCallback(…, {timeout: 2000})`
  is the intuitive choice and the wrong one: idle does not arrive while React is
  hydrating, so the timeout becomes the real schedule and the work lands *on top
  of* hydration rather than after it. Measured with Lighthouse on a production
  build of the home page, moving to two chained `requestAnimationFrame`s took the
  performance score from 42 to 70 and total blocking time from 2,570 ms to
  650 ms — against 5,160 ms for the idle-callback version, which was worse than
  doing nothing. Lighthouse applies a 4× CPU throttle, so treat those as a
  slow-device proxy. A short timer backstop stays in place, because rAF is frozen
  in a background tab.
- **Dark only.** The light theme was removed deliberately, not left unfinished.
  The backlit keyboard, the glass panels, the additive GPU blending and every
  measured contrast ratio are designed against a near-black ground, and each one
  needed a separate inversion to survive on white — two designs maintained in
  parallel for a site whose whole voice is a dark terminal.
  `prefers-color-scheme` is not consulted at all. Section-level palette inversion
  still exists; that is a compositional device, not a theme.
- **GSAP route transitions, not View Transitions.** On Next 16.3.0 `viewTransition`
  is rejected as an unknown config key both at the top level and under
  `experimental`, and `react@19.2.8` exports no `ViewTransition` — it exists only
  on React's experimental channel. The browser's own `startViewTransition()` is
  Chromium-mostly and pairs badly with the App Router's streaming navigation. A
  short GSAP enter on pathname change works in every browser, costs no
  dependency, and runs inside the same motion contract as everything else.
- **`gsap.from()` rather than `set()` + `to()`** wherever content is hidden in
  order to be revealed. The tween's end state is whatever the element already
  was, so an interrupted or killed tween still lands on *visible*. The résumé
  taught this one: a single `once: true` trigger on a wrapper whose top was
  already above the fold never fired, and the page rendered 33 rows at opacity 0.

## Accessibility and failure modes

Under `prefers-reduced-motion: reduce` nothing starts — no Lenis, no
ScrollTrigger, no timelines, and no canvas at all. Native scrolling is left
alone and the page is a complete, readable document. Half-disabled motion is
worse than none, because content pinned mid-timeline never arrives.

Everything that hides content fails open:

- Reveal start states live in CSS, behind `prefers-reduced-motion: no-preference`
  *and* a `motion-on` class armed by a pre-paint inline script. A 2.5 s watchdog
  drops that class if the motion bundle never reports ready — a chunk 404, a CSP
  block, a parse error on an older browser — so the page degrades to a plain
  document instead of staying blank.
- The résumé grid carries its own deadman, restoring any element still below full
  opacity after 4 s.
- The boot overlay locks scrolling, so it carries a deadman that unlocks it. Any
  interaction skips it, and it plays once per session, not once per page view.
- Pinned sections disable themselves when their content is taller than the
  viewport: pinning something unreachable is a dead end, not an effect.
- Diagrams, split headings and scrambled headings all render their real content
  server-side. With no JS the animation is simply absent; the destination is
  always there.
- The custom cursor, magnetic links and the horizontal rail are pointer-gated.
  Touch keeps the native swipe strip and the real cursor.

Also: skip link, one `<h1>` per page, server-rendered JSON-LD, and relative
timestamps resolved on the server so they cannot mismatch on hydration.

## Confidentiality

`npm run redact` is a publish gate, not a linter. It scans every `.mdx`, `.md`,
`.ts` and `.tsx` under `content/`, `app/`, `lib/` and `components/` against a
denylist held in a separate private repo — one denylist rather than two that
drift — and exits non-zero on any hit.

The line it enforces: **employers are named; products and internals are not.**
Employment history isn't confidential — it's on LinkedIn and any background check
resolves it, so withholding it bought nothing. What stays out is the layer that
actually carries exposure: product names, client names, internal package and file
paths, instance types and regions. Generic descriptions and unattributed numbers
are fine and preferred, which is why the case studies describe their
architectures in full detail and name none of their products.

That is a deliberate constraint on the writing rather than an omission, and it is
why prose lives in `content/**/*.mdx` instead of inline in components: the gate
scans a directory, so keeping every published sentence under one tree means it
cannot miss a file. `npm run check` runs the gate first, before typecheck and
build.

## Local development

Node 20.9+ (Next 16's floor).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint, via `eslint-config-next`. |
| `npm run redact` | The confidentiality gate. Exits non-zero on a hit. |
| `npm run check` | `redact` → `tsc --noEmit` → `build`. The gate before anything ships. |
| `npm run resume:pdf` | Regenerate `public/resume.pdf` from `/resume`. Needs Chrome; set `CHROME=` if it isn't at the default macOS path. |

`npm run redact` warns and exits 0 rather than failing if the gate isn't present,
so a clean checkout still builds. Set `REDACT_GATE` to point at `redact-check.sh`
if you have it somewhere else.

In development, `window.__scene` exposes the renderer, the scene graph, the live
scene object and a `step()` that renders a single frame by hand — rAF is paused
in a hidden tab, which otherwise makes "the shader is broken" and "the loop isn't
running" look identical from the outside. `window.lenis`, `window.gsap` and
`window.ScrollTrigger` are exposed for a related reason: Lenis owns the scroll
position, so `window.scrollTo()` desyncs it and the symptom looks exactly like a
broken ScrollTrigger.
