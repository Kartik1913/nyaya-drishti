import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useScroll.js";

/**
 * Headline that cascades in word by word when it scrolls into view. Each word
 * rises and settles with a small stagger, which reads as more crafted than a
 * single blanket fade on the whole line.
 *
 * Words wrap normally (each is an inline-block so it can transform without
 * breaking the line box), and under reduced motion the text is simply present.
 */
export default function SplitText({
  text,
  as: Tag = "h2",
  className = "",
  wordDelay = 55,
  startDelay = 0,
  duration = 620,
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          obs.unobserve(e.target);
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduced]);

  const words = String(text).split(" ");

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block whitespace-pre"
          style={
            reduced
              ? undefined
              : {
                  opacity: shown ? 1 : 0,
                  animation: shown
                    ? `wordRise ${duration}ms cubic-bezier(0.16,1,0.3,1) ${
                        startDelay + i * wordDelay
                      }ms both`
                    : "none",
                }
          }
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
