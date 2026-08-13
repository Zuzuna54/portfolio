"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Theme control.
 *
 * There are three states, not two: explicit light, explicit dark, and "no
 * choice made" — where the OS preference decides. The inline script in the
 * root layout applies an explicit choice before first paint; this component
 * only ever reads that same source of truth, so the two can't disagree.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    // No stored choice — mirror the OS so the button label is honest about
    // what the visitor is currently looking at.
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)");
    setTheme(prefersLight.matches ? "light" : "dark");

    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) setTheme(e.matches ? "light" : "dark");
    };
    prefersLight.addEventListener("change", onChange);
    return () => prefersLight.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  // Render the button shell on the server so layout doesn't shift, but leave
  // the label empty until we know which theme is actually active.
  return (
    <button
      type="button"
      className="theme-toggle mono"
      onClick={toggle}
      aria-label={
        theme ? `Switch to ${theme === "light" ? "dark" : "light"} theme` : "Switch theme"
      }
      aria-live="polite"
    >
      <span aria-hidden="true">{theme === "light" ? "DARK" : theme === "dark" ? "LIGHT" : ""}</span>
    </button>
  );
}
