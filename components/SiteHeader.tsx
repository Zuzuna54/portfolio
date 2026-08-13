import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__row">
        <Link className="brand" href="/">
          Giorgobiani
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/work">Work</Link>
          <Link href="/writing">Writing</Link>
          <Link href="/about">About</Link>
          <Link href="/resume">Résumé</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
