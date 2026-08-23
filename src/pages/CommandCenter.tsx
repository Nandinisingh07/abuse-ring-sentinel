import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Users, AlertTriangle, Cpu, Radio, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { AccountSchema } from '../types';

interface CommandCenterProps {
  onNavigateToQueue: () => void;
  onSelectAccount: (id: string) => void;
}

export default function CommandCenter({ onNavigateToQueue, onSelectAccount }: CommandCenterProps) {
  const [stats, setStats] = useState({
    totalScored: 0,
    activeRings: 0,
    pendingReviews: 0,
    precision: 0.50,
    recall: 0.60
  });

  const [distribution, setDistribution] = useState({
    low: 0,
    review: 0,
    hold: 0
  });

  const [recentActivity, setRecentActivity] = useState<AccountSchema[]>([]);
  const [loading, setLoading] = useState(true);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [accounts, clusters, queue, metrics] = await Promise.all([
          api.getAccounts(),
          api.getClusters(),
          api.getReviewQueue(),
          api.getModelInsights()
        ]);

        // Calculate stats
        const activeRingsCount = clusters.filter(c => c.member_count > 1 && c.fraud_rate > 0).length;

        setStats({
          totalScored: accounts.length,
          activeRings: activeRingsCount,
          pendingReviews: queue.length,
          precision: metrics?.precision ?? 0.50,
          recall: metrics?.recall ?? 0.60
        });

        // Calculate distribution
        const lowCount = accounts.filter(a => a.risk_tier === "LOW").length;
        const reviewCount = accounts.filter(a => a.risk_tier === "REVIEW").length;
        const holdCount = accounts.filter(a => a.risk_tier === "HOLD").length;
        setDistribution({ low: lowCount, review: reviewCount, hold: holdCount });

        // Highest-risk accounts (accounts is already sorted by risk_score DESC by the backend)
        const recent = accounts.slice(0, 6);
        setRecentActivity(recent);
      } catch (err) {
        console.error("Error loading command center stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsMounted(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const totalDist = distribution.low + distribution.review + distribution.hold;
  const lowPct = totalDist > 0 ? (distribution.low / totalDist) * 100 : 0;
  const reviewPct = totalDist > 0 ? (distribution.review / totalDist) * 100 : 0;
  const holdPct = totalDist > 0 ? (distribution.hold / totalDist) * 100 : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Activity className="h-8 w-8 text-brand-accent animate-pulse" />
        <span className="text-base text-slate-400 font-mono">Querying security logs...</span>
      </div>
    );
  }

  return (
    <div className="page-container py-6">
      {/* System Status Strip */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-panel border border-brand-border rounded-lg mb-8 reveal ${isMounted ? 'is-visible' : ''}`}
        style={{ transitionDelay: '0ms' }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[14px] font-mono text-slate-300 font-medium">Sentinel Core: ACTIVE</span>
        </div>
        <div className="flex items-center gap-6 text-[13px] font-mono text-slate-500">
          <div>MODEL: <span className="text-slate-300">XGBoost-Louvain (v1.2.0)</span></div>
          <div>LAST RETRAIN: <span className="text-slate-300">Aug 22, 2026</span></div>
          <div>ENVIRONMENT: <span className="text-slate-300">Production</span></div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI 1 - Secondary (recedes) */}
        <div 
          className={`bg-brand-panel border border-brand-border/60 rounded-lg p-5 reveal ${isMounted ? 'is-visible' : ''}`}
          style={{ transitionDelay: '40ms' }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">Scored Accounts</span>
            <Users className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-[24px] font-bold text-slate-300 font-mono mb-1">{stats.totalScored}</div>
          <p className="text-[12px] text-slate-500">Total accounts analyzed in current temporal run</p>
        </div>

        {/* KPI 2 - Primary */}
        <div 
          className={`bg-brand-panel border border-brand-border rounded-lg p-5 reveal ${isMounted ? 'is-visible' : ''}`}
          style={{ transitionDelay: '80ms' }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Flagged Rings</span>
            <AlertTriangle className="h-4 w-4 text-risk-review" />
          </div>
          <div className="text-[32px] font-bold text-slate-100 font-mono mb-1">{stats.activeRings}</div>
          <p className="text-[12px] text-slate-500">Connected communities above risk threshold</p>
        </div>

        {/* KPI 3 - HERO ACTION (Dominant Focal Point) */}
        <button
          onClick={onNavigateToQueue}
          className={`bg-brand-panel border-2 border-risk-hold/30 shadow-[0_0_15px_rgba(239,68,68,0.03)] hover:border-risk-hold/60 rounded-lg p-5 text-left transition-all cursor-pointer group reveal ${isMounted ? 'is-visible' : ''}`}
          style={{ transitionDelay: '120ms' }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider group-hover:text-risk-hold transition-colors">Pending Reviews</span>
            <Activity className="h-4 w-4 text-risk-hold" />
          </div>
          <div className="text-[42px] font-extrabold text-slate-100 font-mono leading-none tracking-tight flex items-baseline gap-2">
            {stats.pendingReviews}
            <span className="text-[10px] bg-risk-hold/10 border border-risk-hold/20 px-1.5 py-0.5 rounded text-risk-hold font-mono font-bold uppercase tracking-wider">ACTION REQ</span>
          </div>
          <p className="text-[12px] text-slate-400 group-hover:text-slate-300 flex items-center gap-1 mt-2 transition-colors">
            Open review queue <ChevronRight className="h-3 w-3" />
          </p>
        </button>

        {/* KPI 4 - Secondary (recedes) */}
        <div 
          className={`bg-brand-panel border border-brand-border/60 rounded-lg p-5 reveal ${isMounted ? 'is-visible' : ''}`}
          style={{ transitionDelay: '160ms' }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">Precision / Recall</span>
            <Cpu className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-[24px] font-bold text-slate-300 font-mono mb-1">
            {Math.round(stats.precision * 100)}% / {Math.round(stats.recall * 100)}%
          </div>
          <p className="text-[12px] text-slate-500">Measured performance on temporal split test set</p>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Tier distribution & health */}
        <div 
          className={`lg:col-span-2 space-y-8 reveal ${isMounted ? 'is-visible' : ''}`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="bg-brand-panel border border-brand-border rounded-lg p-6">
            <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-6">
              Risk Tier Distribution
            </h3>

            {/* Visual stacked bar */}
            <div className="h-5 w-full bg-brand-bg rounded overflow-hidden flex mb-6">
              {lowPct > 0 && <div className="bg-risk-low h-full" style={{ width: `${lowPct}%` }} title={`Low Risk: ${distribution.low}`} />}
              {reviewPct > 0 && <div className="bg-risk-review h-full" style={{ width: `${reviewPct}%` }} title={`Review Required: ${distribution.review}`} />}
              {holdPct > 0 && <div className="bg-risk-hold h-full" style={{ width: `${holdPct}%` }} title={`Hold Status: ${distribution.hold}`} />}
            </div>

            {/* Labels Grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-brand-bg/50 border border-brand-border rounded">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-risk-low mr-1.5 align-middle" />
                <span className="text-sm text-slate-400 font-medium">LOW RISK</span>
                <span className="block text-xl font-mono font-bold text-slate-200 mt-1">{distribution.low}</span>
                <span className="text-[13px] text-slate-500 font-mono">{lowPct.toFixed(1)}%</span>
              </div>

              <div className="p-3 bg-brand-bg/50 border border-brand-border rounded">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-risk-review mr-1.5 align-middle" />
                <span className="text-sm text-slate-400 font-medium">REVIEW QUEUE</span>
                <span className="block text-xl font-mono font-bold text-slate-200 mt-1">{distribution.review}</span>
                <span className="text-[13px] text-slate-500 font-mono">{reviewPct.toFixed(1)}%</span>
              </div>

              <div className="p-3 bg-brand-bg/50 border border-brand-border rounded">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-risk-hold mr-1.5 align-middle" />
                <span className="text-sm text-slate-400 font-medium">HOLD ALERT</span>
                <span className="block text-xl font-mono font-bold text-slate-200 mt-1">{distribution.hold}</span>
                <span className="text-[13px] text-slate-500 font-mono">{holdPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Scoring Activity */}
        <div 
          className={`bg-brand-panel border border-brand-border rounded-lg p-6 reveal ${isMounted ? 'is-visible' : ''}`}
          style={{ transitionDelay: '240ms' }}
        >
          <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-6 flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-brand-accent animate-pulse" /> Highest Risk Accounts
          </h3>

          <div className="space-y-4">
            {recentActivity.map((act, rIdx) => (
              <button
                key={act.user_id}
                onClick={() => onSelectAccount(act.user_id)}
                className="w-full text-left p-3 bg-brand-bg/50 border border-brand-border hover:border-slate-700 rounded flex items-center justify-between transition-colors cursor-pointer group"
                style={{ animationDelay: `${rIdx * 30}ms` }}
              >
                <div>
                  <span className="block font-mono text-sm font-semibold text-slate-300 group-hover:text-brand-accent">
                    {act.user_id}
                  </span>
                  <span className="text-[13px] text-slate-500 font-mono">
                    Ring #{act.cluster_id} &middot; ${act.purchase_value.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-mono text-sm font-bold text-slate-300">
                    {act.risk_score.toFixed(3)}
                  </span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    act.risk_tier === "LOW" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                    act.risk_tier === "REVIEW" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                    "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}>
                    {act.risk_tier}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
