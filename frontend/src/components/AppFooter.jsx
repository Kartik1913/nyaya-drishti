import { Link } from "react-router-dom";

/**
 * Workspace footer.
 *
 * Previously claimed "© Judicial Infrastructure Services. Confidential &
 * Proprietary." alongside Privacy / Terms / Security Audit links that pointed
 * at anchors which don't exist. Both were misleading: there is no such company,
 * this is a student prototype, and none of those documents exist. Replaced with
 * statements that are true and destinations that actually resolve.
 */
export default function AppFooter() {
  return (
    <footer className="w-full py-4 px-margin-mobile md:px-margin-desktop bg-surface-container-lowest border-t border-outline-variant mt-auto text-body-sm font-body-sm text-on-surface-variant shrink-0">
      <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
        <span>
          Nyaya-Drishti &bull; Administrative triage prototype &bull; Built by
          Team&nbsp;Diamond for SIH26_94
        </span>
        <div className="flex items-center gap-5">
          <span className="font-evidence text-[11px] uppercase tracking-wider text-gold-dark">
            Synthetic case data
          </span>
          <Link
            to="/"
            className="hover:text-primary transition-colors underline-offset-2 hover:underline"
          >
            Public Overview
          </Link>
        </div>
      </div>
    </footer>
  );
}
