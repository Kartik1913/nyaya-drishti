import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import CountUp from "./CountUp.jsx";
import StatueScene3D from "./StatueScene3D.jsx";
import FilmGrain from "./FilmGrain.jsx";
import { armEntrance } from "../entrance/entrance.js";
import {
  useReducedMotion,
  useTrackProgress,
  usePointerTilt,
  mapRange,
  stageOpacity,
} from "../hooks/useScroll.js";

/**
 * Cinematic scrollytelling hero.
 *
 * The section is a tall scroll *track* containing a `sticky` viewport-height
 * *stage*. That pinning is what gives the statue ~1.6 viewports of scroll to
 * actually move through — the previous version tied its transform to raw
 * scrollY over a single viewport, so the motion had all but finished before
 * the image had even left the fold.
 *
 * Composition note: the statue sits on the RIGHT and the scrim runs
 * horizontally (navy → transparent, left → right) rather than vertically.
 * The old vertical stack of three dark gradients reached ~95% opacity by the
 * midpoint, which both drowned the photograph and left the copy floating on
 * flat black. Now the type always has solid navy behind it while the statue
 * stays fully lit and legible in its own column.
 */

const STAGES = [
  { start: 0.0, end: 0.24 },
  { start: 0.36, end: 0.6 },
  { start: 0.72, end: 1.0 },
];
const FADE = 0.09;

export default function JusticeHero({ src = "/lady-justice.avif" }) {
  const reduced = useReducedMotion();
  const [trackRef, progress] = useTrackProgress(reduced);
  const tilt = usePointerTilt(reduced);

  if (reduced) return <StaticHero src={src} />;

  const panelStyle = (i) => {
    const { start, end } = STAGES[i];
    return {
      opacity: stageOpacity(progress, start, end, FADE),
      transform: `translateY(${mapRange(
        progress,
        start - FADE,
        end + FADE,
        44,
        -44
      )}px)`,
      pointerEvents:
        stageOpacity(progress, start, end, FADE) > 0.6 ? "auto" : "none",
    };
  };

  const activeStage = STAGES.findIndex(
    (s) => progress >= s.start - FADE && progress <= s.end + FADE
  );

  return (
    <section
      ref={trackRef}
      className="relative w-full h-[220vh] md:h-[280vh] bg-navy"
      aria-label="Nyaya-Drishti introduction"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ---- Statue, rendered in real WebGL: the camera arcs around it
            (an actual orbit, not a flat CSS rotate) while a warm light
            sweeps across the surface — see StatueScene3D.jsx for why this
            replaced the previous CSS-transformed <img>. ---- */}
        <div aria-hidden="true" className="absolute inset-0 md:left-[30%]">
          <StatueScene3D
            src={src}
            progress={progress}
            tilt={tilt}
            className="w-full h-full"
          />
        </div>

        {/* ---- Scrims. Horizontal on desktop, vertical on mobile. ---- */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden md:block"
          style={{
            // Solid navy holds until 30% and stays >=0.94 through 44% — the
            // copy column ends near 43% at every supported width, so type is
            // always on an effectively opaque ground. Clears by 88% so the
            // lit figure (~65-85%) reads at full strength.
            background:
              "linear-gradient(to right, #0B1628 0%, #0B1628 30%, rgba(11,22,40,0.94) 44%, rgba(11,22,40,0.62) 58%, rgba(11,22,40,0.18) 74%, rgba(11,22,40,0) 88%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(to bottom, rgba(11,22,40,0.72) 0%, rgba(11,22,40,0.55) 30%, rgba(11,22,40,0.82) 62%, #0B1628 100%)",
          }}
        />
        {/* Cinematic edge vignette + blends into the nav above and section below */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 65% at 64% 44%, transparent 28%, rgba(11,22,40,0.55) 100%), linear-gradient(to bottom, rgba(11,22,40,0.9) 0%, transparent 18%), linear-gradient(to top, #0B1628 0%, rgba(11,22,40,0.5) 10%, transparent 26%)",
          }}
        />

        {/* ---- Gold dust foreground (near depth — drifts against the statue) ---- */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            transform: `translateY(${mapRange(progress, 0, 1, 0, 90)}px)`,
            backgroundImage:
              "radial-gradient(1.5px 1.5px at 20% 30%, #D6C08C 100%, transparent), radial-gradient(1px 1px at 70% 20%, #D6C08C 100%, transparent), radial-gradient(1.5px 1.5px at 85% 60%, #B89B5E 100%, transparent), radial-gradient(1px 1px at 40% 75%, #D6C08C 100%, transparent), radial-gradient(1px 1px at 60% 45%, #B89B5E 100%, transparent)",
          }}
        />

        {/* Film grain — cinematic texture over the navy hero */}
        <FilmGrain opacity={0.055} />

        {/* ---- Copy: three crossfading stages, always over solid navy ---- */}
        <div className="relative z-20 h-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex items-center">
          {/* Chapter rail */}
          <div
            aria-hidden="true"
            className="hidden md:flex flex-col gap-2 mr-8 shrink-0"
          >
            {STAGES.map((_, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full transition-all duration-500"
                style={{
                  height: activeStage === i ? 44 : 20,
                  background:
                    activeStage === i
                      ? "linear-gradient(to bottom, #D6C08C, #B89B5E)"
                      : "rgba(214,192,140,0.25)",
                }}
              />
            ))}
          </div>

          <div className="relative w-full md:w-[52%] h-[440px] md:h-[420px]">
            {/* Stage 1 — identity */}
            <div
              style={panelStyle(0)}
              className="absolute inset-0 flex flex-col justify-center gap-5"
            >
              <Eyebrow />
              <h1 className="font-display-lg text-[3.25rem] leading-[1.05] md:text-[5rem] md:leading-[0.98] text-white tracking-tight">
                Nyaya
                <span className="text-gold">-</span>Drishti
              </h1>
              <p className="font-body-lg text-xl md:text-2xl text-slate-200 max-w-xl">
                Intelligent triage for faster justice.
              </p>
              <p className="hidden sm:block font-body-md text-base text-slate-400 max-w-lg leading-relaxed">
                A deterministic, fully auditable triage engine for district
                court registries — built to find the cases that are stuck, and
                say exactly why.
              </p>
              <HeroActions />
            </div>

            {/* Stage 2 — the thesis */}
            <div
              style={panelStyle(1)}
              className="absolute inset-0 flex flex-col justify-center gap-4"
            >
              <span className="font-label-md text-label-md uppercase tracking-[0.22em] text-gold">
                The core idea
              </span>
              <p className="font-body-lg text-2xl md:text-3xl text-slate-300 leading-snug">
                Age tells you how long a case has waited.
              </p>
              <p className="font-display-lg text-3xl md:text-5xl text-gold-light leading-tight">
                Triage tells you why it is still waiting.
              </p>
              <p className="font-body-md text-base text-slate-400 max-w-lg leading-relaxed mt-2">
                Two cases filed the same week can look identical in a queue. One
                is waiting on a judge. The other is waiting on a summons nobody
                has chased for 287 days.
              </p>
            </div>

            {/* Stage 3 — proof + conversion */}
            <div
              style={panelStyle(2)}
              className="absolute inset-0 flex flex-col justify-center gap-6"
            >
              <span className="font-label-md text-label-md uppercase tracking-[0.22em] text-gold">
                Built for scale
              </span>
              <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-lg">
                <HeroStat value="5.4" suffix=" Cr+" label="Cases pending nationwide" />
                <HeroStat value="6" label="Deterministic engine layers" />
                <HeroStat value="100" suffix="%" label="Auditable, zero black box" />
              </div>
              <p className="font-body-md text-base text-slate-400 max-w-lg leading-relaxed">
                Every score decomposes into the exact arithmetic that produced
                it. No outcome prediction, no judge evaluation.
              </p>
              <HeroActions primaryLabel="Open the Dashboard" />
            </div>
          </div>
        </div>

        {/* ---- Scroll cue, only while the first stage is on screen ---- */}
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-500"
          style={{ opacity: progress < 0.06 ? 1 : 0 }}
        >
          <span className="font-label-md text-[10px] uppercase tracking-[0.3em] text-slate-400">
            Scroll
          </span>
          <span className="relative block w-[22px] h-[34px] rounded-full border border-gold/50">
            <span className="absolute left-1/2 top-2 -translate-x-1/2 w-[3px] h-[7px] rounded-full bg-gold animate-scrollCue" />
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Eyebrow() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-10 bg-gradient-to-r from-gold to-transparent" />
      <span className="font-label-md text-label-md uppercase tracking-[0.22em] text-gold">
        Smart India Hackathon 2026 · Team Diamond
      </span>
    </div>
  );
}

function HeroActions({ primaryLabel = "Enter the Dashboard" }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-2">
      <Link
        to="/"
        onClick={() => armEntrance()}
        className="group inline-flex items-center gap-2 bg-gradient-to-r from-gold-light to-gold text-navy font-bold px-7 py-3.5 rounded-md shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-gold/40 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
      >
        {primaryLabel}
        <Icon
          name="arrow_forward"
          size="18px"
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
      <a
        href="#technology"
        className="inline-flex items-center gap-2 text-slate-200 font-semibold px-5 py-3.5 rounded-md border border-white/20 hover:border-gold/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
      >
        How it works
      </a>
    </div>
  );
}

function HeroStat({ value, suffix = "", label }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display-lg text-3xl md:text-4xl text-white leading-none">
        <CountUp value={value} />
        <span className="text-gold">{suffix}</span>
      </span>
      <span className="font-body-sm text-[11px] md:text-xs text-slate-400 leading-snug">
        {label}
      </span>
    </div>
  );
}

/**
 * Reduced-motion hero: no pinning, no scrub, no crossfade — every stage's
 * content is present at once in normal document flow, which is the honest
 * static equivalent of the scrollytelling sequence.
 */
function StaticHero({ src }) {
  return (
    <section className="relative w-full bg-navy overflow-hidden py-20 md:py-28">
      <div
        aria-hidden="true"
        className="absolute inset-0 md:left-[38%]"
      >
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: "58% 40%" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, #0B1628 0%, #0B1628 30%, rgba(11,22,40,0.9) 46%, rgba(11,22,40,0.5) 66%, rgba(11,22,40,0.15) 100%)",
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col gap-6 md:w-[60%]">
        <Eyebrow />
        <h1 className="font-display-lg text-5xl md:text-7xl text-white tracking-tight">
          Nyaya<span className="text-gold">-</span>Drishti
        </h1>
        <p className="font-body-lg text-xl md:text-2xl text-slate-200">
          Intelligent triage for faster justice.
        </p>
        <div className="border-l-2 border-gold/50 pl-5 py-1">
          <p className="font-body-md text-lg text-slate-300">
            Age tells you how long a case has waited.
          </p>
          <p className="font-display-lg text-2xl md:text-3xl text-gold-light mt-1">
            Triage tells you why it is still waiting.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 max-w-lg">
          <HeroStat value="5.4" suffix=" Cr+" label="Cases pending nationwide" />
          <HeroStat value="6" label="Deterministic engine layers" />
          <HeroStat value="100" suffix="%" label="Auditable, zero black box" />
        </div>
        <HeroActions />
      </div>
    </section>
  );
}
