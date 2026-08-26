import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Icon from "../components/Icon.jsx";
import Logo from "../components/Logo.jsx";
import { armEntrance } from "../entrance/entrance.js";

const Login = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setWakingUp(false);

    // The API is hosted on a free-tier instance that sleeps after ~15 minutes
    // idle; the first request after that can take 15-30s to respond. Without
    // this, the button just spins with no explanation and people assume it's
    // broken and navigate away mid-request.
    const wakeTimer = setTimeout(() => setWakingUp(true), 3500);

    try {
      await login(username, password);
      armEntrance();
      navigate("/");
    } catch (err) {
      if (!err.response) {
        setError(
          "Couldn't reach the server. It may still be waking up from idle — please wait a moment and try again."
        );
      } else {
        setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
      }
    } finally {
      clearTimeout(wakeTimer);
      setWakingUp(false);
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-sm">
      {/* Prototype Notice Banner — navy + brand gold, matching the persistent
          DisclaimerBanner shown on every workspace page (was a raw muddy
          amber unrelated to the palette). */}
      <div className="bg-navy border-b border-gold/30 px-4 py-2 text-xs text-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5">
          <Icon name="shield" size="16px" className="text-gold-light shrink-0" />
          <span>
            <strong className="font-semibold uppercase tracking-wider text-[10px] bg-gold/20 text-gold-light border border-gold/40 px-1.5 py-0.5 rounded mr-2">
              NON-JUDICIAL PROTOTYPE
            </strong>
            Administrative review triage only. Does <strong>NOT</strong> predict
            judicial outcomes. Individual case records and event histories are
            synthetic prototypes structured using authentic eCourts metadata
            schemas and official NJDG/Data.gov.in statistical baselines.
          </span>
        </div>
      </div>

      {/* Main Content — split layout: brand/visual panel + functional form */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Visual panel (hidden on small screens, shown from md up) */}
        <div className="hidden md:flex md:w-1/2 lg:w-[45%] relative overflow-hidden bg-navy items-center justify-center">
          <img
            src="/lady-justice.avif"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-[center_18%] opacity-70"
            style={{ filter: "saturate(1.05) contrast(1.05) brightness(0.85)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, rgba(11,22,40,0.55) 0%, rgba(11,22,40,0.88) 55%, #0B1628 100%)",
            }}
          />
          {/* Angled gold accent line — sits low in the panel so it reads as a
              diagonal motif behind the copy rather than slashing through the
              brand lockup, which is what made the wordmark unreadable. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background:
                "linear-gradient(115deg, transparent 44%, rgba(184,155,94,0.18) 49%, rgba(214,192,140,0.32) 50%, rgba(184,155,94,0.18) 51%, transparent 56%)",
            }}
          />
          {/* Readability scrim directly behind the lockup — guarantees the
              wordmark clears the statue's highlights at any crop. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 52%, rgba(11,22,40,0.85) 0%, rgba(11,22,40,0.55) 45%, transparent 75%)",
            }}
          />

          <div className="relative z-10 max-w-md px-10 py-16 flex flex-col items-center text-center gap-6 opacity-0 animate-hero-fade-1">
            {/* Vertical brand lockup: mark above, wordmark below. The previous
                inline `variant="full"` lockup put a 2xl wordmark beside the
                mark inside a narrow centered column, so the text wrapped and
                collided with the mark. */}
            <div className="flex flex-col items-center gap-4">
              <Logo
                variant="mark"
                className="w-16 h-16 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
              />
              <div>
                <div className="font-headline-lg text-[32px] leading-none font-bold tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                  Nyaya<span className="text-gold-light">-</span>Drishti
                </div>
                <div className="mt-2.5 font-label-md text-[10px] uppercase tracking-[0.28em] text-gold-light/90">
                  District Court Triage
                </div>
              </div>
            </div>

            <span
              aria-hidden="true"
              className="h-px w-16 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
            />

            <h2 className="font-headline-lg text-headline-lg text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
              Intelligent triage for faster justice.
            </h2>
            <p className="font-body-md text-body-md text-slate-300">
              Deterministic, fully auditable case triage for district court
              registries &mdash; no black-box predictions, no outcome
              forecasting.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div className="w-full max-w-sm opacity-0 animate-hero-fade-2">
            {/* Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg p-8 relative overflow-hidden">
              {/* Subtle gradient accent */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

              {/* Logo + Title (mobile only — desktop shows the visual panel) */}
              <div className="text-center mb-8 relative md:hidden">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto flex items-center justify-center shadow-md mb-4 border border-outline-variant bg-navy">
                  <Logo className="w-11 h-11" />
                </div>
                <h1 className="text-headline-sm font-headline-sm text-primary">
                  Nyaya-Drishti
                </h1>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                  District Court Pendency Triage System
                </p>
              </div>

              {/* Title only, desktop */}
              <div className="hidden md:block mb-8">
                <h1 className="text-headline-sm font-headline-sm text-primary">
                  Welcome back
                </h1>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                  Sign in to the triage dashboard
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 p-3 rounded bg-error/5 border border-error/20 text-error text-body-sm flex items-center gap-2">
                  <Icon name="error" size="16px" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-label-md font-label-md text-on-surface-variant mb-2 uppercase tracking-wider"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <Icon
                      name="person"
                      size="18px"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                    <input
                      id="login-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full bg-surface border border-outline-variant rounded pl-10 pr-3 py-2.5 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-label-md font-label-md text-on-surface-variant mb-2 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Icon
                      name="lock"
                      size="18px"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-surface border border-outline-variant rounded pl-10 pr-3 py-2.5 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition"
                    />
                  </div>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-gold to-gold-dark text-white font-semibold py-3 rounded text-body-sm transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{wakingUp ? "Waking up server (~20s)…" : "Authenticating..."}</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <Icon name="arrow_forward" size="18px" />
                    </>
                  )}
                </button>
                {wakingUp && (
                  <p className="text-[11px] text-on-surface-variant text-center -mt-1">
                    First sign-in after a few idle minutes can take up to 30s while the free-tier API server restarts. Please don&rsquo;t refresh.
                  </p>
                )}
              </form>

              {/* Demo Quick Credentials */}
              <div className="mt-6 pt-6 border-t border-outline-variant">
                <div className="flex items-center gap-1.5 text-label-md font-label-md text-on-surface-variant mb-3">
                  <Icon name="verified_user" size="14px" />
                  <span>Demo Quick Credentials:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="quick-fill-admin"
                    type="button"
                    onClick={() => handleQuickFill("admin", "admin123")}
                    className="p-2.5 rounded bg-surface border border-outline-variant hover:bg-surface-container-low hover:border-gold/40 hover:-translate-y-0.5 text-left transition-all duration-150 cursor-pointer"
                  >
                    <div className="text-body-sm font-body-sm font-semibold text-primary">Admin Staff</div>
                    <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                      admin / admin123
                    </div>
                  </button>
                  <button
                    id="quick-fill-registry"
                    type="button"
                    onClick={() => handleQuickFill("registry", "registry123")}
                    className="p-2.5 rounded bg-surface border border-outline-variant hover:bg-surface-container-low hover:border-gold/40 hover:-translate-y-0.5 text-left transition-all duration-150 cursor-pointer"
                  >
                    <div className="text-body-sm font-body-sm font-semibold text-primary">Registry Staff</div>
                    <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                      registry / registry123
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center mt-6 space-y-2">
              <Link
                to="/landing"
                className="inline-flex items-center gap-1.5 text-body-sm font-medium text-secondary hover:underline"
              >
                <span>Explore Public Overview & Landing Page</span>
                <Icon name="arrow_forward" size="14px" />
              </Link>
              <p className="text-[11px] text-on-surface-variant">
                Nyaya-Drishti Prototype &bull; Purely Administrative Triage Demonstration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
