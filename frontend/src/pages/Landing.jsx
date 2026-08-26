import { useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import LandingNav from "../components/LandingNav.jsx";
import LandingFooter from "../components/LandingFooter.jsx";
import JusticeHero from "../components/JusticeHero.jsx";
import LayerStack3D from "../components/LayerStack3D.jsx";
import Logo from "../components/Logo.jsx";
import Reveal from "../components/Reveal.jsx";
import TiltCard from "../components/TiltCard.jsx";
import CountUp from "../components/CountUp.jsx";
import ScrollProgressBar from "../components/ScrollProgressBar.jsx";
import SplitText from "../components/SplitText.jsx";
import FilmGrain from "../components/FilmGrain.jsx";
import IntroReveal from "../components/IntroReveal.jsx";
import { armEntrance } from "../entrance/entrance.js";
import {
  valueProps,
  impactStats,
  engineLayers,
  userPersonas,
  problemStatements,
  triagePillars,
} from "../data/mockData.js";

/**
 * Section heading with an eyebrow, a word-by-word cascading title, and an
 * optional lead. The title cascades on its own (SplitText) while the eyebrow
 * and lead fade in around it, so the headline is the choreographed focal point
 * of each section rather than one flat block fade.
 */
function SectionHeading({ eyebrow, title, lead, dark = false, center = true }) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <Reveal variant="up">
          <div
            className={`flex items-center gap-3 mb-4 ${
              center ? "justify-center" : ""
            }`}
          >
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold" />
            <span className="font-label-md text-label-md uppercase tracking-[0.22em] text-gold">
              {eyebrow}
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-gold" />
          </div>
        </Reveal>
      )}
      <SplitText
        as="h2"
        text={title}
        className={`font-display-lg text-3xl md:text-5xl leading-tight ${
          dark ? "text-white" : "text-navy"
        }`}
      />
      {lead && (
        <Reveal variant="up" delay={120}>
          <p
            className={`font-body-lg text-base md:text-lg mt-4 leading-relaxed ${
              dark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            {lead}
          </p>
        </Reveal>
      )}
    </div>
  );
}

export default function Landing() {
  const stackRef = useRef(null);
  const focus = (i) => stackRef.current?.focusLayer(i);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <IntroReveal />
      <ScrollProgressBar />
      <LandingNav />

      <main className="flex-grow">
        {/* ============ HERO — pinned scrollytelling stage ============ */}
        <JusticeHero />

        {/* ============ VALUE PROPS ============ */}
        <section className="w-full bg-surface-container-low py-20 md:py-28 border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <SectionHeading
              eyebrow="What it does"
              title="Accelerating justice, one bottleneck at a time"
              lead="Core capabilities designed to clear administrative bottlenecks — not to second-guess the bench."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch mt-14 md:mt-20">
              {valueProps.map((v, i) => (
                <Reveal key={v.title} variant="rise" delay={i * 130}>
                  <TiltCard>
                    <div className="group relative bg-white border border-slate-200 p-8 md:p-10 rounded-xl flex flex-col h-full shadow-sm hover:shadow-xl hover:border-gold/40 transition-all duration-300 overflow-hidden">
                      {/* Angled gold corner accent */}
                      <span
                        aria-hidden="true"
                        className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-gold/20 to-transparent transition-all duration-500 group-hover:from-gold/40"
                        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
                      />
                      <div className="w-16 h-16 rounded-full bg-teal/10 text-teal-dark ring-4 ring-white shadow-sm flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-teal/20 group-hover:scale-110 group-hover:-rotate-6">
                        <Icon name={v.icon} size="32px" filled={true} />
                      </div>
                      <h3 className="font-headline-sm text-xl text-navy font-bold mb-3">
                        {v.title}
                      </h3>
                      <p className="font-body-md text-slate-600 leading-relaxed">
                        {v.body}
                      </p>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PROBLEM ============ */}
        <section id="problem" className="w-full py-20 md:py-28 bg-surface">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <Reveal variant="left" className="lg:col-span-5 lg:sticky lg:top-28">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-gold" />
                  <span className="font-label-md text-label-md uppercase tracking-[0.22em] text-gold">
                    The problem
                  </span>
                </div>
                <h2 className="font-display-lg text-3xl md:text-5xl text-navy leading-tight mb-5">
                  Justice doesn&rsquo;t only slow down in the courtroom.
                </h2>
                <p className="font-body-lg text-slate-600 text-lg leading-relaxed">
                  Cases stall on repeated adjournments, unserved summons, judge
                  transfers, and procedural gaps. In a first-in-first-out queue,
                  none of that is visible — a case needing real deliberation
                  looks identical to one waiting on a piece of paper.
                </p>
                <div className="rule-gold w-full mt-8" />
              </Reveal>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {problemStatements.map((p, i) => (
                  <Reveal key={p.title} variant="rise" delay={i * 110}>
                    <TiltCard max={5}>
                      <div className="group bg-white border border-slate-200 rounded-xl p-7 shadow-sm hover:shadow-lg hover:border-navy/20 transition-all duration-300 flex flex-col h-full">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-teal/10 group-hover:scale-105">
                          <Icon
                            name={p.icon}
                            className="text-navy transition-colors duration-300 group-hover:text-teal-dark"
                            size="26px"
                            filled={true}
                          />
                        </div>
                        <h3 className="font-headline-sm text-lg text-navy font-bold mb-2.5">
                          {p.title}
                        </h3>
                        <p className="font-body-md text-slate-600 leading-relaxed text-sm">
                          {p.body}
                        </p>
                      </div>
                    </TiltCard>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ IMPACT — angled navy band ============ */}
        <section
          id="impact"
          className="relative w-full bg-navy text-white pt-32 pb-32 md:pt-40 md:pb-40 -mt-10 overflow-hidden"
          style={{
            clipPath:
              "polygon(0 72px, 100% 0, 100% calc(100% - 72px), 0 100%)",
          }}
        >
          {/* Ambient gold glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 50% 50% at 50% 40%, rgba(184,155,94,0.16) 0%, transparent 70%)",
            }}
          />
          <FilmGrain opacity={0.05} />
          <div className="relative max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-14">
            <SectionHeading
              eyebrow="Why it matters"
              title="The scale of the problem"
              lead="Grounded in real published figures from NJDG and Data.gov.in — the case-level records in this prototype are synthetic."
              dark
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 w-full">
              {impactStats.map((s, i) => (
                <Reveal key={s.label} variant="rise" delay={i * 150}>
                  <div className="group flex flex-col gap-3 text-center px-4 relative">
                    <span className="font-display-lg text-4xl md:text-5xl text-white font-bold leading-none">
                      <CountUp value={s.value} />
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-px w-12 mx-auto bg-gold/60 transition-all duration-500 group-hover:w-24"
                    />
                    <span className="font-body-md text-sm md:text-base text-slate-400 leading-relaxed">
                      {s.label}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TECHNOLOGY — 3D engine showcase ============ */}
        <section
          id="technology"
          className="w-full bg-surface-container-lowest py-20 md:py-28 border-b border-outline-variant"
        >
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <SectionHeading
              eyebrow="How it works"
              title="A six-layer engine that never acts as a black box"
              lead="Every score decomposes into the exact deterministic arithmetic that produced it. No LLM, no opaque model, no outcome prediction."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mt-14 md:mt-20">
              {/* Dark inset stage holding the live 3D engine model */}
              <Reveal variant="left">
                <div className="relative rounded-2xl overflow-hidden bg-navy ring-1 ring-gold/20 shadow-2xl aspect-[4/3] lg:aspect-square">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 60% 60% at 50% 45%, rgba(184,155,94,0.18) 0%, transparent 70%)",
                    }}
                  />
                  <LayerStack3D
                    ref={stackRef}
                    className="absolute inset-0 w-full h-full"
                  />
                  {/* Legend for the animated bead — makes clear that the
                      travelling gold ember represents one case moving through
                      the pipeline. */}
                  <div className="absolute top-5 left-6 flex items-center gap-2 pointer-events-none">
                    <span className="relative inline-flex w-2.5 h-2.5">
                      <span className="absolute inset-0 rounded-full bg-gold animate-ping opacity-60" />
                      <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-gold-light shadow-[0_0_8px_rgba(214,192,140,0.9)]" />
                    </span>
                    <span className="font-label-md text-[10px] uppercase tracking-[0.18em] text-gold-light/90">
                      One case, six layers
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between gap-4 pointer-events-none">
                    <span className="font-label-md text-label-md uppercase tracking-[0.18em] text-gold-light/90">
                      Live engine model
                    </span>
                    <span className="font-body-sm text-[11px] text-slate-400 hidden md:inline">
                      Hover a layer · scroll to explode
                    </span>
                  </div>
                </div>
              </Reveal>

              {/* Layer list */}
              <div className="flex flex-col">
                {engineLayers.map((layer, index) => (
                  <Reveal key={layer.title} variant="right" delay={index * 90}>
                    <div
                      className="group flex items-start gap-5 py-5 border-b border-outline-variant/70 last:border-0 transition-all duration-300 hover:pl-2 hover:bg-navy/[0.03] rounded-sm cursor-default"
                      onMouseEnter={() => focus(index)}
                      onMouseLeave={() => focus(null)}
                      onFocus={() => focus(index)}
                      onBlur={() => focus(null)}
                      tabIndex={0}
                    >
                      <span className="font-mono text-sm font-bold text-gold-dark/70 pt-1 tabular-nums shrink-0 transition-colors duration-300 group-hover:text-gold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="w-11 h-11 rounded-lg bg-teal/10 text-teal-dark flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-teal/20 group-hover:scale-105">
                        <Icon name={layer.icon} size="22px" filled={true} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-headline-sm text-lg text-navy font-bold mb-1">
                          {layer.title}
                        </h3>
                        <p className="font-body-md text-slate-600 leading-relaxed text-sm">
                          {layer.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Safety pledge */}
            <Reveal variant="scale" className="mt-16">
              <div className="relative overflow-hidden bg-navy text-white px-8 py-7 rounded-2xl ring-1 ring-gold/25 shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-5 text-center md:text-left">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sheen"
                />
                <Icon
                  name="verified_user"
                  className="text-gold shrink-0"
                  size="36px"
                  filled={true}
                />
                <span className="font-label-md text-sm md:text-base tracking-wide uppercase relative">
                  <strong className="text-white font-bold">
                    Constitutionally safe by design:
                  </strong>{" "}
                  <span className="text-slate-300">
                    No outcome prediction. No judge evaluation. 100% auditable.
                  </span>
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ USERS — angled navy band ============ */}
        <section
          id="users"
          className="relative w-full bg-navy text-white pt-24 pb-20 md:pt-28 md:pb-28 overflow-hidden"
          style={{ clipPath: "polygon(0 56px, 100% 0, 100% 100%, 0 100%)" }}
        >
          {/* Ambient gold glow, same treatment as the other navy bands */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 55% 55% at 50% 30%, rgba(184,155,94,0.14) 0%, transparent 70%)",
            }}
          />
          {/* Slow-drifting gold dust — same material language as the hero,
              so the navy bands read as one consistent surface, not a plain
              color swap bolted onto a light-page template. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30 mix-blend-screen animate-driftDust"
            style={{
              backgroundImage:
                "radial-gradient(1.5px 1.5px at 15% 25%, #D6C08C 100%, transparent), radial-gradient(1px 1px at 65% 15%, #D6C08C 100%, transparent), radial-gradient(1.5px 1.5px at 82% 55%, #B89B5E 100%, transparent), radial-gradient(1px 1px at 35% 70%, #D6C08C 100%, transparent), radial-gradient(1px 1px at 55% 40%, #B89B5E 100%, transparent), radial-gradient(1px 1px at 92% 80%, #D6C08C 100%, transparent)",
              backgroundSize: "100% 100%",
            }}
          />
          <FilmGrain opacity={0.05} />
          <div className="relative max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-14">
            <SectionHeading
              eyebrow="Who it's for"
              title="Empowering court administration"
              lead="Three roles, one shared source of evidence."
              dark
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
              {userPersonas.map((p, i) => (
                <Reveal key={p.title} variant="rise" delay={i * 130}>
                  <TiltCard>
                    <div className="group relative bg-white border border-slate-200 p-8 rounded-xl flex flex-col gap-4 shadow-2xl shadow-black/30 hover:shadow-gold/20 hover:border-gold/40 transition-all duration-300 h-full overflow-hidden">
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-gold via-gold/40 to-transparent scale-y-0 origin-top transition-transform duration-500 group-hover:scale-y-100"
                      />
                      <div className="w-12 h-12 rounded-full bg-navy/5 flex items-center justify-center transition-transform duration-500 group-hover:rotate-12">
                        <Icon
                          name="account_circle"
                          size="26px"
                          className="text-navy"
                        />
                      </div>
                      <h3 className="font-headline-sm text-lg text-navy font-bold">
                        {p.title}
                      </h3>
                      <p className="font-body-md text-slate-600 leading-relaxed text-sm">
                        {p.body}
                      </p>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PILLARS ============ */}
        <section className="relative w-full py-20 md:py-28 bg-surface">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <SectionHeading
              eyebrow="The approach"
              title="Beyond simple sorting"
              lead="Detect, explain, prioritize — in that order, and always with the evidence attached."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-14 md:mt-20">
              {triagePillars.map((pillar, i) => (
                <Reveal key={pillar.title} variant="rise" delay={i * 140}>
                  <TiltCard max={6}>
                    <div className="group relative p-8 md:p-10 border border-outline-variant rounded-xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 h-full overflow-hidden">
                      <span
                        aria-hidden="true"
                        className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gold/5 transition-all duration-500 group-hover:bg-gold/15 group-hover:scale-125"
                      />
                      <span className="relative font-mono text-xs font-bold tracking-[0.2em] text-gold-dark uppercase">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="relative font-display-lg text-2xl md:text-3xl text-navy mt-3 mb-4">
                        {pillar.title}
                      </h3>
                      <p className="relative font-body-md text-slate-600 leading-relaxed">
                        {pillar.body}
                      </p>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA BAND — angled navy ============ */}
        <section
          className="relative w-full bg-navy text-white py-28 md:py-36 overflow-hidden"
          style={{ clipPath: "polygon(0 64px, 100% 0, 100% 100%, 0 100%)" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 60% at 50% 50%, rgba(184,155,94,0.2) 0%, transparent 70%)",
            }}
          />
          <FilmGrain opacity={0.05} />
          <div className="relative max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center flex flex-col items-center gap-7">
            <Reveal variant="scale">
              <Logo variant="mark" className="h-14 w-14 mx-auto" />
            </Reveal>
            <Reveal variant="up" delay={100}>
              <h2 className="font-display-lg text-3xl md:text-5xl text-white leading-tight">
                See the queue the way a registrar should.
              </h2>
            </Reveal>
            <Reveal variant="up" delay={200}>
              <p className="font-body-lg text-lg text-slate-300 max-w-2xl">
                Open the live prototype dashboard — 1,000 synthetic cases,
                scored, ranked, and fully explained.
              </p>
            </Reveal>
            <Reveal variant="up" delay={300}>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                <Link
                  to="/"
                  onClick={() => armEntrance()}
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-gold-light to-gold text-navy font-bold px-8 py-4 rounded-md shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                >
                  Enter the Dashboard
                  <Icon
                    name="arrow_forward"
                    size="20px"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-slate-200 font-semibold px-6 py-4 rounded-md border border-white/20 hover:border-gold/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                >
                  Sign in
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ TRUST ============ */}
        <section
          id="about"
          className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-20 md:py-28 text-center flex flex-col items-center gap-6"
        >
          <Reveal variant="scale" className="flex flex-col items-center gap-6">
            <Logo
              variant="full"
              className="mb-2 [&_span]:text-2xl [&_span]:text-navy"
            />
            <h2 className="font-display-lg text-2xl md:text-4xl text-navy max-w-3xl leading-tight">
              Supporting decisions, never replacing judgment.
            </h2>
            <p className="font-body-lg text-base md:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Nyaya-Drishti is an infrastructure layer. It surfaces critical
              information, organizes complex case loads, and highlights
              anomalies. The final decision always rests with the judicial
              officer. Our commitment is to clarity and evidence, not automated
              verdicts.
            </p>
            <div className="rule-gold w-40 mt-4" />
            <div className="font-label-md text-label-md text-on-surface-variant opacity-70 tracking-widest uppercase">
              Built by Team_Diamond &middot; SIH26_94
            </div>
          </Reveal>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
