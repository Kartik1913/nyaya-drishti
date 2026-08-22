import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import LandingNav from "../components/LandingNav.jsx";
import LandingFooter from "../components/LandingFooter.jsx";
import {
  valueProps,
  impactStats,
  engineLayers,
  userPersonas,
  problemStatements,
  triagePillars,
} from "../data/mockData.js";

function Reveal({ children, className = "", delay = 0 }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingNav />

      <main className="flex-grow pt-16 flex flex-col items-center">
        {/* Hero */}
        <section className="relative w-full min-h-[650px] flex flex-col items-center justify-center text-center overflow-hidden py-24 md:py-32">
          {/* Background Image */}
          <img
            src="/hero-bg.jpg"
            alt="Nyaya-Drishti Judicial Triage"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/65"></div>

          {/* Centered Content with Staggered Fade-In */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-4">
            <h1 className="text-5xl md:text-7xl font-display-lg text-white tracking-tight animate-hero-fade-1">
              Nyaya-Drishti
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 font-body-lg max-w-2xl animate-hero-fade-2">
              Intelligent Triage for Faster Justice.
            </p>
            <div className="animate-hero-fade-3">
              <Link
                to="/dashboard"
                className="bg-[#1D4ED8] hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-md transition-all duration-200 inline-flex items-center justify-center shadow-lg hover:shadow-blue-500/25"
              >
                Go to Dashboard
              </Link>
            </div>

            {/* Premium Glassmorphism Thesis Card */}
            <div className="animate-hero-fade-3 mt-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-8 py-5 shadow-2xl max-w-2xl text-center flex flex-col items-center justify-center">
                <p className="font-body-md text-slate-300 text-base md:text-lg">
                  Age tells you how long a case has waited.
                </p>
                <p className="font-headline-lg font-display-lg text-white font-bold text-xl md:text-2xl mt-1">
                  Triage tells you why it is still waiting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="w-full bg-surface-container-low py-16 md:py-24 border-t border-b border-outline-variant">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <Reveal className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
              <h2 className="font-headline-lg text-3xl md:text-4xl text-[#0F172A] font-bold">
                Accelerating Justice with AI
              </h2>
              <p className="font-body-md text-slate-500 text-base md:text-lg mt-3">
                Core capabilities designed to clear administrative bottlenecks.
              </p>
            </Reveal>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {valueProps.map((v, i) => (
                <Reveal key={v.title} delay={i * 150}>
                  <div className="group bg-white border border-slate-200 p-8 md:p-10 rounded-xl flex flex-col h-full shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1D4ED8] ring-4 ring-white shadow-sm flex items-center justify-center mb-6 group-hover:bg-blue-100/90 group-hover:scale-105 transition-all duration-300">
                      <Icon name={v.icon} size="32px" filled={true} />
                    </div>
                    <h3 className="font-headline-sm text-xl text-[#0F172A] font-bold mb-3">
                      {v.title}
                    </h3>
                    <p className="font-body-md text-slate-600 leading-relaxed">
                      {v.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Impact */}
        <section className="w-full bg-navy py-24 text-white" id="impact">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop text-center flex flex-col items-center gap-12">
            <Reveal>
              <h2 className="font-display-lg text-display-lg text-white">
                The Scale of the Problem
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full">
              {impactStats.map((s, i) => (
                <Reveal key={s.label} delay={i * 150}>
                  <div className="flex flex-col gap-2">
                    <span className="font-display-lg text-display-lg text-white font-bold">
                      {s.value}
                    </span>
                    <span className="font-body-lg text-body-lg text-gray-300">
                      {s.label}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Technology */}
        <section
          className="w-full bg-surface-container-lowest py-16 md:py-24 border-b border-outline-variant"
          id="technology"
        >
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-12">
            <Reveal className="text-center max-w-3xl">
              <h2 className="font-display-lg text-3xl md:text-5xl font-bold text-[#0F172A] mb-4">
                Technology Stack: The 6-Layer Triage Engine
              </h2>
              <p className="font-body-md text-slate-500 text-base md:text-lg">
                Built on a 6-layer triage engine that never acts as a black box.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
              {engineLayers.map((layer, index) => (
                <Reveal key={layer.title} delay={(index % 3) * 150}>
                  <div className="group bg-white border-t-4 border-[#0F172A] border-x border-b border-slate-200 rounded-b-xl rounded-t-sm p-8 flex flex-col justify-between h-full shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-in-out relative cursor-pointer">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-300">
                          <Icon name={layer.icon} size="28px" filled={true} />
                        </div>
                        <span className="text-4xl font-extrabold text-slate-200 group-hover:text-slate-300 font-mono transition-colors duration-300">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-xl text-[#0F172A] font-bold mt-6 mb-2">
                        {layer.title}
                      </h3>
                      <p className="font-body-md text-slate-600 leading-relaxed text-sm md:text-base">
                        {layer.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="w-full">
              <div className="mt-8 bg-[#0F172A] text-white px-8 py-6 rounded-2xl ring-4 ring-blue-50 shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
                <Icon name="verified_user" className="text-[#316BF3]" size="32px" filled={true} />
                <span className="font-label-md text-sm md:text-base tracking-wide uppercase">
                  <strong className="text-white font-bold">CONSTITUTIONALLY SAFE BY DESIGN:</strong>{" "}
                  <span className="text-slate-300">No outcome prediction. No judge evaluation. 100% auditable.</span>
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Users */}
        <section
          className="w-full bg-surface-container-low py-24 border-b border-outline-variant"
          id="users"
        >
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-12">
            <Reveal>
              <h2 className="font-display-lg text-display-lg text-primary text-center">
                Empowering Court Administration
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full">
              {userPersonas.map((p, i) => (
                <Reveal key={p.title} delay={i * 150}>
                  <div className="group bg-white border border-slate-200 p-8 rounded-xl flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                    <h3 className="font-headline-sm text-headline-sm text-[#0F172A] font-bold">
                      {p.title}
                    </h3>
                    <p className="font-body-md text-body-md text-slate-600 leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Problem statement */}
        <section className="w-full py-16 md:py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <Reveal className="max-w-3xl mb-16">
              <h2 className="font-headline-lg text-3xl md:text-5xl font-bold text-[#0F172A] mb-4">
                Justice doesn&rsquo;t only slow down in the courtroom.
              </h2>
              <p className="font-body-lg text-slate-600 text-lg leading-relaxed">
                Cases may remain unresolved because of repeated adjournments,
                unserved summons, judge transfers, procedural bottlenecks, and
                missing actions. These structural forms of delay create a
                complex landscape that resists simple solutions.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {problemStatements.map((p, i) => (
                <Reveal key={p.title} delay={i * 150}>
                  <div className="group bg-white border border-slate-200 rounded-lg p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col h-full cursor-pointer">
                    <div className="w-14 h-14 rounded-md bg-slate-100 flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-all duration-300">
                      <Icon name={p.icon} className="text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors duration-300" size="28px" filled={true} />
                    </div>
                    <h3 className="font-headline-sm text-xl text-[#0F172A] font-bold mb-3">
                      {p.title}
                    </h3>
                    <p className="font-body-md text-slate-600 leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>


        {/* Beyond simple sorting */}
        <section className="w-full py-stack-lg md:py-24 bg-surface border-t border-outline-variant">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <Reveal>
              <h2 className="font-headline-lg text-headline-lg md:text-display-lg md:font-display-lg text-primary mb-12 text-center">
                Beyond Simple Sorting
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {triagePillars.map((pillar, i) => (
                <Reveal key={pillar.title} delay={i * 150}>
                  <div className="p-8 border border-outline-variant rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow h-full">
                    <h4 className="font-headline-sm text-headline-sm text-[#0F172A] font-bold mb-4">
                      {pillar.title}
                    </h4>
                    <p className="font-body-md text-slate-600 leading-relaxed">
                      {pillar.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section
          className="w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg md:py-24 text-center flex flex-col items-center gap-stack-md"
          id="about"
        >
          <Reveal className="flex flex-col items-center gap-stack-md">
            <h2 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-primary max-w-3xl">
              Supporting Decisions, Never Replacing Judgment.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
              Nyaya is designed as an infrastructure layer. It surfaces
              critical information, organizes complex case loads, and
              highlights anomalies. The final decision always rests with the
              judicial officer. Our commitment is to clarity and evidence, not
              automated verdicts.
            </p>
            <div className="mt-8 font-label-md text-label-md text-on-surface-variant opacity-70">
              Built by Team_Diamond | SIH26_94
            </div>
          </Reveal>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
