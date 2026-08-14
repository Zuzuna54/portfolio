"use client";

import dynamic from "next/dynamic";
import Deferred from "@/components/motion/Deferred";

/**
 * The terminal, code-split and mounted after first paint.
 *
 * It is ~590 lines of component that nobody sees until they press a key, and
 * it was hydrating on every route alongside the hero. Splitting it costs a
 * short delay before the backtick shortcut and the corner hint are live —
 * acceptable for a feature whose whole premise is that you go looking for it.
 *
 * It owns the site's only global keydown listener, so nothing competes with it
 * for those keys in the meantime; there is no half-armed state where one
 * shortcut works and another doesn't.
 */
const Terminal = dynamic(() => import("./Terminal"), { ssr: false });

export default function TerminalDeferred() {
  return (
    <Deferred>
      <Terminal />
    </Deferred>
  );
}
