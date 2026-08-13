import type { Metadata, Viewport } from "next";
import { Recursive } from "next/font/google";
import "@/styles/main.scss";

// One family, three voices. Recursive's MONO axis slides from proportional sans
// to true monospace, so the reading voice and the terminal voice are the same
// typeface at different axis positions — and the scroll timeline can animate
// between them. CASL and slnt are loaded for the same reason.
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#100d16" },
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
  ],
  colorScheme: "dark light",
};

// Runs before first paint so an explicit theme choice never flashes the wrong
// palette. Kept tiny and dependency-free on purpose; it must not block.
const NO_FLASH = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={recursive.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
