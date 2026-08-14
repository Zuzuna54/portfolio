import type { Metadata, Viewport } from "next";
import { Recursive } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MotionProvider from "@/components/motion/MotionProvider";
import Cursor from "@/components/motion/Cursor";
import ScrollProgress from "@/components/motion/ScrollProgress";
import SceneCanvas from "@/components/webgl/SceneCanvasDeferred";
import RouteTransition from "@/components/motion/RouteTransition";
import Terminal from "@/components/TerminalDeferred";
import StructuredData from "@/components/StructuredData";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/site";
import "@/styles/main.scss";

// One family, three voices. Recursive's MONO axis slides from proportional sans
// to true monospace, so the reading voice and the terminal voice are the same
// typeface at different axis positions — and the scroll timeline can animate
// between them. CASL and slnt are loaded for the same reason.
//
// `wght` is absent from this list on purpose — next/font owns the weight axis
// through its own `weight` option and rejects it here. Omitting `weight`
// entirely is what keeps the axis variable, and it is: measured ink coverage
// runs 18044 → 41426 → 55568 px at wght 300 / 800 / 1000.
//
// Do not try to verify that by measuring width. Recursive's wght axis does not
// change advance widths at all, so every geometric probe reports it dead. See
// HANDOFF §5.11.
const recursive = Recursive({
  subsets: ["latin"],
  variable: "--font-recursive",
  axes: ["CASL", "MONO", "slnt"],
  display: "swap",
});

// Was declared here as a second copy of the same string. One origin, in
// lib/site.ts, so the canonicals, sitemap, robots and JSON-LD cannot disagree
// about which hostname is the real one.
const SITE = SITE_URL;

// The visible hero deliberately leads with the work rather than a job title.
// Recruiter search and link previews still need the title, so it lives here.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Giorgi Giorgobiani — Senior AI Platform Engineer",
    template: "%s — Giorgi Giorgobiani",
  },
  // 155 chars. The previous one ran to 209 and Google cut it mid-clause, losing
  // "Nine years of production engineering" — which was the credibility half.
  description:
    "Senior AI Platform Engineer in New York. Nine years building the infrastructure agent systems run on: orchestration, retrieval, cost and latency control.",
  // `keywords` deliberately absent. Google has ignored the meta keywords tag
  // since 2009; it does nothing but date the site to 2010-era optimisation.
  authors: [{ name: "Giorgi Giorgobiani", url: SITE }],
  creator: "Giorgi Giorgobiani",
  // Only the fields that are genuinely site-wide.
  //
  // `title`, `description` and `url` were set here too, and Next merges parent
  // metadata into every child — so `/work`, `/resume`, `/about` and `/writing`
  // all advertised the *homepage* to every social crawler, with an `og:url`
  // that contradicted their own canonical. Sharing /resume rendered the home
  // card. Left unset, Next fills og:title and og:description from each page's
  // own title and description, which is what we want everywhere.
  openGraph: {
    type: "profile",
    siteName: "Giorgi Giorgobiani",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  // Canonical on the root, inherited as a base by every page's own `alternates`.
  // The site answers on several *.vercel.app hostnames as well as the real
  // domain; without this a crawler can index a preview URL and split the ranking
  // for the owner's own name across two "sites".
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Let Google show a full text snippet and a large image preview rather
      // than truncating to a couple of lines.
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

// Dark only — see the note at the top of `styles/main.scss`. Declaring it here
// too is what stops the browser painting white form controls and scrollbars
// over a near-black page.
export const viewport: Viewport = {
  themeColor: "#100d16",
  colorScheme: "dark",
};

// Arms the reveal start-states before first paint, so animated content doesn't
// flash in fully-formed and then hide itself once React hydrates.
//
// The watchdog is the important half. If the motion bundle never loads — a
// chunk 404, a CSP block, a parse error on an older browser — nothing would
// ever run the reveal tweens, and every [data-reveal] block would stay at
// opacity 0 forever. After 2.5s without MotionProvider reporting ready, the
// class is dropped and the page becomes a normal readable document.
const MOTION_ARM = `(function(){try{
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var d=document.documentElement;d.classList.add("motion-on");
setTimeout(function(){if(d.dataset.motionReady!=="1"){d.classList.remove("motion-on")}},2500);
}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={recursive.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_ARM }} />
        {/* Server-rendered, so it is in the initial HTML rather than in
            Googlebot's deferred-render queue. */}
        <StructuredData />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {/* MotionProvider is a client boundary, but `children` is passed through
            as a prop — so every page below stays a server component. */}
        <MotionProvider>
          {/* Mounted once, never unmounted — the GPU context has to
              survive navigation, and unmounting a canvas forces it to be
              lost. Routes push scenes into it through the tunnel.

              Code-split and held until the browser is idle: three.js is 242 KB
              and building the board is the single largest thing competing with
              the hero for the main thread. Deferring the *first* mount does not
              weaken the never-unmount rule. */}
          <SceneCanvas />
          <ScrollProgress />
          <Cursor />
          <SiteHeader />
          <RouteTransition>{children}</RouteTransition>
          <SiteFooter />
          {/* Last in the tree so its overlay stacks above the footer without
              needing a z-index arms race. It owns the only global key handler
              on the site — the backtick opener and the Konami sequence share
              one listener rather than competing for the same keydowns. */}
          <Terminal />
        </MotionProvider>
        {/* Speed Insights is the one that matters for SEO: it produces the
            *field* data Core Web Vitals ranking actually uses. Lab numbers from
            Lighthouse are a proxy — and only ~11% of pages on the web have real
            field data at all, so until this reports, the site's CWV are not
            being used as a signal either way. Both scripts load after
            interactive and send nothing on a prerendered page view. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
