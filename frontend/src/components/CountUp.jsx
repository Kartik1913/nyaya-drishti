import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useScroll.js";

/**
 * Counts a number up from zero the first time it scrolls into view.
 *
 * Accepts messy display strings ("5.4 Crore+", "3,179 Real Records Audited",
 * "+312 Days") — it animates the first numeric run it finds and leaves the
 * surrounding prefix/suffix text intact, so it can be dropped straight onto
 * existing copy without reshaping the data.
 */
export default function CountUp({ value, duration = 1800, className = "" }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(String(value));
  const ref = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const raw = String(value);
    const match = raw.match(/([^\d.+-]*)([+-]?[\d,.]+)(.*)/s);

    if (reduced || !match) {
      setDisplay(raw);
      return;
    }

    const prefix = match[1] || "";
    const numeric = parseFloat(match[2].replace(/,/g, ""));
    const suffix = match[3] || "";

    if (!isFinite(numeric)) {
      setDisplay(raw);
      return;
    }

    const decimals = match[2].includes(".")
      ? match[2].split(".")[1].replace(/[^\d]/g, "").length
      : 0;

    const format = (n) =>
      decimals > 0
        ? n.toFixed(decimals)
        : Math.round(n).toLocaleString("en-IN");

    setDisplay(prefix + format(0) + suffix);

    const el = ref.current;
    if (!el) return;

    let frameId;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRun.current) return;
        hasRun.current = true;
        observer.unobserve(entry.target);

        const start = performance.now();
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          setDisplay(prefix + format(numeric * easeOut(t)) + suffix);
          if (t < 1) frameId = requestAnimationFrame(step);
        };
        frameId = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value, duration, reduced]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {display}
    </span>
  );
}
