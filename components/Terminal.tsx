"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useMotion } from "@/components/motion/MotionProvider";
import { CONTACT, SUMMARY } from "@/lib/site";

/**
 * The terminal overlay — the site's one easter egg, and a real navigation path.
 *
 * It is the same machine as the boot sequence (`webgl/HeroBoot.tsx`): same
 * monospace voice, same `$` prompt, same gold-on-near-black. The difference is
 * that this one answers.
 *
 * Three properties matter more than the feature itself:
 *
 * 1. **It cannot trap anyone.** Escape closes it from anywhere, the close
 *    control is visible and focusable, clicking outside closes it, and the
 *    effect that locks scrolling unlocks it in its own cleanup — so there is no
 *    code path where the overlay is gone and the page is still frozen. That is
 *    the boot overlay's lesson (HANDOFF §5.7) applied one component over.
 * 2. **It never eats a keystroke it wasn't offered.** The backtick opener is
 *    ignored when focus is in a field, so typing a backtick in a search box, a
 *    form, or a code block stays typing a backtick.
 * 3. **Reduced motion changes the transition, never the function.** With motion
 *    off the panel simply appears. Everything it can do, it still does.
 *
 * The Konami listener lives here rather than in its own component so the site
 * has exactly one global key handler to reason about.
 */

type LineKind = "cmd" | "out" | "err" | "dim";

type Draft = {
  kind: LineKind;
  /** Left column — a command name, a route, a field label. Gold. */
  label?: string;
  text: string;
  href?: string;
};

type Line = Draft & { id: number };

/**
 * The site's routes, and the only things `open` will navigate to.
 *
 * `as const` is load-bearing: it keeps `path` a union of string literals, which
 * is what `router.push` wants if typed routes are ever switched on. A widened
 * `string` would stop compiling the day that flag flips.
 */
const ROUTES = [
  { name: "home", path: "/", blurb: "the hero, and what I build" },
  // No count in this blurb on purpose. It said "three case studies" and shipped
  // the same day a fourth landed. This is a client component and can't read the
  // content directory, so a number here is a promise it has no way to keep.
  { name: "work", path: "/work", blurb: "case studies, long form" },
  { name: "writing", path: "/writing", blurb: "notes on systems that ran" },
  { name: "about", path: "/about", blurb: "nine years, mostly infrastructure" },
  { name: "resume", path: "/resume", blurb: "the short version" },
] as const;

const COMMANDS: readonly (readonly [string, string])[] = [
  ["help", "this list"],
  ["whoami", "who you are reading"],
  ["ls", "routes on this site"],
  ["open <page>", "go to one of them"],
  ["contact", "email, linkedin, github"],
  ["clear", "wipe the scrollback"],
];

const KONAMI = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
] as const;

// Modest on purpose. A brutalist dark terminal is allowed one gold scanline and
// two lines of text; it is not allowed confetti.
const EGG: Draft[] = [
  { kind: "dim", text: "↑ ↑ ↓ ↓ ← → ← → B A" },
  // 75 is the real count — six rows of ROWS in scenes/keyboard.ts, verified by
  // counting them. It said 61 first, which nobody would ever check and which
  // would have been wrong forever.
  { kind: "out", text: "signal acquired — 75 keys on the hero board, and you found the right ten." },
];

const BANNER: Draft[] = [
  { kind: "dim", text: "giorgobiani.dev — terminal. `help` lists commands, esc closes." },
];

/** Scrollback is capped: a session left open all afternoon shouldn't grow forever. */
const MAX_LINES = 240;
const MAX_HISTORY = 50;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/**
 * Is this keystroke going somewhere that expects text?
 *
 * The opener is a bare printable character, so this check is the whole reason
 * the feature is safe to ship on every route. `closest` rather than a tag
 * comparison, because the target of a keydown inside a contenteditable is
 * whatever node the caret sits in.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return Boolean(el.closest(EDITABLE));
}

/**
 * "Are we past hydration?", without a state-in-effect round trip.
 *
 * The server snapshot is false and the client snapshot is true, so the markup
 * React renders on the server matches what it hydrates, and the affordance
 * appears on the first client render after that. Nothing ever subscribes.
 */
const NEVER_CHANGES = () => () => {};

function focusablesIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  // getClientRects rather than offsetParent: the panel's ancestor is
  // position:fixed, which makes offsetParent lie about visibility.
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0,
  );
}

export type TerminalProps = {
  /**
   * The small backtick badge in the bottom corner. On by default: without it
   * the terminal is unreachable on touch, where there is no backtick key.
   */
  hint?: boolean;
};

export default function Terminal({ hint = true }: TerminalProps) {
  const router = useRouter();
  const { enabled, lenis } = useMotion();
  const uid = useId();

  const ready = useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [lines, setLines] = useState<Line[]>(() =>
    BANNER.map((d, i) => ({ ...d, id: i })),
  );
  const [history, setHistory] = useState<string[]>([]);
  const [flare, setFlare] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  /** Whatever had focus when we opened, so it can have it back. */
  const returnRef = useRef<HTMLElement | null>(null);
  const seq = useRef(BANNER.length);
  const konami = useRef<string[]>([]);
  const histAt = useRef(-1);
  const draftRef = useRef("");

  // Mirrors of state for the global key handler, which is registered once and
  // must not be torn down and rebuilt on every keystroke.
  const openRef = useRef(false);
  const lenisRef = useRef(lenis);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  const print = useCallback((drafts: Draft[]) => {
    setLines((prev) => {
      const next = prev.concat(drafts.map((d) => ({ ...d, id: seq.current++ })));
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const openTerminal = useCallback((fallback?: HTMLElement | null) => {
    if (!openRef.current) {
      const active = document.activeElement as HTMLElement | null;
      returnRef.current = active && active !== document.body ? active : fallback ?? null;
    }
    setOpen(true);
  }, []);

  // ------------------------------------------------------------------ commands

  const run = useCallback(
    (raw: string) => {
      const line = raw.trim();
      const echo: Draft = { kind: "cmd", text: `$ ${line}` };
      if (!line) {
        print([{ kind: "cmd", text: "$" }]);
        return;
      }

      const [head, ...args] = line.split(/\s+/);
      const cmd = head.toLowerCase();

      if (cmd === "clear") {
        setLines([]);
        return;
      }

      if (cmd === "help") {
        print([
          echo,
          ...COMMANDS.map<Draft>(([name, what]) => ({ kind: "out", label: name, text: what })),
          { kind: "dim", text: "↑/↓ walks history · esc closes · ` reopens" },
        ]);
        return;
      }

      if (cmd === "whoami") {
        print([
          echo,
          { kind: "out", text: `${CONTACT.name} — ${CONTACT.title}` },
          { kind: "out", text: SUMMARY },
          {
            kind: "dim",
            text: `Nine years, mostly infrastructure. ${CONTACT.location}, open to remote across the US.`,
          },
        ]);
        return;
      }

      if (cmd === "ls") {
        print([
          echo,
          ...ROUTES.map<Draft>((r) => ({ kind: "out", label: r.path, text: r.blurb })),
          { kind: "dim", text: "open <name> — e.g. `open work`" },
        ]);
        return;
      }

      if (cmd === "contact") {
        print([
          echo,
          { kind: "out", label: "email", text: CONTACT.email, href: `mailto:${CONTACT.email}` },
          { kind: "out", label: "linkedin", text: CONTACT.linkedin, href: CONTACT.linkedin },
          { kind: "out", label: "github", text: CONTACT.github, href: CONTACT.github },
          { kind: "out", label: "where", text: `${CONTACT.location} · ${CONTACT.remote}` },
        ]);
        return;
      }

      if (cmd === "open") {
        const arg = (args[0] ?? "").toLowerCase();
        if (!arg) {
          print([echo, { kind: "err", text: "open: which page? `ls` lists them." }]);
          return;
        }
        // Accept `work`, `/work`, `/work/`, and — because the nav says Résumé —
        // the accented spelling. Decompose, drop the combining marks, compare.
        const key =
          arg === "/"
            ? "home"
            : arg
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/^\/+|\/+$/g, "");
        const match = ROUTES.find((r) => r.name === key || r.path === `/${key}`);
        if (!match) {
          // Never navigate on a guess — an unknown target that redirected
          // somewhere plausible would be worse than an error.
          print([
            echo,
            { kind: "err", text: `open: no page "${args[0]}". \`ls\` lists them.` },
          ]);
          return;
        }
        print([echo, { kind: "out", text: `→ ${match.path}` }]);
        router.push(match.path);
        close();
        return;
      }

      print([echo, { kind: "err", text: `${cmd}: not a command. try \`help\`.` }]);
    },
    [close, print, router],
  );

  const submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const raw = value;
      const entry = raw.trim();
      setValue("");
      histAt.current = -1;
      draftRef.current = "";
      if (entry) {
        setHistory((h) =>
          (h[h.length - 1] === entry ? h : [...h, entry]).slice(-MAX_HISTORY),
        );
      }
      try {
        run(raw);
      } catch {
        // A thrown command must not take the overlay — or the page — with it.
        print([{ kind: "err", text: "that command failed. the terminal is fine; esc closes it." }]);
      }
    },
    [print, run, value],
  );

  // ------------------------------------------------------------- global keys

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Escape first and unconditionally. Whatever else is true of this
      // component's state, this key gets the user out.
      if (e.key === "Escape") {
        if (openRef.current) {
          e.preventDefault();
          setOpen(false);
        }
        konami.current.length = 0;
        return;
      }

      const editable = isEditableTarget(e.target);

      // `code` as well as `key`, so a layout that puts backtick behind a dead
      // key still opens it.
      if (e.key === "`" || e.code === "Backquote") {
        const chord = e.ctrlKey || e.metaKey;
        // The bare key is a printable character. It belongs to whatever field
        // has focus, always.
        if (!chord && (e.altKey || editable)) return;
        e.preventDefault();
        if (chord && openRef.current) setOpen(false);
        else openTerminal();
        return;
      }

      if (editable) return;

      const buf = konami.current;
      buf.push(e.key.toLowerCase());
      if (buf.length > KONAMI.length) buf.shift();
      if (buf.length === KONAMI.length && KONAMI.every((k, i) => buf[i] === k)) {
        buf.length = 0;
        openTerminal();
        print(EGG);
        setFlare((n) => n + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openTerminal, print]);

  // --------------------------------------------------- open: focus and scroll

  useEffect(() => {
    if (!open) return;

    const returnTo = returnRef.current;
    const panel = panelRef.current;

    // Lenis owns scrolling when motion is on; the class covers the reduced-motion
    // case, where there is no Lenis at all. Both are undone below, on every exit
    // path including unmount — a page left unscrollable behind a dismissed
    // overlay is the single worst failure this component could have.
    lenisRef.current?.stop();
    document.documentElement.classList.add("terminal-open");

    inputRef.current?.focus();

    // The backstop half of the trap. The Tab handler on the panel can only fire
    // while focus is already inside it; this catches anything that gets out —
    // a click on the page behind, a browser quirk, an element removed
    // mid-focus — and pulls it back to the prompt.
    const onFocusIn = (e: FocusEvent) => {
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) inputRef.current?.focus();
    };
    document.addEventListener("focusin", onFocusIn);

    return () => {
      // Order matters: stop policing focus before handing it back, or the
      // backstop would immediately steal it from the element we just restored.
      document.removeEventListener("focusin", onFocusIn);
      document.documentElement.classList.remove("terminal-open");
      lenisRef.current?.start();
      if (panel) gsap.set(panel, { clearProps: "opacity,transform" });
      if (returnTo && document.contains(returnTo)) returnTo.focus();
    };
  }, [open]);

  // ----------------------------------------------------------- the transition

  useEffect(() => {
    if (!open || !enabled) return;
    const panel = panelRef.current;
    if (!panel) return;

    const tween = gsap.fromTo(
      panel,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.22, ease: "power2.out", clearProps: "opacity,transform" },
    );

    // Same instinct as the boot deadman. GSAP's ticker stops in a hidden tab, so
    // a tween that sets opacity 0 and never runs would leave the panel invisible
    // with the page locked behind it. gsap.set is synchronous and doesn't care.
    const deadman = setTimeout(() => {
      tween.kill();
      gsap.set(panel, { clearProps: "opacity,transform" });
    }, 900);

    return () => {
      clearTimeout(deadman);
      tween.kill();
      gsap.set(panel, { clearProps: "opacity,transform" });
    };
  }, [open, enabled]);

  // The scrollback follows the newest line, the way a real one does.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  useEffect(() => {
    if (!flare) return;
    const t = setTimeout(() => setFlare(0), 1000);
    return () => clearTimeout(t);
  }, [flare]);

  // ------------------------------------------------------------- interactions

  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const nodes = focusablesIn(panelRef.current);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    const inside = Boolean(panelRef.current?.contains(active));

    if (e.shiftKey && (!inside || active === first)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (!inside || active === last)) {
      e.preventDefault();
      first.focus();
    }
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const el = e.currentTarget;
    const toEnd = () =>
      requestAnimationFrame(() => {
        const n = el.value.length;
        el.setSelectionRange(n, n);
      });

    if (e.key === "ArrowUp") {
      if (history.length === 0) return;
      e.preventDefault();
      if (histAt.current === -1) {
        // Remember the half-typed line so Down can give it back.
        draftRef.current = value;
        histAt.current = history.length;
      }
      histAt.current = Math.max(0, histAt.current - 1);
      setValue(history[histAt.current]);
      toEnd();
      return;
    }

    if (histAt.current === -1) return;
    e.preventDefault();
    histAt.current += 1;
    if (histAt.current >= history.length) {
      histAt.current = -1;
      setValue(draftRef.current);
    } else {
      setValue(history[histAt.current]);
    }
    toEnd();
  };

  if (!ready) return null;

  return (
    <>
      {hint ? (
        <button
          ref={hintRef}
          type="button"
          className={`terminal-hint${open ? " is-hidden" : ""}`}
          // Kept mounted while open — it is the element focus returns to, and
          // it sits under the overlay anyway. Just taken out of the tab order.
          tabIndex={open ? -1 : 0}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => openTerminal(hintRef.current)}
        >
          <span aria-hidden="true">`</span> terminal
        </button>
      ) : null}

      {enabled && flare > 0 ? <div key={flare} className="terminal-flare" aria-hidden="true" /> : null}

      {open ? (
        <div
          className="terminal"
          // Clicking the ground outside the panel dismisses, which is what a
          // pointer user reaches for first. The target check keeps a click that
          // started inside the panel from closing it.
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="terminal__panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            onKeyDown={onPanelKeyDown}
          >
            <div className="terminal__bar">
              <p className="terminal__title" id={`${uid}-title`}>
                giorgobiani.dev — terminal
              </p>
              <button type="button" className="terminal__close" onClick={close}>
                esc <span aria-hidden="true">✕</span>
                <span className="terminal__sr"> close terminal</span>
              </button>
            </div>

            <div
              className="terminal__log"
              ref={logRef}
              role="log"
              aria-label="Terminal output"
              // Scrollable regions have to be reachable by keyboard; Chrome
              // doesn't make them focusable on its own.
              tabIndex={0}
            >
              {lines.map((l) => (
                <p key={l.id} className={`terminal__line terminal__line--${l.kind}`}>
                  {l.label ? <span className="terminal__key">{l.label}</span> : null}
                  {l.href ? <a href={l.href}>{l.text}</a> : l.text}
                </p>
              ))}
            </div>

            <form className="terminal__form" onSubmit={submit}>
              <span className="terminal__prompt" aria-hidden="true">
                $
              </span>
              <input
                ref={inputRef}
                className="terminal__input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onInputKeyDown}
                aria-label="Command"
                placeholder="help"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
