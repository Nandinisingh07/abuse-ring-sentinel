import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import CommandCenter from './pages/CommandCenter';
import RingExplorer from './pages/RingExplorer';
import ReviewQueue from './pages/ReviewQueue';
import ModelInsights from './pages/ModelInsights';
import CostSimulator from './pages/CostSimulator';
import AuditLog from './pages/AuditLog';
import { api } from './api';
import {
  ShieldCheck,
  LayoutDashboard,
  Network,
  UserCheck,
  BarChart3,
  DollarSign,
  Calendar,
  ClipboardList,
  Settings,
  FileText,
  User
} from 'lucide-react';

type Tab =
  | 'overview'
  | 'command-center'
  | 'ring-explorer'
  | 'review-queue'
  | 'model-insights'
  | 'cost-simulator'
  | 'audit-log';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(new Set(['overview']));

  const switchTab = (tab: Tab) => {
    setVisitedTabs((prev) => new Set(prev).add(tab));
    setActiveTab(tab);
  };

  // Navigation passing state (e.g. click account in CC -> review queue details)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    document.documentElement.classList.remove('light');
  }, []);

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const data = await api.getReviewQueue();
        if (data && typeof data.length === 'number') {
          setPendingCount(data.length);
        }
      } catch (err) {
        console.error("Error fetching pending count for sidebar", err);
      }
    }
    fetchPendingCount();
    const timer = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(timer);
  }, []);

  const navigateToQueue = () => {
    switchTab('review-queue');
  };

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    switchTab('review-queue');
  };

  const menuItems = [
    { id: 'command-center', name: 'Command Center', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'ring-explorer', name: 'Ring Explorer', icon: <Network className="h-4 w-4" /> },
    { id: 'review-queue', name: 'Review Queue', icon: <UserCheck className="h-4 w-4" /> },
    { id: 'model-insights', name: 'Model Insights', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'cost-simulator', name: 'Cost Simulator', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'audit-log', name: 'Audit Log', icon: <ClipboardList className="h-4 w-4" /> }
  ];

  return (
    <div className="flex min-h-screen bg-brand-bg text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      {activeTab !== 'overview' && (
        <aside className="w-72 bg-brand-panel border-r border-brand-border flex flex-col justify-between shrink-0 h-screen overflow-y-auto">
          <div>
            {/* Logo Header - click to front door */}
            <div
              onClick={() => switchTab('overview')}
              className="p-6 border-b border-brand-border cursor-pointer hover:bg-brand-bg/30 transition-colors flex items-center gap-3"
              title="Go to Overview"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-brand-accent">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-extrabold text-base tracking-wider uppercase leading-none">CoFraud Core</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase mt-1 block">AI Risk Manager • 2026</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                const isQueue = item.id === 'review-queue';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      switchTab(item.id as Tab);
                      if (item.id !== 'review-queue') setSelectedAccountId(null);
                    }}
                    className={`w-full relative flex items-center justify-between py-2.5 px-3 rounded-lg text-[14px] font-semibold font-mono transition-all duration-150 cursor-pointer ${isActive
                        ? 'bg-brand-panel-light text-slate-100 border-l-[3px] border-brand-accent pl-[9px]'
                        : 'text-slate-400 border-l-[3px] border-transparent hover:bg-brand-bg/50 hover:text-slate-200 pl-[9px]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {React.cloneElement(item.icon, {
                        className: `h-[18px] w-[18px] transition-colors ${isActive ? 'text-brand-accent' : 'text-slate-400 group-hover:text-slate-200'
                          }`
                      })}
                      <span>{item.name}</span>
                    </div>
                    {isQueue && pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-brand-bg text-risk-hold border border-risk-hold/20 animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="border-t border-brand-border my-4" />

              <button
                onClick={() => setIsDocsOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-350 hover:bg-brand-bg/30 text-[14px] font-semibold font-mono transition-all duration-150 cursor-pointer pl-[12px]"
              >
                <FileText className="h-[18px] w-[18px]" />
                <span>Docs & Settings</span>
              </button>
            </nav>
          </div>

          {/* User profile footer - bottom anchored */}
          <div className="p-4 border-t border-brand-border bg-brand-bg/20 mt-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-xs font-mono">
                DU
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="block text-[13px] font-bold font-mono text-slate-300">Demo User</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="block text-[10px] font-mono text-slate-500">Reviewer (Lvl 1)</span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-w-0">
        {/* Top Header */}
        {activeTab !== 'overview' && (
          <header className="h-16 border-b border-brand-border bg-brand-panel px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 text-[14px] font-mono">
              <span className="text-slate-400">STATUS:</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-btn-dismiss-bg border border-btn-dismiss-border text-btn-dismiss-text text-[14px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-btn-dismiss-text animate-pulse" /> DEFENSIVE ISOLATION ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* System Docs & Settings Trigger */}
              <button
                onClick={() => setIsDocsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-brand-border bg-brand-bg hover:bg-brand-panel-light text-slate-300 hover:text-slate-100 text-xs font-semibold font-mono transition-colors cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-brand-accent" />
                <span>Docs & Settings</span>
              </button>
            </div>
          </header>
        )}

        {/* Page Render */}
        <div className="flex-grow overflow-y-auto">
          {visitedTabs.has('overview') && (
            <div className={activeTab === 'overview' ? '' : 'hidden'}>
              <LandingPage
                onStart={() => switchTab('command-center')}
                onNavigate={(tab) => switchTab(tab)}
              />
            </div>
          )}
          {visitedTabs.has('command-center') && (
            <div className={activeTab === 'command-center' ? '' : 'hidden'}>
              <CommandCenter
                onNavigateToQueue={navigateToQueue}
                onSelectAccount={handleSelectAccount}
              />
            </div>
          )}
          {visitedTabs.has('ring-explorer') && (
            <div className={activeTab === 'ring-explorer' ? '' : 'hidden'}>
              <RingExplorer />
            </div>
          )}
          {visitedTabs.has('review-queue') && (
            <div className={activeTab === 'review-queue' ? '' : 'hidden'}>
              <ReviewQueue
                selectedAccountId={selectedAccountId}
                onClearSelectedAccount={() => setSelectedAccountId(null)}
              />
            </div>
          )}
          {visitedTabs.has('model-insights') && (
            <div className={activeTab === 'model-insights' ? '' : 'hidden'}>
              <ModelInsights />
            </div>
          )}
          {visitedTabs.has('cost-simulator') && (
            <div className={activeTab === 'cost-simulator' ? '' : 'hidden'}>
              <CostSimulator />
            </div>
          )}
          {visitedTabs.has('audit-log') && (
            <div className={activeTab === 'audit-log' ? '' : 'hidden'}>
              <AuditLog />
            </div>
          )}
        </div>
      </main>

      {/* Slide-out Drawer: Documentation & Settings */}
      {isDocsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDocsOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-brand-panel border-l border-brand-border h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-brand-border mb-6">
                <h2 className="text-[20px] font-bold text-slate-100 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-brand-accent" /> System Settings & Docs
                </h2>
                <button
                  onClick={() => setIsDocsOpen(false)}
                  className="p-1.5 hover:bg-brand-bg rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              {/* Sections Container */}
              <div className="space-y-6">
                {/* 1. About the System */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider font-mono">1. About the System (Defense-Only)</h3>
                  <div className="p-4 bg-brand-bg/50 border border-brand-border rounded text-[13px] text-slate-350 space-y-2 leading-relaxed font-sans">
                    <p>
                      <strong>No Automatic Blocking</strong>: Flagged accounts are routed to human reviewers. Decisions are reviewed manually; the system never auto-rejects payments.
                    </p>
                    <p>
                      <strong>No Exploit or Attack Logic</strong>: Focuses strictly on pattern detection using user-supplied database exports. The backend contains no offensive scanning or data-scraping capabilities.
                    </p>
                    <p>
                      <strong>Full Audit Trail</strong>: Write-only log entries capture every review action, providing auditability and preventing arbitrary admin actions.
                    </p>
                  </div>
                </div>

                {/* 2. Methodology & Splits */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider font-mono">2. Evaluation Splits</h3>
                  <div className="p-4 bg-brand-bg/50 border border-brand-border rounded text-[13px] text-slate-355 space-y-2 leading-relaxed font-sans">
                    <p>
                      Evaluated under a strict <strong>Temporal Split</strong> at Day 45 (Train: Days 0-45; Test: Days 46-60). This prevents network link leakage in bipartite shared-attribute graphs.
                    </p>
                    <p className="text-slate-400 text-xs italic">
                      View complete diagrams and the leakage explanation under the "How We Evaluated This" tab in Model Insights.
                    </p>
                  </div>
                </div>

                {/* 3. Tech Stack */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider font-mono">3. System Architecture</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-brand-bg/60 border border-brand-border rounded">
                      <span className="block text-slate-500">Graph Layer</span>
                      <span className="text-slate-300 font-medium">Graph Analytics Engine</span>
                    </div>
                    <div className="p-2 bg-brand-bg/60 border border-brand-border rounded">
                      <span className="block text-slate-500">Classifier</span>
                      <span className="text-slate-300 font-medium">Gradient Risk Scorer</span>
                    </div>
                    <div className="p-2 bg-brand-bg/60 border border-brand-border rounded">
                      <span className="block text-slate-500">Explainability</span>
                      <span className="text-slate-300 font-medium">Risk Factor Attribution</span>
                    </div>
                    <div className="p-2 bg-brand-bg/60 border border-brand-border rounded">
                      <span className="block text-slate-500">API & DB</span>
                      <span className="text-slate-300 font-medium">Audit & Risk API</span>
                    </div>
                  </div>
                </div>

                {/* 4. Active Parameters & Profile */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-brand-accent uppercase tracking-wider font-mono">4. Parameters & Settings</h3>
                  <div className="p-4 bg-brand-bg/50 border border-brand-border rounded text-[13px] text-slate-350 space-y-3 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Decision Threshold</span>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">Cost-Based Optimal</div>
                      <button
                        onClick={() => {
                          switchTab('cost-simulator');
                          setIsDocsOpen(false);
                        }}
                        className="mt-2 text-brand-accent hover:underline text-xs font-semibold block text-left"
                      >
                        Adjust in Cost Simulator →
                      </button>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Active User Session</span>
                      <div className="text-slate-300 font-semibold mt-0.5">Demo User (Clearance Level 1)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-brand-border text-center text-xs text-slate-500 font-mono">
              CoFraud System Docs
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
