import React from "react";
import Icon from "./Icon.jsx";

/**
 * Support / help surface.
 *
 * Replaces a dead "Support" nav link that pointed at "#". Rather than a
 * hollow "coming soon" page, this answers the questions an evaluator or
 * registry user actually hits while using the prototype: how do I sign in,
 * why is the first request slow, what am I allowed to conclude from these
 * numbers, and where do I read the methodology.
 *
 * Everything stated here is verifiable against the repository README and the
 * running system — no invented SLAs, no fake support desk, no phone number
 * that nobody answers.
 */

const CREDENTIALS = [
  { role: "Admin Staff", user: "admin", pass: "admin123", note: "Full access incl. database reseed" },
  { role: "Registry Staff", user: "registry", pass: "registry123", note: "Review access; reseed returns 403" },
];

const FAQS = [
  {
    q: "The first sign-in is taking 20–30 seconds. Is it broken?",
    a: "No. The API runs on a free-tier instance that sleeps after ~15 minutes idle. The first request wakes it, which takes up to 30 seconds. The sign-in button shows a “waking up server” message while this happens — please don’t refresh.",
  },
  {
    q: "Are these real court cases?",
    a: "No. Every case record, CNR number, and event history is synthetic, generated under procedural constraints. Only the macro figures (nationwide pendency, disposal times) come from published NJDG and Data.gov.in data, and those are labelled at the point of use.",
  },
  {
    q: "Does the score predict how a case will be decided?",
    a: "No — and it is designed so it cannot. The engine scores administrative actionability only: how stalled a case is and whether the blockage is something a registry can clear. It does not model merits, outcomes, or judicial performance.",
  },
  {
    q: "Why do two cases the same age have very different scores?",
    a: "That is the entire point of the system. Age alone doesn’t explain delay. A case waiting on an unserved summons for 287 days scores far higher than one progressing normally through evidence, because one has a clearable administrative blockage and the other does not.",
  },
  {
    q: "How is a score actually calculated?",
    a: "Five weighted signals: stage deviation (30%), substantive inactivity (25%), cohort age percentile (15%), adjournment pattern (10%), and administrative actionability (20%). Open “Scoring Methodology” in the header for the full formula and normalization rules.",
  },
];

export default function SupportModal({ isOpen, onClose }) {
  // Close on Escape — a modal that traps the user is worse than no modal.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface border border-outline-variant rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold-dark shrink-0">
              <Icon name="help" size="20px" />
            </div>
            <div>
              <h3
                id="support-modal-title"
                className="text-headline-sm font-headline-sm font-bold text-primary"
              >
                Support &amp; Usage Guide
              </h3>
              <p className="text-[11px] text-on-surface-variant font-evidence">
                Nyaya-Drishti prototype &bull; SIH26_94 &bull; Team Diamond
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors shrink-0"
          >
            <Icon name="close" size="20px" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-body-sm">
          {/* Demo credentials */}
          <section>
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="key" size="16px" className="text-gold-dark" />
              <span>Demo Sign-in</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CREDENTIALS.map((c) => (
                <div
                  key={c.user}
                  className="p-3.5 bg-surface-container-lowest rounded border border-outline-variant"
                >
                  <div className="font-semibold text-primary mb-1">{c.role}</div>
                  <div className="font-evidence text-[12px] text-on-surface-variant">
                    {c.user} / {c.pass}
                  </div>
                  <div className="text-[11px] text-on-surface-variant/80 mt-1.5 leading-snug">
                    {c.note}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-2.5 leading-relaxed">
              Both accounts are pre-filled by the quick-credential buttons on the
              sign-in screen.
            </p>
          </section>

          {/* FAQs */}
          <section>
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="quiz" size="16px" className="text-gold-dark" />
              <span>Common Questions</span>
            </h4>
            <div className="divide-y divide-outline-variant border border-outline-variant rounded-lg overflow-hidden bg-surface-container-lowest">
              {FAQS.map((f) => (
                <details key={f.q} className="group">
                  <summary className="px-4 py-3 cursor-pointer flex items-start justify-between gap-3 hover:bg-surface-container-low transition-colors list-none">
                    <span className="font-semibold text-primary leading-snug">
                      {f.q}
                    </span>
                    <Icon
                      name="expand_more"
                      size="18px"
                      className="text-on-surface-variant shrink-0 mt-0.5 transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="px-4 pb-4 -mt-0.5 text-on-surface-variant leading-relaxed">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Known limitations — stated plainly rather than hidden */}
          <section>
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="info" size="16px" className="text-gold-dark" />
              <span>Prototype Scope</span>
            </h4>
            <ul className="space-y-2 text-on-surface-variant leading-relaxed">
              <li className="flex gap-2.5">
                <Icon name="check_circle" size="16px" filled className="text-teal-dark shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">In scope:</strong> administrative
                  triage of pending cases, deterministic scoring, full evidence
                  trails, Lok Adalat candidate flagging.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="cancel" size="16px" filled className="text-error shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Out of scope:</strong> outcome
                  prediction, judge evaluation, merits assessment, or any use as
                  a substitute for judicial discretion.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="schedule" size="16px" filled className="text-gold-dark shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary">Not yet built:</strong> live
                  eCourts integration, multi-district rollout, and role
                  management beyond the two demo accounts above.
                </span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-outline-variant bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-on-surface-variant text-center sm:text-left">
            Full technical documentation lives in the project README.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-primary text-on-primary rounded text-label-md font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
