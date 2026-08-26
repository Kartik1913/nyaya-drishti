import { useEffect, useRef, useState } from "react";
import Logo from "./Logo.jsx";

/**
 * "Entering the courtroom" — a full-screen ceremonial door-opening that plays
 * once as the user crosses into the authenticated workspace. Two heavy navy
 * doors with carved gold-inlaid panels and the Nyaya-Drishti mark split across
 * the seam; on cue they swing open on real 3D hinges while warm light floods
 * out from behind, revealing the dashboard mounted underneath this overlay.
 *
 * Everything is pure CSS/SVG — no images, no external assets — so it matches
 * the brand palette exactly and adds no payload.
 *
 * Design intent, so future edits keep the feel:
 *  - The doors must read as HEAVY. The swing uses a slow-in easing (inertia of
 *    mass) and the faces darken as they turn edge-on (less light catches them).
 *  - There is a beat of stillness first (the "hold") so the eye registers two
 *    doors and the whole logo before anything moves — the reveal only lands if
 *    you saw the closed state first.
 *  - It is always skippable (click / any key) and hard-capped in time, so it
 *    can never block a live demo. Reduced-motion collapses it to a short fade.
 *
 * Phases (ms from mount), driven by a tiny timeout state machine:
 *   hold   0    doors shut, seam glowing faintly — anticipation
 *   charge 220  seam + backlight surge, doors press in ~2px (loading the swing)
 *   open   520  doors swing (~950ms), light floods, dust drifts, logo parts
 *   clear  1350 overlay fades out, pointer-events off (dashboard fully visible)
 *   done   1750 onComplete → unmount
 */

// Flip this if the swing direction ever needs to reverse (doors currently open
// AWAY from the viewer — inner edges recede into the scene as light pours out).
const SWING_DEG = 108;

const HOLD = 220;
const OPEN = 520;
const CLEAR = 1350;
const DONE = 1750;

export default function CourtroomEntrance({ onComplete }) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [phase, setPhase] = useState("hold"); // hold → charge → open → clear → done
  const timers = useRef([]);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    timers.current.forEach(clearTimeout);
    onComplete?.();
  };

  useEffect(() => {
    if (reduced) {
      // Honest reduced-motion equivalent: a brief gold flash-to-clear, no swing.
      setPhase("open");
      const t = setTimeout(finish, 480);
      timers.current.push(t);
      return () => clearTimeout(t);
    }

    const schedule = (fn, at) => {
      const id = setTimeout(fn, at);
      timers.current.push(id);
    };
    schedule(() => setPhase("charge"), HOLD);
    schedule(() => setPhase("open"), OPEN);
    schedule(() => setPhase("clear"), CLEAR);
    schedule(finish, DONE);

    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip: jump straight to the cleared/revealed state and complete shortly after.
  const skip = () => {
    if (done.current || phase === "clear") return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("clear");
    const t = setTimeout(finish, 360);
    timers.current.push(t);
  };

  useEffect(() => {
    const onKey = () => skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const opening = phase === "open" || phase === "clear";
  const cleared = phase === "clear";
  const charged = phase !== "hold";

  return (
    <div
      role="presentation"
      onClick={skip}
      className="fixed inset-0 z-[200] overflow-hidden select-none cursor-pointer"
      style={{
        perspective: "1900px",
        perspectiveOrigin: "50% 46%",
        background: "#050b16",
        opacity: cleared ? 0 : 1,
        pointerEvents: cleared ? "none" : "auto",
        transition: "opacity 420ms ease-out",
      }}
      aria-label="Entering the workspace"
    >
      {/* Warm light room behind the doors — surges on charge, floods on open */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 48%, rgba(214,192,140,0.95) 0%, rgba(184,155,94,0.5) 26%, rgba(20,36,58,0.6) 55%, rgba(5,11,22,1) 80%)",
          opacity: opening ? 1 : charged ? 0.42 : 0.16,
          transform: opening ? "scale(1.15)" : "scale(1)",
          transition:
            "opacity 900ms ease-out, transform 1100ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />

      {/* God-rays fanning from the seam as it opens */}
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-screen"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 46%, transparent 0deg, rgba(214,192,140,0.16) 12deg, transparent 24deg, transparent 46deg, rgba(214,192,140,0.12) 58deg, transparent 72deg, transparent 120deg, rgba(214,192,140,0.14) 132deg, transparent 146deg, transparent 200deg, rgba(214,192,140,0.12) 214deg, transparent 228deg, transparent 300deg, rgba(214,192,140,0.15) 314deg, transparent 328deg)",
          opacity: opening ? 0.9 : 0,
          transition: "opacity 700ms ease-out 120ms",
        }}
      />

      {/* Drifting gold dust catching the light (near depth) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-screen animate-driftDust"
        style={{
          opacity: opening ? 0.5 : 0.15,
          transition: "opacity 800ms ease-out",
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 24% 30%, #F5E4B8 100%, transparent), radial-gradient(1px 1px at 68% 22%, #D6C08C 100%, transparent), radial-gradient(2px 2px at 82% 58%, #E8D3A0 100%, transparent), radial-gradient(1px 1px at 40% 74%, #D6C08C 100%, transparent), radial-gradient(1.5px 1.5px at 56% 44%, #F5E4B8 100%, transparent), radial-gradient(1px 1px at 12% 62%, #D6C08C 100%, transparent), radial-gradient(1px 1px at 90% 82%, #E8D3A0 100%, transparent)",
          backgroundSize: "100% 100%",
        }}
      />

      {/* The two doors */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        <Door
          side="left"
          swing={opening ? -SWING_DEG : 0}
          charged={charged}
          opening={opening}
        />
        <Door
          side="right"
          swing={opening ? SWING_DEG : 0}
          charged={charged}
          opening={opening}
        />
      </div>

      {/* Center seam — a blade of gold light that blooms as the doors part */}
      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: opening ? "34vw" : charged ? "10px" : "4px",
          background:
            "linear-gradient(to right, transparent, rgba(245,228,184,0.95) 42%, #FFF6DD 50%, rgba(245,228,184,0.95) 58%, transparent)",
          filter: `blur(${opening ? 26 : charged ? 5 : 2}px)`,
          opacity: cleared ? 0 : opening ? 1 : charged ? 0.95 : 0.5,
          transition:
            "width 900ms cubic-bezier(0.7,0,0.2,1), filter 900ms ease-out, opacity 500ms ease-out",
        }}
      />

      {/* Cinematic edge vignette to focus the eye centrally */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 46%, transparent 40%, rgba(5,11,22,0.6) 100%)",
          opacity: cleared ? 0 : 1,
          transition: "opacity 400ms ease-out",
        }}
      />

      {/* Skip affordance — quiet, bottom center */}
      <div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 font-label-md text-[10px] uppercase tracking-[0.3em] text-gold-light/50"
        style={{
          opacity: cleared ? 0 : 0.8,
          transition: "opacity 300ms ease-out",
        }}
      >
        Click to skip
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * One door leaf. Hinged on its OUTER edge (left door → left edge, right door →
 * right edge) so the inner edges — where the seam and the split logo live —
 * are what swing open. The face carries carved recessed panels with gold inlay,
 * a brushed vertical sheen, hinge-side ambient occlusion, and a bright inner-
 * edge light that reads as the gap where the room's light leaks through.
 */
function Door({ side, swing, charged, opening }) {
  const isLeft = side === "left";

  return (
    <div
      className="absolute top-0 h-full"
      style={{
        width: "50%",
        left: isLeft ? 0 : "50%",
        transformStyle: "preserve-3d",
        transformOrigin: isLeft ? "left center" : "right center",
        transform: `translateZ(0) rotateY(${swing}deg) ${
          charged && !opening ? "scale(0.996)" : "scale(1)"
        }`,
        transition:
          "transform 950ms cubic-bezier(0.62,0.02,0.2,1), scale 200ms ease-out",
        backfaceVisibility: "hidden",
        // Faces darken as they turn edge-on — less light catches a turning door.
        filter: `brightness(${opening ? 0.42 : 1})`,
        transitionProperty: "transform, filter",
        transitionDuration: "950ms, 950ms",
        transitionTimingFunction:
          "cubic-bezier(0.62,0.02,0.2,1), ease-in",
        willChange: "transform, filter",
      }}
    >
      {/* Base door slab */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, #0a1526 0%, #12233c 45%, #0d1a30 72%, #081120 100%)",
          boxShadow: isLeft
            ? "inset -1px 0 0 rgba(214,192,140,0.35), inset 8px 0 26px rgba(0,0,0,0.7)"
            : "inset 1px 0 0 rgba(214,192,140,0.35), inset -8px 0 26px rgba(0,0,0,0.7)",
        }}
      />

      {/* Brushed vertical sheen — suggests grain catching raking light */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 2px, transparent 7px)",
          maskImage:
            "linear-gradient(90deg, transparent, black 30%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 30%, black 70%, transparent)",
        }}
      />

      {/* Carved panels with gold inlay — two stacked recessed rectangles */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6%] py-[9%] px-[16%]">
        <DoorPanel />
        <DoorPanel small />
      </div>

      {/* Hinge-side ambient occlusion (outer edge sits deeper / darker) */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          width: "22%",
          [isLeft ? "left" : "right"]: 0,
          background: `linear-gradient(${
            isLeft ? "90deg" : "270deg"
          }, rgba(0,0,0,0.55), transparent)`,
        }}
      />

      {/* Inner-edge light — the bright seam of room-light leaking at the join */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          width: "14%",
          [isLeft ? "right" : "left"]: 0,
          background: `linear-gradient(${
            isLeft ? "270deg" : "90deg"
          }, rgba(245,228,184,0.9), rgba(214,192,140,0.25) 40%, transparent)`,
          opacity: charged ? 1 : 0.55,
          transition: "opacity 300ms ease-out",
          mixBlendMode: "screen",
        }}
      />

      {/* Half of the split logo mark, riding the inner edge of the door */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          [isLeft ? "right" : "left"]: 0,
          width: "min(30vh, 26vw)",
          height: "min(30vh, 26vw)",
          transform: `translate${isLeft ? "X(50%)" : "X(-50%)"} translateY(-50%)`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            clipPath: isLeft ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
            filter: `drop-shadow(0 0 ${
              charged ? 18 : 6
            }px rgba(214,192,140,0.85))`,
            transition: "filter 400ms ease-out",
          }}
        >
          <Logo variant="mark" className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

/** A single recessed, gold-trimmed panel carved into the door face. */
function DoorPanel({ small = false }) {
  return (
    <div
      className="w-full rounded-[3px]"
      style={{
        flex: small ? "0 0 30%" : "1 1 auto",
        border: "1px solid rgba(214,192,140,0.28)",
        background:
          "linear-gradient(135deg, #0c1830 0%, #0a1424 55%, #070f1c 100%)",
        boxShadow:
          "inset 2px 2px 8px rgba(0,0,0,0.75), inset -2px -2px 6px rgba(214,192,140,0.08), 0 1px 0 rgba(214,192,140,0.12)",
      }}
    >
      {/* Inner bevel line — a second, tighter gold rule for depth */}
      <div
        className="w-full h-full rounded-[2px]"
        style={{
          margin: 0,
          border: "1px solid rgba(214,192,140,0.12)",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
          transform: "scale(0.92)",
        }}
      />
    </div>
  );
}
