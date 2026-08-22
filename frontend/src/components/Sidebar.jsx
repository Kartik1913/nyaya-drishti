import { NavLink, Link, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { primaryNavItems, secondaryNavItems } from "../data/navigation.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { triggerReseedApi } from "../api/endpoints.js";
import { useState } from "react";

const linkBase =
  "flex items-center gap-3 px-4 py-2.5 text-body-sm font-body-sm transition-colors rounded mx-2";
const linkInactive =
  "text-on-surface-variant hover:bg-surface-container-highest";
const linkActive =
  "text-secondary font-bold bg-surface-container-high border-l-4 border-secondary";

function NavItem({ item }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? linkActive : linkInactive}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} filled={isActive} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedMsg, setReseedMsg] = useState(null);
  const [showReseedModal, setShowReseedModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleReseed = async () => {
    setReseedLoading(true);
    setReseedMsg(null);
    try {
      const res = await triggerReseedApi();
      setReseedMsg({
        type: "success",
        text: `Reseeded ${res.cases_loaded} cases successfully.`,
      });
      setTimeout(() => {
        setShowReseedModal(false);
        setReseedMsg(null);
        window.location.reload();
      }, 1500);
    } catch (err) {
      setReseedMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to reseed database",
      });
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant z-20"
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-outline-variant shrink-0">
          <Link
            to="/"
            className="block cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded overflow-hidden border border-outline-variant shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Nyaya-Drishti"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<span class="w-full h-full flex items-center justify-center text-primary font-bold text-lg">N</span>';
                  }}
                />
              </div>
              <div>
                <h1 className="text-headline-sm font-headline-sm font-bold text-primary leading-tight">
                  Nyaya-Drishti
                </h1>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  District Court Triage
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Primary Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
          {primaryNavItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </div>

        {/* Secondary Links */}
        <div className="border-t border-outline-variant py-2 flex flex-col gap-1">
          {secondaryNavItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`${linkBase} ${linkInactive}`}
            >
              <Icon name={item.icon} />
              {item.label}
            </a>
          ))}
        </div>

        {/* User footer */}
        <div className="border-t border-outline-variant px-4 py-4 shrink-0">
          {user && (
            <div className="mb-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0">
                <Icon name="account_circle" size="20px" className="text-on-surface-variant" />
              </div>
              <div className="min-w-0">
                <p className="text-body-sm font-body-sm font-semibold text-primary truncate">
                  {user.username}
                </p>
                <p className="text-[10px] uppercase font-mono text-on-surface-variant tracking-wider">
                  {user.role}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {user?.role === "admin" && (
              <button
                onClick={() => setShowReseedModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-outline-variant bg-surface hover:bg-surface-container-high text-label-md font-label-md text-on-surface-variant transition-colors cursor-pointer"
                title="Reset demo database"
              >
                <Icon name="refresh" size="14px" />
                <span>Reseed</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-outline-variant bg-surface hover:bg-error/5 hover:border-error/20 hover:text-error text-label-md font-label-md text-on-surface-variant transition-colors cursor-pointer"
              title="Sign out"
            >
              <Icon name="logout" size="14px" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Reseed Modal */}
      {showReseedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-headline-sm font-headline-sm text-primary flex items-center gap-2">
              <Icon name="refresh" />
              Reset Demo Database
            </h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
              This will wipe and re-load exactly{" "}
              <strong>1,000 synthetic cases</strong> and run the 6-layer triage
              engine to guarantee deterministic baseline demo scores (Alpha: 91.4,
              Beta: 14.7).
            </p>
            {reseedMsg && (
              <div
                className={`p-3 rounded text-body-sm font-body-sm flex items-center gap-2 ${
                  reseedMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-error/5 text-error border border-error/20"
                }`}
              >
                <Icon
                  name={reseedMsg.type === "success" ? "check_circle" : "error"}
                  size="16px"
                />
                <span>{reseedMsg.text}</span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={reseedLoading}
                onClick={() => setShowReseedModal(false)}
                className="px-4 py-2 text-body-sm font-body-sm text-on-surface-variant hover:bg-surface-container-high rounded border border-outline-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={reseedLoading}
                onClick={handleReseed}
                className="px-4 py-2 text-body-sm font-body-sm text-on-primary bg-primary hover:opacity-90 rounded transition-opacity flex items-center gap-2 cursor-pointer font-semibold"
              >
                {reseedLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Confirm Reseed"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
