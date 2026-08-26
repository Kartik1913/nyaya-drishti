import { useEffect, useRef, useState } from "react";

/**
 * Shared motion primitives for the landing experience.
 *
 * Everything here is hand-rolled on rAF + IntersectionObserver (no animation
 * library) to match the rest of the codebase, and every hook short-circuits
 * under `prefers-reduced-motion: reduce` so the page degrades to a static,
 * fully-readable document instead of a half-animated one.
 */

/** True when the user has asked the OS to reduce motion. Reacts to changes. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/**
 * Scroll progress (0..1) through a tall "scroll track" element that contains a
 * `position: sticky` stage. 0 = the track's top just hit the viewport top,
 * 1 = the track has been fully consumed and the sticky stage is about to
 * unstick. This is what makes a pinned scrollytelling section scrub.
 *
 * Returns [ref, progress]. Attach the ref to the track element.
 */
export function useTrackProgress(disabled = false) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (disabled) {
      setProgress(0);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      const rect = el.getBoundingClientRect();
      // Distance the track can travel before the sticky child unsticks.
      const travel = rect.height - window.innerHeight;
      const p = travel <= 0 ? 0 : -rect.top / travel;
      setProgress(Math.min(1, Math.max(0, p)));
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [disabled]);

  return [ref, progress];
}

/**
 * Normalized pointer position (-1..1 on both axes) relative to the viewport,
 * for gentle mouse-parallax tilt. Disabled on coarse-pointer (touch) devices
 * so it never competes with scroll gestures.
 */
export function usePointerTilt(disabled = false) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (disabled) {
      setTilt({ x: 0, y: 0 });
      return;
    }
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let ticking = false;
    let next = { x: 0, y: 0 };
    const onMove = (e) => {
      next = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setTilt(next);
        ticking = false;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [disabled]);

  return tilt;
}

/** Linear interpolation between a and b by t (t is expected 0..1). */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Clamp n into [min, max]. */
export const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/**
 * Remap `value` from the range [inMin, inMax] onto [outMin, outMax], clamped.
 * Used to drive one transform channel over a slice of the scroll track.
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  const t = clamp((value - inMin) / (inMax - inMin));
  return lerp(outMin, outMax, t);
}

/**
 * Opacity envelope for one "stage" of a scrollytelling sequence: fades in over
 * the first `fade` of [start, end], holds at 1, then fades out at the tail.
 * Lets several absolutely-stacked panels crossfade cleanly as you scroll.
 */
export function stageOpacity(progress, start, end, fade = 0.08) {
  if (progress < start - fade || progress > end + fade) return 0;
  if (progress < start) return clamp((progress - (start - fade)) / fade);
  if (progress > end) return clamp(1 - (progress - end) / fade);
  return 1;
}
