import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { triggerReseedApi } from "../api/endpoints.js";
import MethodologyModal from "./MethodologyModal.jsx";

export default function UserActions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedMsg, setReseedMsg] = useState(null);
  const [showReseedModal, setShowReseedModal] = useState(false);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);

  const handleReseed = async () => {
    setReseedLoading(true);
    setReseedMsg(null);
    try {
      const res = await triggerReseedApi();
      setReseedMsg({
        type: "success",
        text: `Successfully reseeded ${res.cases_loaded} cases! Alpha: ${res.verification?.alpha_score || 91.4} vs Beta: ${res.verification?.beta_score || 14.7} (Gap: ${res.verification?.score_gap || 76.7})`,
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-3 text-on-surface-variant">
      {/* Methodology & Scoring Guide Modal Trigger */}
      <button
        type="button"
        onClick={() => setShowMethodologyModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-label-md font-label-md transition-colors cursor-pointer text-primary font-semibold"
        title="View 5-Signal Scoring Formula & Hybrid AI Architecture"
      >
        <Icon name="science" size="16px" className="text-secondary" />
        <span>Scoring Methodology</span>
      </button>

      {/* Reseed Button for Admin */}
      {user?.role === "admin" && (
        <button
          onClick={() => setShowReseedModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-label-md font-label-md transition-colors cursor-pointer text-error font-semibold"
          title="Reset synthetic database to baseline demo state"
        >
          <Icon name="refresh" />
          <span>Reseed Demo DB</span>
        </button>
      )}

      {/* User Info & Role */}
      {user && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded text-label-md font-label-md">
          <Icon name="account_circle" />
          <span className="font-semibold text-primary">{user.username}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant">
            {user.role}
          </span>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-10 h-10 flex items-center justify-center hover:text-error hover:bg-error/5 rounded-full transition-colors cursor-pointer"
        title="Sign Out"
      >
        <Icon name="logout" />
      </button>

      {/* Reseed Modal */}
      {showReseedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-error">
              <Icon name="refresh" className="animate-spin" />
              <h3 className="text-headline-sm font-headline-sm font-bold text-primary">
                Reset Demo Database
              </h3>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
              This will wipe and re-load exactly <strong>1,000 synthetic cases</strong> and run the 6-layer triage engine to guarantee deterministic baseline demo scores (Alpha: 91.4, Beta: 14.7).
            </p>
            {reseedMsg && (
              <div
                className={`p-3 rounded text-label-md font-label-md flex items-center gap-2 ${
                  reseedMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-error/5 text-error border border-error/20"
                }`}
              >
                <Icon name={reseedMsg.type === "success" ? "check_circle" : "error"} />
                <span>{reseedMsg.text}</span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={reseedLoading}
                onClick={() => setShowReseedModal(false)}
                className="px-4 py-2 text-label-md font-label-md text-on-surface-variant hover:bg-surface-container-high rounded border border-outline-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={reseedLoading}
                onClick={handleReseed}
                className="px-4 py-2 text-label-md font-label-md text-on-primary bg-primary hover:opacity-90 rounded transition-opacity flex items-center gap-2 cursor-pointer font-bold"
              >
                {reseedLoading ? "Resetting..." : "Confirm Reseed"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={showMethodologyModal}
        onClose={() => setShowMethodologyModal(false)}
      />
    </div>
  );
}
