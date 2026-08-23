import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { AccountSchema, ClusterDetailSchema, SHAPLocalExplanation } from '../types';
import { Activity, ShieldAlert, CheckCircle, XCircle, AlertTriangle, ChevronRight, UserCheck, RefreshCw, Layers } from 'lucide-react';

interface ReviewQueueProps {
  selectedAccountId: string | null;
  onClearSelectedAccount: () => void;
}

export default function ReviewQueue({ selectedAccountId, onClearSelectedAccount }: ReviewQueueProps) {
  const [queue, setQueue] = useState<AccountSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAcc, setSelectedAcc] = useState<AccountSchema | null>(null);
  const [explanation, setExplanation] = useState<SHAPLocalExplanation | null>(null);
  const [clusterInfo, setClusterInfo] = useState<ClusterDetailSchema | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load review queue
  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewQueue();
      setQueue(data);
    } catch (err) {
      console.error("Error loading review queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // Handle selected account passed down from parent (Command Center or Ring Explorer)
  useEffect(() => {
    if (selectedAccountId) {
      handleSelectAccount(selectedAccountId);
      onClearSelectedAccount(); // Reset in parent so it doesn't re-trigger
    }
  }, [selectedAccountId]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectAccount = async (id: string) => {
    try {
      const details = await api.getAccountDetail(id);
      setSelectedAcc(details);
      setExplanation(details.shap_explanation ?? null);

      try {
        const cluster = await api.getClusterDetail(details.cluster_id);
        setClusterInfo(cluster);
      } catch {
        setClusterInfo(null);
      }
    } catch (err) {
      console.error("Error fetching account details", err);
      showToast("Failed to fetch account details", "error");
    }
  };

  const handleAction = async (action: 'approve' | 'dismiss' | 'escalate') => {
    if (!selectedAcc) return;
    try {
      const response = await api.submitReviewAction(selectedAcc.user_id, action);
      if (response.new_status) {
        showToast(`Account successfully logged as: ${action.toUpperCase()}`, 'success');
        setSelectedAcc(null);
        setExplanation(null);
        setClusterInfo(null);
        loadQueue(); // Refresh queue list
      }
    } catch (err) {
      console.error("Error submitting action", err);
      showToast("Error saving decision to audit log", "error");
    }
  };

  return (
    <div className="page-container py-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-lg border text-sm font-mono z-50 flex items-center gap-2 animate-bounce ${
          toast.type === 'success' ? 'bg-btn-dismiss-bg border-btn-dismiss-border text-btn-dismiss-text' :
          toast.type === 'error' ? 'bg-status-error-bg border-status-error-border text-status-error-text' :
          'bg-btn-approve-bg border-btn-approve-border text-btn-approve-text'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Title */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-[26px] font-extrabold text-slate-100 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-brand-accent" /> Human Review Queue
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Accounts flagged by the fusion model. No automatic blocking is allowed. Reviewer intervention required.
          </p>
        </div>
        <button
          onClick={loadQueue}
          className="p-2 bg-brand-panel hover:bg-brand-panel-light border border-brand-border rounded hover:text-brand-accent transition-colors cursor-pointer"
          title="Refresh Queue"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Grid: Queue Table & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table List */}
        <div className="lg:col-span-2 bg-brand-panel border border-brand-border rounded-lg overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono">
              <thead className="bg-brand-bg/50 text-slate-500 uppercase border-b border-brand-border">
                <tr>
                  <th className="px-4 py-2.5">User ID</th>
                  <th className="px-4 py-2.5 text-right font-mono">Risk Score</th>
                  <th className="px-4 py-2.5">Risk Tier</th>
                  <th className="px-4 py-2.5">Cluster</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                      Querying pending alerts...
                    </td>
                  </tr>
                ) : queue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 flex flex-col items-center gap-2 justify-center font-sans">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                      <div>No accounts pending review</div>
                      <span className="text-[13px] text-slate-500 font-mono">All flagged threats are currently mitigated.</span>
                    </td>
                  </tr>
                ) : (
                  queue.map((acc) => (
                    <tr
                      key={acc.user_id}
                      onClick={() => handleSelectAccount(acc.user_id)}
                      className={`hover:bg-brand-bg/40 cursor-pointer transition-colors ${
                        selectedAcc && selectedAcc.user_id === acc.user_id ? 'bg-brand-bg/60 border-l-2 border-brand-accent' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 font-semibold text-slate-200">{acc.user_id}</td>
                      <td className="px-4 py-2.5 text-slate-300 font-bold text-right">{acc.risk_score.toFixed(3)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          acc.risk_tier === "LOW" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                          acc.risk_tier === "REVIEW" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                          "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}>
                          {acc.risk_tier}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        Ring #{acc.cluster_id}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-600 inline-block" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-brand-bg/30 border-t border-brand-border text-[13px] text-slate-500 font-mono flex justify-between">
            <span>Pending Alerts: {queue.length}</span>
            <span>Risk manager context: DEFENSE MODE</span>
          </div>
        </div>

        {/* Detail Drawer (Right side) */}
        <div className="bg-brand-panel border border-brand-border rounded-lg p-6 min-h-[500px] h-full flex flex-col justify-between">
          {selectedAcc ? (
            <div className="space-y-6 flex-grow flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="border-b border-brand-border pb-4 mb-4">
                  <span className="text-[13px] font-bold font-mono text-brand-accent uppercase block">Review Detail</span>
                  <h3 className="font-mono text-base font-bold text-slate-200 mt-1 select-all">{selectedAcc.user_id}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-slate-400 font-mono">Score: <strong className="text-slate-200">{selectedAcc.risk_score.toFixed(3)}</strong></span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      selectedAcc.risk_tier === "LOW" ? "bg-risk-low/10 text-risk-low" :
                      selectedAcc.risk_tier === "REVIEW" ? "bg-risk-review/10 text-risk-review" :
                      "bg-risk-hold/10 text-risk-hold"
                    }`}>
                      {selectedAcc.risk_tier}
                    </span>
                  </div>
                </div>

                {/* Tabular summary */}
                <div className="mb-4">
                  <span className="text-[13px] font-bold font-mono text-slate-500 uppercase block mb-1.5">Tabular Features</span>
                  <div className="grid grid-cols-2 gap-2 text-[13px] font-mono">
                    <div className="p-2 bg-brand-bg/50 border border-brand-border rounded">
                      <span className="text-slate-500 block">CLUSTER SIZE</span>
                      <span className="text-slate-300 font-semibold">{selectedAcc.cluster_size} accounts</span>
                    </div>
                    <div className="p-2 bg-brand-bg/50 border border-brand-border rounded">
                      <span className="text-slate-500 block">GRAPH DEGREE</span>
                      <span className="text-slate-300 font-semibold">{selectedAcc.account_degree}</span>
                    </div>
                    <div className="p-2 bg-brand-bg/50 border border-brand-border rounded col-span-2">
                      <span className="text-slate-500 block">PURCHASE VALUE</span>
                      <span className="text-slate-300 font-semibold">${selectedAcc.purchase_value.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* SHAP Explanation Bar Chart */}
                <div className="mb-4">
                  <span className="text-[13px] font-bold font-mono text-slate-500 uppercase block mb-2">SHAP Explanations (Feature Impact)</span>
                  {explanation ? (
                    <div className="space-y-3">
                      {explanation.top_reasons.map((feat) => {
                        const val = feat.shap_value;
                        const positive = val > 0;
                        const pct = Math.min(100, Math.round(Math.abs(val) * 150));
                        return (
                          <div key={feat.feature} className="space-y-1 font-mono">
                            <div className="flex justify-between text-[12px] text-slate-400">
                              <span className="truncate max-w-[150px]">{feat.feature}</span>
                              <span className={positive ? "text-risk-hold font-bold" : "text-risk-low"}>
                                {positive ? "+" : ""}{val.toFixed(3)}
                              </span>
                            </div>

                            {/* Bar Graphic */}
                            <div className="h-2 w-full bg-brand-bg rounded overflow-hidden relative">
                              <div
                                className={`h-full rounded ${positive ? 'bg-risk-hold' : 'bg-risk-low'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-slate-500">Value: {feat.feature_value}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic py-2">No SHAP explanation available for this account.</div>
                  )}
                </div>

                {/* Shared Cluster Info */}
                {clusterInfo && (
                  <div>
                    <span className="text-[13px] font-bold font-mono text-slate-500 uppercase block mb-1.5">Cluster Ring Details</span>
                    <div className="p-2 bg-brand-bg/50 border border-brand-border rounded text-[13px] font-mono space-y-1 text-slate-300">
                      <div>RING ID: <span className="text-slate-100 font-bold">#{clusterInfo.cluster_id}</span></div>
                      <div>RING SIZE: <span className="text-slate-100">{clusterInfo.size} Accounts</span></div>
                      <div>HISTORICAL FRAUD: <span className="text-risk-hold">{(clusterInfo.fraud_rate * 100).toFixed(1)}%</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reviewer Decisions Panel (Defensive Action Only) */}
              <div className="border-t border-brand-border pt-4 mt-6">
                <span className="text-[13px] font-bold font-mono text-slate-500 uppercase block mb-3 text-center">Reviewer Decisioning</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAction('dismiss')}
                    className="py-2.5 bg-btn-dismiss-bg border border-btn-dismiss-border hover:bg-btn-dismiss-hover-bg text-btn-dismiss-text hover:text-btn-dismiss-hover-text rounded text-sm font-mono font-bold cursor-pointer transition-colors text-center"
                    title="Clear flags; mark as False Positive"
                  >
                    DISMISS
                  </button>
                  <button
                    onClick={() => handleAction('approve')}
                    className="py-2.5 bg-btn-approve-bg border border-btn-approve-border hover:bg-btn-approve-hover-bg text-btn-approve-text hover:text-btn-approve-hover-text rounded text-sm font-mono font-bold cursor-pointer transition-colors text-center"
                    title="Allow transaction to proceed"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => handleAction('escalate')}
                    className="py-2.5 bg-btn-escalate-bg border border-btn-escalate-border hover:bg-btn-escalate-hover-bg text-btn-escalate-text hover:text-btn-escalate-hover-text rounded text-sm font-mono font-bold cursor-pointer transition-colors text-center"
                    title="Escalate to Senior Risk Review"
                  >
                    ESCALATE
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 font-mono text-center mt-2.5">
                  WARNING: Action is irreversible. All updates append write-only rows to the Audit Log.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow text-center text-slate-500 p-4">
              <ShieldAlert className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-sm font-sans">
                Select a user ID from the list on the left to load its tabular logs, cluster features, and SHAP decisioning breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
