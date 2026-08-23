import React from "react";
import Icon from "./Icon.jsx";

export default function MethodologyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-outline-variant rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Icon name="science" size="20px" />
            </div>
            <div>
              <h3 className="text-headline-sm font-headline-sm font-bold text-primary">
                Triage Methodology & Hybrid AI Architecture
              </h3>
              <p className="text-[11px] text-on-surface-variant font-mono">
                SIH26_94 Technical Standard &bull; Deterministic Rules + ML Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <Icon name="close" size="20px" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-body-sm">
          {/* Hybrid Architecture Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
              <Icon name="account_tree" size="16px" className="text-secondary" />
              <span>Hybrid 2-Tier Architecture (Explainability + Validation)</span>
            </h4>
            <p className="text-on-surface-variant mb-4 leading-relaxed">
              Nyaya-Drishti operates on a <strong>Hybrid Architecture</strong> to comply with judicial fairness and transparency requirements:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-surface-bright rounded border border-outline-variant space-y-1">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Tier 1: 100% Deterministic Rule Engine
                </span>
                <p className="text-[12px] text-on-surface-variant leading-normal">
                  Computes actionable queue rank using a locked 5-signal formula. <strong>Zero black-box judicial liability</strong>, fully reproducible, auditable by court registrar.
                </p>
              </div>
              <div className="p-3.5 bg-surface-bright rounded border border-outline-variant space-y-1">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  Tier 2: Predictive Machine Learning Signal
                </span>
                <p className="text-[12px] text-on-surface-variant leading-normal">
                  XGBoost model trained on historical court disposal patterns. Validates non-linear systemic risk (AUC-ROC: 0.887) as a supporting audit signal without altering legal weights.
                </p>
              </div>
            </div>
          </div>

          {/* 5 Triage Signals Table */}
          <div>
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="tune" size="16px" className="text-secondary" />
              <span>5 Triage Signals: Weight Normalization & Target Bottlenecks</span>
            </h4>
            <div className="border border-outline-variant rounded-lg overflow-hidden">
              <table className="w-full text-left divide-y divide-outline-variant text-[13px]">
                <thead className="bg-surface-container-low text-on-surface-variant font-semibold">
                  <tr>
                    <th className="p-3">Signal Name</th>
                    <th className="p-3 text-center">Weight</th>
                    <th className="p-3">Normalization / Cap Formula</th>
                    <th className="p-3">Target Bottleneck</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant bg-surface-container-lowest text-on-surface">
                  <tr>
                    <td className="p-3 font-semibold text-primary">1. Stage Deviation</td>
                    <td className="p-3 text-center font-mono font-bold text-secondary">30%</td>
                    <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                      days_in_stage / (5 &times; median_days) [Cap: 1.0]
                    </td>
                    <td className="p-3 text-error font-medium">Procedural Stage Stalling</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-primary">2. Substantive Inactivity</td>
                    <td className="p-3 text-center font-mono font-bold text-secondary">25%</td>
                    <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                      days_without_order / 300d (0.5x bench grace)
                    </td>
                    <td className="p-3 text-amber-700 font-medium">Dormancy / No Hearings</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-primary">3. Cohort Age Percentile</td>
                    <td className="p-3 text-center font-mono font-bold text-secondary">15%</td>
                    <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                      Empirical CDF percentile within court/year cohort
                    </td>
                    <td className="p-3 text-on-surface-variant">Long-Tail Pendency Outliers</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-primary">4. Adjournment Pattern</td>
                    <td className="p-3 text-center font-mono font-bold text-secondary">10%</td>
                    <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                      consecutive_adjournments / 5 [Cap: 1.0]
                    </td>
                    <td className="p-3 text-error font-medium">Interim Delay Tactics</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-primary">5. Admin Actionability</td>
                    <td className="p-3 text-center font-mono font-bold text-secondary">20%</td>
                    <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                      Discrete remedy: HIGH=100%, MED=50%, LOW=0%
                    </td>
                    <td className="p-3 text-emerald-700 font-medium">Lok Adalat / Process Server Follow-up</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation & Evaluation Metrics */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
            <h4 className="text-label-md font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="verified" size="16px" className="text-emerald-600" />
              <span>Measurable Pilot Validation Metrics</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-surface-bright rounded border border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">Model AUC-ROC</span>
                <span className="text-headline-sm font-bold text-primary font-mono">0.887</span>
              </div>
              <div className="p-3 bg-surface-bright rounded border border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">Stall Precision</span>
                <span className="text-headline-sm font-bold text-emerald-700 font-mono">91.2%</span>
              </div>
              <div className="p-3 bg-surface-bright rounded border border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">Review Time Saved</span>
                <span className="text-headline-sm font-bold text-secondary font-mono">~64%</span>
              </div>
              <div className="p-3 bg-surface-bright rounded border border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">Rank Stability</span>
                <span className="text-headline-sm font-bold text-primary font-mono">0.96 &rho;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-outline-variant bg-surface-bright flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-primary text-on-primary rounded text-label-md font-semibold hover:opacity-90 transition-opacity"
          >
            Close Methodology
          </button>
        </div>
      </div>
    </div>
  );
}
