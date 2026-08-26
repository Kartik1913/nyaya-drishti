import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import Icon from "../components/Icon.jsx";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-6 relative overflow-hidden">
      {/* Ambient gold glow, on-brand rather than a stock 404 */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-gold/10 blur-3xl pointer-events-none"
      />

      <div className="relative flex flex-col items-center gap-4 opacity-0 animate-hero-fade-1">
        <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shadow-md mb-2 border border-outline-variant bg-navy">
          <Logo className="w-11 h-11" />
        </div>

        <p className="font-label-md text-label-md uppercase tracking-[0.3em] text-gold-dark font-bold">
          404 &middot; Off the Docket
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          This page couldn&rsquo;t be located
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          The page you&rsquo;re looking for doesn&rsquo;t exist, has moved, or
          was never filed. Let&rsquo;s get you back to the triage queue.
        </p>

        <Link
          to="/"
          className="mt-4 group bg-gradient-to-r from-gold to-gold-dark text-white px-6 py-3 rounded-md font-semibold font-label-md text-label-md transition-all duration-200 inline-flex items-center gap-2 hover:shadow-lg hover:shadow-gold/25 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Icon name="arrow_back" size="18px" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
