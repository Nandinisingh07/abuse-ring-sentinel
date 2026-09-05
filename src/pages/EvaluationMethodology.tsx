import React from 'react';
import { HelpCircle, AlertTriangle, ShieldCheck, Calendar, Info } from 'lucide-react';

export default function EvaluationMethodology() {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-[26px] font-extrabold text-slate-100 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-brand-accent" /> Evaluation & Methodology
        </h1>
        <p className="text-sm text-slate-400 font-sans mt-1">
          Honest diagnostics on data splitting, graph features, and model limits.
        </p>
      </div>

      {/* Temporal Split Diagram */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-6 mb-8">
        <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-6 flex items-center gap-2">
          <Info className="h-4 w-4 text-brand-accent" /> Temporal Train/Test Split
        </h3>

        {/* Timeline Graphic */}
        <div className="relative flex flex-col md:flex-row items-center justify-between border border-brand-border bg-brand-bg/40 p-6 rounded-lg gap-6 md:gap-0 font-mono text-sm mb-6">
          {/* Train Phase */}
          <div className="flex-1 w-full text-center md:text-left md:pr-4">
            <span className="text-[13px] font-bold text-risk-low uppercase tracking-widest block">TRAIN PERIOD (Days 0 - 45)</span>
            <p className="text-slate-400 text-[14px] mt-2 leading-relaxed">
              Used to compile tabular features, construct the ring graph clusters, compute historical fraud rates, and train the risk classifier.
            </p>
          </div>

          {/* Split boundary line */}
          <div className="flex flex-col items-center justify-center border-t-2 border-dashed md:border-t-0 md:border-l-2 border-brand-border px-4 py-2 md:py-8 min-h-[50px] relative">
            <div className="absolute -top-3 md:-top-4 bg-brand-panel-light px-2 py-0.5 border border-brand-border rounded text-[12px] text-brand-accent font-bold">
              SPLIT BOUNDARY (DAY 45)
            </div>
          </div>

          {/* Test Phase */}
          <div className="flex-1 w-full text-center md:text-right md:pl-4">
            <span className="text-[13px] font-bold text-risk-review uppercase tracking-widest block">TEST PERIOD (Days 46 - 60)</span>
            <p className="text-slate-400 text-[14px] mt-2 leading-relaxed">
              New transactions evaluated by the model. Test nodes map to the established training clusters; no future data is leaked.
            </p>
          </div>
        </div>

        {/* Leakage Explanation */}
        <div className="p-4 bg-brand-bg/50 border border-brand-border rounded text-sm text-slate-300 leading-relaxed space-y-3">
          <h4 className="font-bold font-mono text-slate-200 uppercase text-[13px] text-brand-accent">Why Time-Based Splits are Critical</h4>
          <p>
            In standard machine learning, a random split (e.g. 80/20 train/test) is common. In graph-based models, however, **random splits cause severe data leakage**.
          </p>
          <p>
            If we randomly split transactions, test transactions would end up sharing device_ids or IP addresses with training transactions that occurred in the future. The graph would connect them, allowing the model to look forward in time. This creates artificially high precision/recall metrics (often 99%) that immediately crash in production because a live system cannot build edges to future transactions.
          </p>
          <p>
            By enforcing a **strict temporal split** at Day 45, we ensure that the model is only tested on newer transactions using clusters formed during the historical training period, providing a realistic evaluation of production performance.
          </p>
        </div>
      </div>

      {/* Limitations Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1 */}
        <div className="bg-brand-panel border border-brand-border rounded-lg p-6">
          <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-4 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-risk-review" /> Known Vulnerabilities & Concept Drift
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Fraud ring detection models face distinct vulnerabilities:
          </p>
          <ul className="space-y-3 text-[14px] text-slate-300 font-mono">
            <li className="flex items-start gap-2">
              <span className="text-risk-review font-bold">â€¢</span>
              <span><strong>Cold-Start Rings</strong>: If a completely new coordinated group forms with new device IDs and new IP pools, they have zero training connections. The model must rely solely on tabular features (amount/velocity) until reviews build connections.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-risk-review font-bold">â€¢</span>
              <span><strong>Camouflaged Fraudsters</strong>: Sophisticated rings buy or emulate genuine aged accounts and perform low-frequency, normal-looking transactions to slip under risk thresholds.</span>
            </li>
          </ul>
        </div>

        {/* Card 2 */}
        <div className="bg-brand-panel border border-brand-border rounded-lg p-6">
          <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-4 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-brand-accent" /> Mitigating via Human-in-the-Loop
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            These limitations are precisely why **CoFraud is strictly defense-only**.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed mt-3">
            If the system automatically blocked accounts:
          </p>
          <ul className="list-disc pl-5 text-[14px] text-slate-400 mt-2 space-y-1">
            <li>It would create massive false positive costs, blocking genuine customers due to shared public IP addresses (e.g. coffee shops or offices).</li>
            <li>It would fail to adapt to new camouflage techniques.</li>
          </ul>
          <p className="text-sm text-slate-400 leading-relaxed mt-3">
            By routing flags to manual reviewers, we maintain high defensive isolation without introducing friction for legitimate customers.
          </p>
        </div>
      </div>
    </div>
  );
}
