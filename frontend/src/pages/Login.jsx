import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Icon from "../components/Icon.jsx";
import logo from "../assets/logo.jpg";

const Login = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body-sm">
      {/* Prototype Notice Banner */}
      <div className="bg-[#7c4d00] border-b border-[#9a6300] px-4 py-2 text-xs text-[#ffe0b2] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5">
          <Icon name="shield" size="16px" className="text-[#ffb74d] shrink-0" />
          <span>
            <strong className="font-semibold uppercase tracking-wider text-[10px] bg-[#9a6300]/50 border border-[#ffb74d]/50 px-1.5 py-0.5 rounded mr-2">
              NON-JUDICIAL PROTOTYPE
            </strong>
            Administrative review triage only. Does{" "}
            <strong>NOT</strong> predict judicial outcomes. All case records are{" "}
            <strong>SYNTHETIC</strong>.
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg p-8 relative overflow-hidden">
            {/* Subtle gradient accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            {/* Logo + Title */}
            <div className="text-center mb-8 relative">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto flex items-center justify-center shadow-md mb-4 border border-outline-variant">
                <img src={logo} alt="Nyaya-Drishti Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-headline-sm font-headline-sm text-primary">
                Nyaya-Drishti
              </h1>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                District Court Pendency Triage System
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
                className="w-full bg-primary text-on-primary font-semibold py-3 rounded text-body-sm transition hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <Icon name="arrow_forward" size="18px" />
                  </>
                )}
              </button>
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
                  className="p-2.5 rounded bg-surface border border-outline-variant hover:bg-surface-container-low text-left transition cursor-pointer"
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
                  className="p-2.5 rounded bg-surface border border-outline-variant hover:bg-surface-container-low text-left transition cursor-pointer"
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
  );
};

export default Login;
