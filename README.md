# giorgobiani.dev

Personal site — brutalist, scroll-scrubbed, WebGL-backed.

Built as a work sample as much as a portfolio: the motion layer is the point,
not decoration.

## Stack

- **Next.js 16** (App Router, React 19.2, View Transitions)
- **SCSS** — `@use` / `@forward` module system, tokens emitted as CSS custom
  properties so the theme toggle and full-bleed section inversions swap the
  whole palette at runtime
- **GSAP** — ScrollTrigger, DrawSVG, SplitText
- **Lenis** — smooth scroll, bridged to ScrollTrigger
- **Three.js / React Three Fiber** — particle field
- **Motion** — component-level gestures

## Design

Palette authored in **OKLCH** with hex fallbacks. Roles are assigned by measured
contrast, not preference:

| Token | Contrast on ground (dark / light) | Role |
|---|---|---|
| `--gold` | 10.7 / 5.13 | Links and interactive — clears AA everywhere |
| `--violet` | 4.94 / 7.89 | WebGL brand colour, gradients |
| `--crimson` | 4.18 / 6.35 | Large type, fills, inverted sections only — below body AA in dark |

Type is **Recursive**, one variable family whose `MONO` axis slides from
proportional sans to true monospace, so the reading voice and the terminal
voice are the same typeface at different axis positions.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Accessibility

`prefers-reduced-motion: reduce` renders a complete static document — no
scrubbing, no pinning, no WebGL. A scroll-driven page with motion half-disabled
is worse than a static one, because content pinned mid-timeline never arrives.
