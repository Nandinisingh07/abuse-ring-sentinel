import React, { useEffect, useState } from 'react';
import { api, BACKEND_URL } from '../api';
import { AuditLogEntrySchema } from '../types';
import { FileDown, Search, Filter, ShieldCheck, ClipboardList } from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntrySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const actionParam = selectedAction === 'ALL'
        ? undefined
        : (selectedAction as 'approve' | 'escalate' | 'dismiss');
      const searchParam = searchQuery ? searchQuery : undefined;
      const data = await api.getAuditLog(200, actionParam, searchParam);
      setLogs(data);
    } catch (err) {
      console.error("Error fetching audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction, searchQuery]);

  const handleExportCSV = async () => {
    try {
      // Check if backend is alive
      const check = await fetch(`${BACKEND_URL}/health`).catch(() => null);
      if (check && check.ok) {
        // Direct download from API
        window.open(api.getExportUrl(), '_blank');
      } else {
        // Client-side fallback download
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Log ID,Timestamp,User ID,Action,Reviewer,Risk Score,Cluster ID\n";

        logs.forEach(log => {
          csvContent += `"${log.id}","${log.timestamp}","${log.user_id}","${log.action}","${log.reviewer}","${log.risk_score}","${log.cluster_id}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "abuse_ring_sentinel_audit_log.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Error exporting CSV", err);
    }
  };

  return (
    <div className="page-container py-6">
      {/* Title */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-brand-accent" /> Security Audit Log
          </h1>
          <p className="text-sm text-slate-400 font-sans mt-1">
            Write-only ledger monitoring all manual reviewer decisions, approvals, and escalations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-brand-accent hover:bg-blue-600 text-slate-100 text-sm font-semibold font-mono rounded flex items-center gap-2 transition-colors cursor-pointer"
        >
          <FileDown className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-panel border border-brand-border rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search User ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-brand-bg border border-brand-border rounded text-sm text-slate-300 focus:outline-none focus:border-brand-accent font-mono w-48"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold font-mono text-slate-500 uppercase">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-brand-bg border border-brand-border rounded text-sm text-slate-300 px-2 py-1.5 focus:outline-none focus:border-brand-accent font-mono"
            >
              <option value="ALL">ALL ACTIONS</option>
              <option value="approve">APPROVE</option>
              <option value="dismiss">DISMISS</option>
              <option value="escalate">ESCALATE</option>
            </select>
          </div>
        </div>

        <div className="text-[13px] font-mono text-slate-500">
          Showing <span className="text-slate-300 font-bold">{logs.length}</span> audited events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-brand-panel border border-brand-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-brand-bg/50 text-slate-500 uppercase border-b border-brand-border">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">User ID</th>
                <th className="px-4 py-2.5">Action Taken</th>
                <th className="px-4 py-2.5">Reviewer ID</th>
                <th className="px-4 py-2.5 text-right font-mono">Score</th>
                <th className="px-4 py-2.5">Cluster ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    Reading ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No actions logged matching filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-bg/20 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-200">{log.user_id}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.action === "dismiss" ? "bg-btn-dismiss-bg text-btn-dismiss-text border border-btn-dismiss-border" :
                        log.action === "approve" ? "bg-btn-approve-bg text-btn-approve-text border border-btn-approve-border" :
                        "bg-btn-escalate-bg text-btn-escalate-text border border-btn-escalate-border"
                      }`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{log.reviewer}</td>
                    <td className="px-4 py-2.5 text-slate-200 font-bold text-right">{log.risk_score.toFixed(3)}</td>
                    <td className="px-4 py-2.5 text-slate-400">
                      Ring #{log.cluster_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
