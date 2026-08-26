import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useScroll.js";

/**
 * Scroll-triggered entrance animation with directional variants.
 *
 * The previous version only ever did "fade + nudge up 8px", which read as
 * nothing happening at all. These variants give each section its own entrance
 * direction and depth so scrolling the page feels choreographed rather than
 * static — while still only animating `transform`/`opacity`/`filter` so there
 * is no layout thrash or CLS.
 *
 * Under `prefers-reduced-motion: reduce` content renders immediately in its
 * final state.
 */

const VARIANTS = {
  up: "opacity-0 translate-y-12",
  down: "opacity-0 -translate-y-10",
  left: "opacity-0 -translate-x-14",
  right: "opacity-0 translate-x-14",
  scale: "opacity-0 scale-90",
  // A 3D "card lifting off the page" entrance — the signature move for grids.
  rise: "opacity-0 translate-y-16",
  blur: "opacity-0 blur-md translate-y-8",
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  duration = 800,
  threshold = 0.15,
  once = true,
  as: Tag = "div",
}) {
  const reduced = useReducedMotion();
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (reduced) {
      setIsRevealed(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setIsRevealed(false);
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, threshold, once]);

  const hidden = VARIANTS[variant] || VARIANTS.up;
  const isRise = variant === "rise";

  return (
    <Tag
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        // Custom expo-out easing: fast start, long graceful settle.
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        ...(isRise && !reduced
          ? {
              perspective: "1200px",
              transform: isRevealed
                ? "translateY(0) rotateX(0deg)"
                : "translateY(4rem) rotateX(8deg)",
            }
          : null),
      }}
      className={`transition-all will-change-[transform,opacity] motion-reduce:transition-none ${
        isRevealed
          ? "opacity-100 translate-y-0 translate-x-0 scale-100 blur-0"
          : hidden
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
