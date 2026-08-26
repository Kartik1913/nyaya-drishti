import { useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useScroll.js";

/**
 * A card that tilts in real 3D toward the cursor, with a gold specular
 * highlight that tracks the pointer. This is the interaction that makes the
 * content grids feel physical rather than like flat rectangles.
 *
 * Only `transform` and a radial-gradient overlay animate, so it stays on the
 * compositor. Touch devices and reduced-motion users get a plain static card
 * (the hover state is purely decorative — no information lives in it).
 */
export default function TiltCard({
  children,
  className = "",
  max = 7,
  glare = true,
}) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const [state, setState] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  const isTouch =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;
  const enabled = !reduced && !isTouch;

  const onPointerMove = (e) => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height;
    setState({
      rx: (0.5 - py) * max * 2,
      ry: (px - 0.5) * max * 2,
      gx: px * 100,
      gy: py * 100,
      active: true,
    });
  };

  const reset = () => setState((s) => ({ ...s, rx: 0, ry: 0, active: false }));

  return (
    <div
      style={{ perspective: "1000px" }}
      className={`h-full ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      <div
        ref={ref}
        style={{
          transformStyle: "preserve-3d",
          transform: enabled
            ? `rotateX(${state.rx}deg) rotateY(${state.ry}deg) translateZ(0) scale(${
                state.active ? 1.02 : 1
              })`
            : undefined,
          transition: state.active
            ? "transform 120ms ease-out"
            : "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="relative h-full will-change-transform"
      >
        {children}
        {glare && enabled && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
            style={{
              opacity: state.active ? 1 : 0,
              background: `radial-gradient(320px circle at ${state.gx}% ${state.gy}%, rgba(214,192,140,0.16), transparent 60%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
