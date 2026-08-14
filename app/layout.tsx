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

const SITE = "https://giorgobiani.dev";

// The visible hero deliberately leads with the work rather than a job title.
// Recruiter search and link previews still need the title, so it lives here.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Giorgi Giorgobiani — Senior AI Platform Engineer",
    template: "%s — Giorgi Giorgobiani",
  },
  description:
    "I build the infrastructure agent systems run on — orchestration, retrieval, evaluation, and the cost and latency controls that decide whether a system survives production. Nine years of production engineering.",
  keywords: [
    "AI Platform Engineer",
    "AI Infrastructure",
    "Agent Orchestration",
    "RAG",
    "Multi-tenant LLM infrastructure",
    "pgvector",
    "AWS",
  ],
  authors: [{ name: "Giorgi Giorgobiani", url: SITE }],
  creator: "Giorgi Giorgobiani",
  openGraph: {
    type: "profile",
    siteName: "Giorgi Giorgobiani",
    url: SITE,
    title: "Giorgi Giorgobiani — Senior AI Platform Engineer",
    description:
      "Agent orchestration, RAG, and multi-tenant LLM infrastructure on AWS.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Giorgi Giorgobiani — Senior AI Platform Engineer",
    description:
      "Agent orchestration, RAG, and multi-tenant LLM infrastructure on AWS.",
  },
  robots: { index: true, follow: true },
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
      </body>
    </html>
  );
}
