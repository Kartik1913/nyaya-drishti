import { useEffect, useRef, useState } from "react";
import Logo from "./Logo.jsx";

/**
 * First-load title card. On the very first visit of a session, a navy curtain
 * holds the screen for a beat while the brand mark scales in, a gold ring
 * draws itself around it, and the wordmark fades up — then the curtain lifts
 * to reveal the landing page. It signals "this was designed" before the user
 * has scrolled a pixel.
 *
 * Plays once per session (sessionStorage), is skippable (click / key), hard-
 * capped in time, and collapses to nothing under reduced motion.
 */
export default function IntroReveal() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [show, setShow] = useState(() => {
    try {
      if (sessionStorage.getItem("nyaya:intro") === "1") return false;
      sessionStorage.setItem("nyaya:intro", "1");
    } catch {
      return false;
    }
    return true;
  });
  const [lifting, setLifting] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    if (!show) return;
    if (reduced) {
      setShow(false);
      return;
    }
    const list = timers.current;
    const add = (fn, at) => list.push(setTimeout(fn, at));
    add(() => setLifting(true), 1550); // begin curtain lift
    add(() => setShow(false), 2150); // fully gone
    return () => list.forEach(clearTimeout);
  }, [show, reduced]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setLifting(true);
    setTimeout(() => setShow(false), 500);
  };

  useEffect(() => {
    if (!show) return;
    const onKey = () => skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="presentation"
      onClick={skip}
      className="fixed inset-0 z-[150] flex items-center justify-center overflow-hidden cursor-pointer"
      style={{
        background:
          "radial-gradient(ellipse 70% 70% at 50% 45%, #0f2138 0%, #0B1628 55%, #060d1a 100%)",
        transform: lifting ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 640ms cubic-bezier(0.7,0,0.2,1)",
      }}
    >
      {/* Ambient gold glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 40% at 50% 45%, rgba(214,192,140,0.14), transparent 70%)",
          opacity: lifting ? 0 : 1,
          transition: "opacity 400ms ease-out",
        }}
      />

      <div
        className="relative flex flex-col items-center gap-6"
        style={{
          opacity: lifting ? 0 : 1,
          transition: "opacity 350ms ease-out",
        }}
      >
        <div className="relative w-[150px] h-[150px] flex items-center justify-center">
          {/* Drawing gold ring */}
          <svg
            viewBox="0 0 150 150"
            className="absolute inset-0 w-full h-full -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="75"
              cy="75"
              r="65"
              fill="none"
              stroke="url(#introRing)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="408"
              style={{
                animation: "ringDraw 1200ms cubic-bezier(0.16,1,0.3,1) 150ms both",
              }}
            />
            <defs>
              <linearGradient id="introRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8A7240" />
                <stop offset="50%" stopColor="#D6C08C" />
                <stop offset="100%" stopColor="#B89B5E" />
              </linearGradient>
            </defs>
          </svg>
          {/* Mark scales + fades in */}
          <div
            style={{
              animation:
                "wordRise 700ms cubic-bezier(0.16,1,0.3,1) 250ms both",
            }}
          >
            <Logo
              variant="mark"
              className="w-20 h-20 drop-shadow-[0_0_20px_rgba(214,192,140,0.4)]"
            />
          </div>
        </div>

        {/* Wordmark */}
        <div
          className="font-display-lg text-3xl md:text-4xl text-white tracking-tight"
          style={{
            animation: "wordRise 700ms cubic-bezier(0.16,1,0.3,1) 650ms both",
          }}
        >
          Nyaya<span className="text-gold">-</span>Drishti
        </div>
        <div
          className="font-label-md text-[10px] uppercase tracking-[0.4em] text-gold-light/70"
          style={{
            animation: "wordRise 700ms cubic-bezier(0.16,1,0.3,1) 900ms both",
          }}
        >
          Intelligent Triage
        </div>
      </div>
    </div>
  );
}
