import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onNavigate?: (tab: 'command-center' | 'ring-explorer' | 'review-queue' | 'model-insights' | 'cost-simulator' | 'audit-log') => void;
}

export default function LandingPage({ onStart, onNavigate }: LandingPageProps) {
  const [activeStage, setActiveStage] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleNavigate = (tab: 'command-center' | 'ring-explorer' | 'review-queue' | 'model-insights' | 'cost-simulator' | 'audit-log') => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      onStart();
    }
  };

  const stages = [
    {
      id: 1,
      title: "Raw Transactions",
      shortDesc: "Inbound e-commerce transactions containing device_id, IP, and address.",
      details: [
        { label: "Data Inbound", value: "Transaction timestamps, payment methods, user IDs, raw network attributes, and device fingerprints." },
        { label: "Processing", value: "Structured validation and database schema logging." },
        { label: "Output", value: "Relational SQLite transactions table records." }
      ]
    },
    {
      id: 2,
      title: "Feature Extraction",
      shortDesc: "Simultaneous tabular feature computation and bipartite graph construction.",
      details: [
        { label: "Data Inbound", value: "SQLite transaction records." },
        { label: "Processing", value: "Bipartite shared-attribute graph linkages (matching device_ids and IP addresses). Modularity community partition detection via the Louvain algorithm to partition transaction nodes into communities (rings)." },
        { label: "Output", value: "Graph metrics per node (modularity classes, degree centrality, edge weights)." }
      ]
    },
    {
      id: 3,
      title: "Fusion Model",
      shortDesc: "XGBoost classifier scores accounts using both tabular & graph features.",
      details: [
        { label: "Data Inbound", value: "Tabular transaction features and graph node community attributes." },
        { label: "Processing", value: "XGBoost scoring combining local variables (amount, location) with network metrics (cluster size, cluster historical fraud rate)." },
        { label: "Output", value: "Precise continuous risk probability scores [0.0 - 1.0]." }
      ]
    },
    {
      id: 4,
      title: "SHAP Explainability",
      shortDesc: "Shapley Additive exPlanations breaks down the contributing features.",
      details: [
        { label: "Data Inbound", value: "Trained model parameters and scored prediction matrices." },
        { label: "Processing", value: "Local Shapley value calculation explaining the exact additive impact of tabular and network inputs." },
        { label: "Output", value: "Standardized feature contribution list showing why the transaction was scored high (e.g. shared device with known hold accounts)." }
      ]
    },
    {
      id: 5,
      title: "Human Review Queue",
      shortDesc: "Flagged rings are routed to reviewers. Strictly no auto-blocking.",
      details: [
        { label: "Data Inbound", value: "Scored transaction outputs and SHAP breakdowns." },
        { label: "Processing", value: "Categorization into LOW (Green), REVIEW (Orange), and HOLD (Red) risk tiers. Manual review triage queue routing." },
        { label: "Output", value: "Manual approve, escalate, or dismiss reviewer logs appended to the write-only ledger." }
      ]
    }
  ];

  const features = [
    {
      id: 'command-center',
      title: "Command Center",
      desc: "Live scoring activity, queue depth, and current model health at a glance.",
      cta: "Open Command Center →",
      tabId: 'command-center' as const,
      preview: (
        <div className="w-full h-full flex items-center justify-center p-4 bg-brand-bg/60 rounded">
          <div className="grid grid-cols-2 gap-2 w-full max-w-[220px]">
            <div className="p-2 border border-border-subtle rounded bg-bg-secondary flex flex-col justify-between h-[45px]">
              <span className="text-[8px] text-slate-500 font-mono">SCORED</span>
              <span className="text-xs font-bold font-mono text-slate-200 leading-none">500</span>
            </div>
            <div className="p-2 border border-border-subtle rounded bg-bg-secondary flex flex-col justify-between h-[45px]">
              <span className="text-[8px] text-slate-500 font-mono">RINGS</span>
              <span className="text-xs font-bold font-mono text-slate-200 leading-none">12</span>
            </div>
            <div className="p-2 border-2 border-risk-hold/30 rounded bg-bg-secondary flex flex-col justify-between h-[45px] relative overflow-hidden">
              <span className="text-[8px] text-risk-hold font-mono font-bold">REVIEWS</span>
              <span className="text-xs font-bold font-mono text-slate-100 leading-none flex items-center gap-1">
                4 <span className="text-[6px] px-1 bg-risk-hold/10 text-risk-hold rounded font-bold uppercase">REQ</span>
              </span>
            </div>
            <div className="p-2 border border-border-subtle rounded bg-bg-secondary flex flex-col justify-between h-[45px]">
              <span className="text-[8px] text-slate-500 font-mono">PREC/REC</span>
              <span className="text-xs font-bold font-mono text-slate-200 leading-none">82% / 91%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ring-explorer',
      title: "Ring Explorer",
      desc: "See which accounts are secretly connected through shared devices and IPs.",
      cta: "Explore clusters →",
      tabId: 'ring-explorer' as const,
      preview: (
        <div className="w-full h-full flex items-center justify-center bg-brand-bg/60 rounded relative overflow-hidden">
          <svg width="220" height="100" className="overflow-visible">
            <style>{`
              @keyframes drift1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(3px, -3px); } }
              @keyframes drift2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-3px, 4px); } }
              @keyframes drift3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(4px, 2px); } }
              .d1 { animation: drift1 4s ease-in-out infinite; }
              .d2 { animation: drift2 5s ease-in-out infinite; }
              .d3 { animation: drift3 6s ease-in-out infinite; }
            `}</style>
            <line x1="110" y1="50" x2="60" y2="30" stroke="var(--border-subtle)" strokeWidth="1" className="d1" />
            <line x1="110" y1="50" x2="160" y2="40" stroke="var(--border-subtle)" strokeWidth="1" className="d2" />
            <line x1="110" y1="50" x2="120" y2="85" stroke="var(--border-subtle)" strokeWidth="1" className="d3" />
            <line x1="60" y1="30" x2="80" y2="75" stroke="var(--border-subtle)" strokeWidth="1" className="d1" />
            <line x1="160" y1="40" x2="170" y2="75" stroke="var(--border-subtle)" strokeWidth="1" className="d2" />

            <circle cx="110" cy="50" r="7" fill="var(--risk-review)" className="d1" />
            <circle cx="60" cy="30" r="5" fill="var(--risk-low)" className="d2" />
            <circle cx="160" cy="40" r="6" fill="var(--risk-hold)" className="d3" />
            <circle cx="120" cy="85" r="5" fill="var(--risk-low)" className="d3" />
            <circle cx="80" cy="75" r="4" fill="var(--risk-low)" className="d1" />
            <circle cx="170" cy="75" r="5" fill="var(--risk-low)" className="d2" />
          </svg>
        </div>
      )
    },
    {
      id: 'review-queue',
      title: "Review Queue",
      desc: "Every flagged account, with the exact reason it was flagged.",
      cta: "See what's pending →",
      tabId: 'review-queue' as const,
      preview: (
        <div className="w-full h-full flex items-center justify-center p-3 bg-brand-bg/60 rounded">
          <div className="w-full max-w-[220px] border border-border-subtle rounded bg-bg-secondary overflow-hidden font-mono text-[9px] text-slate-400">
            <div className="grid grid-cols-3 gap-1 bg-brand-bg/40 p-1.5 border-b border-border-subtle text-slate-500 font-bold uppercase">
              <span>USER</span>
              <span className="text-right">SCORE</span>
              <span className="text-center">TIER</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1.5 border-b border-border-subtle/50 items-center">
              <span className="truncate text-slate-300">acc_928</span>
              <span className="text-right font-bold text-slate-350">0.941</span>
              <span className="flex justify-center"><span className="w-1.5 h-1.5 rounded-full bg-risk-hold" /></span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1.5 border-b border-border-subtle/50 items-center">
              <span className="truncate text-slate-300">acc_244</span>
              <span className="text-right font-bold text-slate-350">0.782</span>
              <span className="flex justify-center"><span className="w-1.5 h-1.5 rounded-full bg-risk-review" /></span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1.5 items-center">
              <span className="truncate text-slate-300">acc_109</span>
              <span className="text-right font-bold text-slate-350">0.114</span>
              <span className="flex justify-center"><span className="w-1.5 h-1.5 rounded-full bg-risk-low" /></span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'model-insights',
      title: "Model Insights",
      desc: "Precision, recall, and which features actually drive every decision.",
      cta: "Check the numbers →",
      tabId: 'model-insights' as const,
      preview: (
        <div className="w-full h-full flex items-center justify-center p-4 bg-brand-bg/60 rounded">
          <svg width="180" height="90" className="overflow-visible font-mono">
            <line x1="20" y1="10" x2="20" y2="80" stroke="var(--border-subtle)" strokeWidth="1.5" />
            <line x1="20" y1="80" x2="170" y2="80" stroke="var(--border-subtle)" strokeWidth="1.5" />
            <path d="M 20,20 Q 90,25 120,45 T 165,75" fill="none" stroke="var(--accent)" strokeWidth="2" />
            <circle cx="120" cy="45" r="3.5" fill="var(--risk-low)" />
            <text x="90" y="87" fill="#6B6B71" fontSize="7" textAnchor="middle">RECALL</text>
            <text x="8" y="45" fill="#6B6B71" fontSize="7" textAnchor="middle" transform="rotate(-90 8 45)">PRECISION</text>
          </svg>
        </div>
      )
    },
    {
      id: 'cost-simulator',
      title: "Cost Simulator",
      desc: "Move the threshold. Watch false-positive and false-negative cost trade off in real time.",
      cta: "Try the simulator →",
      tabId: 'cost-simulator' as const,
      preview: (
        <div className="w-full h-full flex items-center justify-center p-4 bg-brand-bg/60 rounded">
          <svg width="180" height="90" className="overflow-visible font-mono">
            <line x1="20" y1="10" x2="20" y2="80" stroke="var(--border-subtle)" strokeWidth="1.5" />
            <line x1="20" y1="80" x2="170" y2="80" stroke="var(--border-subtle)" strokeWidth="1.5" />
            <path d="M 30,20 Q 95,75 160,30" fill="none" stroke="#6B6B71" strokeWidth="1.5" />
            <circle cx="95" cy="75" r="4" fill="var(--risk-low)" />
            <text x="95" y="15" fill="var(--risk-low)" fontSize="7" textAnchor="middle">OPT THRESHOLD</text>
            <line x1="95" y1="20" x2="95" y2="70" stroke="var(--risk-low)" strokeWidth="0.5" strokeDasharray="2" />
          </svg>
        </div>
      )
    },
    {
      id: 'audit-log',
      title: "Audit Log",
      desc: "Every review decision, logged and exportable. Nothing happens without a trace.",
      cta: "View the log →",
      tabId: 'audit-log' as const,
      preview: (
        <div className="w-full h-full flex items-center justify-center p-3 bg-brand-bg/60 rounded">
          <div className="w-full max-w-[220px] border border-border-subtle rounded bg-bg-secondary overflow-hidden font-mono text-[9px] text-slate-400">
            <div className="grid grid-cols-3 gap-1 bg-brand-bg/40 p-1.5 border-b border-border-subtle text-slate-500 font-bold uppercase">
              <span>ACTION</span>
              <span className="text-right">TIME</span>
              <span className="text-right">USER</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1.5 border-b border-border-subtle/50 items-center">
              <span className="text-risk-low font-bold">APPROVE</span>
              <span className="text-right text-slate-500">19:24:02</span>
              <span className="text-right text-slate-300 truncate">acc_912</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1.5 border-b border-border-subtle/50 items-center">
              <span className="text-risk-hold font-bold">ESCALATE</span>
              <span className="text-right text-slate-500">19:22:15</span>
              <span className="text-right text-slate-300 truncate">acc_204</span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1.5 items-center">
              <span className="text-slate-400 font-bold">DISMISS</span>
              <span className="text-right text-slate-500">19:18:40</span>
              <span className="text-right text-slate-300 truncate">acc_482</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="page-container py-12 bg-brand-bg text-slate-300 select-none">

      {/* Section 1: Hero */}
      <div className="pt-24 pb-20 text-center flex flex-col items-center reveal" style={{ transitionDelay: '100ms' }}>
        <div className="text-[11px] font-bold tracking-[0.15em] text-brand-accent uppercase mb-6 font-mono">
          RAZORPAY AI BUILDATHON 2026 — AI RISK MANAGER TRACK
        </div>
        <h1 className="text-[48px] md:text-[64px] font-extrabold tracking-tight text-slate-100 leading-[1.1] mb-6 max-w-[640px] font-sans">
          Fraud rings hide in plain sight.
        </h1>
        <p className="text-[18px] md:text-[20px] text-slate-400 max-w-[600px] mx-auto leading-[1.5] font-sans mb-10">
          Abuse-Ring Sentinel finds accounts secretly connected through shared devices and IPs — and routes them to human review, never to auto-block.
        </p>
        <button
          onClick={onStart}
          className="px-8 py-3.5 bg-brand-accent hover:bg-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-[15px] shadow-[0_4px_16px_rgba(59,130,246,0.2)]"
        >
          Enter Command Center <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Section 2: The Explainer Line */}
      <div className="pb-16 text-center border-b border-brand-border reveal" style={{ transitionDelay: '150ms' }}>
        <p className="text-[15px] leading-[1.6] text-slate-400 max-w-[640px] mx-auto font-sans">
          No black-box scores. Every flag traces back to a specific shared device, a specific shared IP, and a specific cluster of accounts — reviewed by a human before anything happens.
        </p>
      </div>

      {/* Section 3: The Numbered Pipeline */}
      <div className="py-16 space-y-0 max-w-[720px] mx-auto">
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 font-mono mb-8 reveal">
          Operational Pipeline Stages
        </h2>

        {stages.map((stage, idx) => {
          const isOpen = activeStage === stage.id;
          return (
            <div
              key={stage.id}
              className="border-b border-brand-border py-8 reveal"
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <button
                onClick={() => setActiveStage(isOpen ? null : stage.id)}
                className="w-full text-left flex items-start gap-6 group cursor-pointer"
              >
                <div className="text-[32px] md:text-[40px] font-extrabold text-slate-600 font-mono leading-none tracking-tight group-hover:text-brand-accent transition-colors">
                  0{stage.id}
                </div>
                <div className="space-y-1.5 flex-grow">
                  <h3 className="text-[20px] font-bold text-slate-200 leading-tight group-hover:text-slate-100 transition-colors">
                    {stage.title}
                  </h3>
                  <p className="text-[14px] text-slate-400 leading-relaxed max-w-[550px]">
                    {stage.shortDesc}
                  </p>
                  <div className="text-[12px] text-brand-accent font-semibold flex items-center gap-1 mt-1 font-mono">
                    <span>{isOpen ? "Collapse specifications" : "View pipeline specifications"}</span>
                    <ChevronRight className={`h-3 w-3 transform transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                  </div>
                </div>
              </button>

              {/* Expandable Specifications Panel */}
              {isOpen && (
                <div className="mt-6 p-5 bg-brand-panel border border-brand-border rounded-lg space-y-4 font-mono text-[13px] animate-in fade-in slide-in-from-top-2 duration-200">
                  {stage.details.map((detail, dIdx) => (
                    <div key={dIdx} className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                        {detail.label}
                      </span>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Showcase Section (Visual Preview) */}
      <div className="py-24 border-t border-brand-border">
        <div className="mb-12 text-left max-w-[640px] reveal">
          <span className="text-[11px] font-bold tracking-[0.1em] text-brand-accent uppercase font-mono block mb-2">
            INSIDE THE SYSTEM
          </span>
          <h2 className="text-[26px] font-extrabold text-slate-100 mb-4 font-sans">
            Six views. One decision: review, not block.
          </h2>
          <p className="text-[15px] text-slate-400 leading-relaxed font-sans">
            Every screen below is live — the numbers are from a real model trained on real transaction data, not placeholders.
          </p>
        </div>

        {/* Feature Cards Grid (3 Columns Desktop, 1 Column Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={feat.id}
              onClick={() => handleNavigate(feat.tabId)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(feat.tabId); }}
              className="bg-brand-panel border border-brand-border rounded-xl p-6 flex flex-col justify-between transition-all duration-200 hover:border-brand-accent/40 hover:-translate-y-0.5 cursor-pointer group shadow-card reveal"
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <div>
                {/* Live Preview Wrapper - Fixed aspect ratio 16 / 10 */}
                <div
                  className="w-full bg-brand-bg rounded-lg overflow-hidden mb-5 border border-brand-border/60"
                  style={{ aspectRatio: '16/10' }}
                >
                  {feat.preview}
                </div>

                <h3 className="text-[17px] font-bold text-slate-200 mb-2 leading-snug group-hover:text-slate-100 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-[13px] text-slate-400 leading-relaxed mb-6 font-sans">
                  {feat.desc}
                </p>
              </div>

              <div className="text-[12px] text-brand-accent/80 group-hover:text-brand-accent font-semibold transition-colors font-mono mt-auto flex items-center gap-1">
                {feat.cta}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Compliance Block (Stipend-Style) */}
      <div className="py-16 text-center border-t border-brand-border reveal">
        <div className="text-[18px] font-bold text-slate-200 tracking-wide font-sans">
          Human review only &nbsp;&middot;&nbsp; Full audit trail &nbsp;&middot;&nbsp; Zero auto-block
        </div>
      </div>

      {/* Section 5: Final CTA */}
      <div className="pt-8 pb-24 text-center border-t border-brand-border flex flex-col items-center gap-6 reveal">
        <h3 className="text-[20px] font-bold text-slate-250 font-sans">
          See it flag a ring.
        </h3>
        <button
          onClick={onStart}
          className="px-8 py-3.5 bg-brand-accent hover:bg-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-[15px]"
        >
          Enter Command Center <ChevronRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
