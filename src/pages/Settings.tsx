import React from 'react';
import { Settings, Info, ShieldAlert, Cpu, Heart } from 'lucide-react';

interface SettingsProps {
  onNavigateToSimulator: () => void;
}

export default function SettingsPage({ onNavigateToSimulator }: SettingsProps) {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-[26px] font-extrabold text-slate-100 flex items-center gap-2">
          <Settings className="h-6 w-6 text-brand-accent" /> System Settings & Docs
        </h1>
        <p className="text-sm text-slate-400 font-sans mt-1">
          Operational configurations and documentation for CoFraud.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configurations Column */}
        <div className="bg-brand-panel border border-brand-border rounded-lg p-6 space-y-6">
          <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300">
            Active Parameters
          </h3>

          <div className="space-y-4 font-mono text-sm text-slate-400 leading-relaxed">
            <div className="p-4 bg-brand-bg border border-brand-border rounded">
              <span className="text-slate-500 block text-[11px] uppercase">Decision Threshold</span>
              <div className="text-xl font-bold text-slate-200 mt-1">Cost-Based Optimal</div>
              <p className="text-[12px] text-slate-500 mt-2">
                The decision threshold is set dynamically using the expected cost curve.
              </p>
              <button
                onClick={onNavigateToSimulator}
                className="w-full mt-4 py-2 bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent/25 text-brand-accent text-sm font-semibold rounded cursor-pointer transition-colors text-center"
              >
                Change in Cost Simulator
              </button>
            </div>

            <div className="p-4 bg-brand-bg border border-brand-border rounded">
              <span className="text-slate-500 block text-[11px] uppercase">Autonomic Safeguards</span>
              <div className="text-base font-bold text-slate-200 mt-1">DEFENSE ONLY</div>
              <p className="text-[12px] text-slate-500 mt-2">
                Auto-blocking is permanently disabled to prevent false positive customer attrition.
              </p>
            </div>
          </div>
        </div>

        {/* Documentation Column */}
        <div className="lg:col-span-2 bg-brand-panel border border-brand-border rounded-lg p-6 space-y-6">
          <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300">
            System Documentation
          </h3>

          <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
            <div>
              <h4 className="font-bold text-slate-200 text-base mb-2 uppercase tracking-wider text-brand-accent flex items-center gap-1.5">
                <Cpu className="h-4 w-4" /> Bipartite Graph Fusion
              </h4>
              <p className="text-slate-400">
                The core differentiator of **CoFraud** is its integration of graph features into standard tabular transactions. We construct a bipartite network linking accounts (nodes) via shared elements (edges) representing device fingerprint hashes, IP addresses, and billing addresses.
              </p>
              <p className="text-slate-400 mt-2">
                Graph community partitioning groups this global graph into localized fraud rings. We calculate density, count, and historical fraud rate features for each cluster, combining them with individual tabular properties to train our threat risk model.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-200 text-base mb-2 uppercase tracking-wider text-brand-accent flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> System Specification Reference
              </h4>
              <p className="text-slate-400">
                All features, parameters, cost curves, and decision thresholds are calibrated based on production evaluation splits and optimal risk-mitigation economics.
              </p>
              <ul className="list-disc pl-5 text-[14px] text-slate-400 mt-2 space-y-1">
                <li><strong>Operating Mode</strong>: Human-in-the-Loop Triage (defense-only, no auto-reject)</li>
                <li><strong>Objective</strong>: Minimize expected false positive customer friction while isolating multi-account fraud rings.</li>
                <li><strong>Architecture</strong>: Graph Analytics Engine, Threat Classifier, Risk Attribution Service, Audit Ledger, Real-time Dashboard.</li>
              </ul>
            </div>

            <div className="border-t border-brand-border pt-4 flex items-center justify-between text-slate-500 text-[13px] font-mono">
              <div className="flex items-center gap-1">
                CoFraud — Enterprise Risk Intelligence
              </div>
              <div>v1.0.0 (Production Build)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
