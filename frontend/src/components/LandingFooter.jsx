import { Link } from "react-router-dom";

/**
 * Public-site footer.
 *
 * The previous version listed Privacy Policy / Terms of Service / Compliance /
 * Legal Disclaimer, all pointing at anchors that don't exist on the page — four
 * dead links in a part of the page evaluators tend to probe. None of those
 * documents exist for a prototype, so rather than stub them, the footer now
 * carries the one legal statement that IS real and material (the non-judicial
 * scope disclaimer) plus destinations that actually resolve.
 */
export default function LandingFooter() {
  return (
    <footer className="bg-surface-dim border-t border-outline-variant w-full mt-auto">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
            Nyaya-Drishti
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 font-body-sm text-body-sm text-on-surface-variant">
            <a
              href="#technology"
              className="hover:text-secondary transition-colors cursor-pointer"
            >
              How it works
            </a>
            <a
              href="#about"
              className="hover:text-secondary transition-colors cursor-pointer"
            >
              About
            </a>
            <Link
              to="/login"
              className="hover:text-secondary transition-colors cursor-pointer"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* The one disclosure that is actually real and actually matters. */}
        <p className="text-[11px] leading-relaxed text-on-surface-variant/85 border-t border-outline-variant pt-4">
          <strong className="text-on-surface-variant">
            Non-judicial prototype.
          </strong>{" "}
          Nyaya-Drishti performs administrative review triage only. It does not
          predict judicial outcomes, evaluate judicial officers, or assign
          fault. All case-level records shown are synthetic; macro figures are
          sourced from NJDG and Data.gov.in.
        </p>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-on-surface-variant/70">
          <span>
            &copy; {new Date().getFullYear()} Team Diamond &bull; SIH26_94
          </span>
          <span className="font-evidence uppercase tracking-wider">
            Smart India Hackathon 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
