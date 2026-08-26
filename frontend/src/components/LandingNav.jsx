import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";
import { armEntrance } from "../entrance/entrance.js";

const links = [
  { label: "Problem", href: "#problem" },
  { label: "Technology", href: "#technology" },
  { label: "Impact", href: "#impact" },
  { label: "Users", href: "#users" },
  { label: "About", href: "#about" },
];

/**
 * Landing navigation that starts transparent over the dark cinematic hero and
 * solidifies into the ivory surface once you scroll past it. The previous
 * version was permanently opaque ivory, which cut a hard bright band across
 * the top of the hero photograph.
 *
 * Also replaces two decorative no-op icon buttons with real destinations, and
 * adds the mobile menu the nav was previously missing entirely (links simply
 * vanished below `md`).
 */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > 80);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on Escape — a menu you can't dismiss by keyboard is
  // a trap for keyboard and screen-reader users.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const solid = scrolled || menuOpen;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        solid
          ? "bg-surface/95 backdrop-blur-md border-b border-outline-variant shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full max-w-[1600px] mx-auto">
        <Link
          to="/landing"
          className="flex items-center gap-2.5 group shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <Logo className="h-9 w-9 transition-transform duration-300 group-hover:scale-105" />
          <span
            className={`font-headline-md text-headline-md font-bold transition-colors duration-500 ${
              solid ? "text-primary" : "text-white"
            }`}
          >
            Nyaya-Drishti
          </span>
        </Link>

        <div className="hidden md:flex gap-7 items-center">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`relative font-body-md text-body-md transition-colors cursor-pointer after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full ${
                solid
                  ? "text-on-surface-variant hover:text-primary"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/login"
            className={`hidden sm:inline-flex font-label-md text-label-md font-semibold px-4 py-2.5 rounded-four transition-colors ${
              solid
                ? "text-primary hover:bg-surface-container-high"
                : "text-slate-200 hover:text-white"
            }`}
          >
            Sign in
          </Link>
          <Link
            to="/"
            onClick={() => armEntrance()}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-gold-light to-gold text-navy px-5 py-2.5 rounded-four font-semibold font-label-md text-label-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/30"
          >
            Dashboard
            <Icon name="arrow_forward" size="16px" />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className={`md:hidden w-11 h-11 -mr-2 inline-flex items-center justify-center rounded transition-colors ${
              solid ? "text-primary" : "text-white"
            }`}
          >
            <Icon name={menuOpen ? "close" : "menu"} size="24px" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-400 ease-out ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-margin-mobile pb-4 pt-1 flex flex-col bg-surface/95 backdrop-blur-md border-t border-outline-variant">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary py-3 border-b border-outline-variant/60 last:border-0"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="font-body-md text-body-md text-primary font-semibold py-3 mt-1"
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  );
}
