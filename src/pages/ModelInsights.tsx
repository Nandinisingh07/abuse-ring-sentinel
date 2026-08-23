
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Cpu, BarChart3, FileText } from 'lucide-react';

export default function ModelInsights() {
  const [metrics, setMetrics] = useState<any>(null);
  const [globalImportance, setGlobalImportance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ threshold: number; precision: number; recall: number } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'performance' | 'explainability' | 'evaluation'>('performance');

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const [metricsData, shapData] = await Promise.all([
          api.getModelInsights(),
          api.getShapGlobal(),
        ]);
        setMetrics(metricsData);
        setGlobalImportance(shapData.global_importance ?? []);
      } catch (err) {
        console.error("Error loading model metrics", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <Cpu className="h-8 w-8 text-brand-accent animate-pulse" />
        <span className="text-base text-slate-400 font-mono">Loading model intelligence...</span>
      </div>
    );
  }

  const { confusion_matrix, pr_curve } = metrics;

  const width = 300;
  const height = 200;
  const padding = 30;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const getCoords = (recall: number, precision: number) => {
    const x = padding + recall * chartWidth;
    const y = padding + (1 - precision) * chartHeight;
    return { x, y };
  };

  let pathD = "";
  if (pr_curve && pr_curve.length > 0) {
    const sortedPR = [...pr_curve].sort((a, b) => a.recall - b.recall);
    sortedPR.forEach((pt, idx) => {
      const { x, y } = getCoords(pt.recall, pt.precision);
      pathD += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
  }

  return (
    <div className="page-container py-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold text-slate-100 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-brand-accent" /> Model Insights & Diagnostics
        </h1>
        <p className="text-sm text-slate-400 font-sans mt-1">
          Diagnostics representing the temporal XGBoost + Louvain Graph fusion model.
        </p>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex gap-2 border-b border-brand-border mb-8">
        <button
          onClick={() => setActiveSubTab('performance')}
          className={`pb-2.5 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'performance'
              ? 'border-brand-accent text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-400'
          }`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveSubTab('explainability')}
          className={`pb-2.5 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'explainability'
              ? 'border-brand-accent text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-400'
          }`}
        >
          Explainability
        </button>
        <button
          onClick={() => setActiveSubTab('evaluation')}
          className={`pb-2.5 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'evaluation'
              ? 'border-brand-accent text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-400'
          }`}
        >
          How We Evaluated This
        </button>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PR Curve */}
          <div className="bg-brand-panel border border-brand-border rounded-lg p-6">
            <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-4">
              Precision-Recall Curve
            </h3>
            <p className="text-[13px] text-slate-400 mb-6 font-sans">
              Evaluated on the held-out temporal split. Hover over the curve points to check metrics at different thresholds.
            </p>
            <div className="relative flex justify-center bg-brand-bg/40 p-4 border border-brand-border rounded">
              <svg width={width} height={height} className="overflow-visible">
                <line x1={padding} y1={padding} x2={padding + chartWidth} y2={padding} stroke="var(--color-brand-border)" strokeDasharray="2" />
                <line x1={padding} y1={padding + chartHeight} x2={padding + chartWidth} y2={padding + chartHeight} stroke="var(--color-brand-border)" />
                <line x1={padding} y1={padding} x2={padding} y2={padding + chartHeight} stroke="var(--color-brand-border)" />
                <line x1={padding + chartWidth} y1={padding} x2={padding + chartWidth} y2={padding + chartHeight} stroke="var(--color-brand-border)" strokeDasharray="2" />
                <text x={padding + chartWidth / 2} y={height - 5} fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">RECALL</text>
                <text x={10} y={height / 2} fill="#64748B" fontSize="8" textAnchor="middle" transform={`rotate(-90 10 ${height / 2})`} fontFamily="JetBrains Mono">PRECISION</text>
                {pathD && <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="2.5" />}
                {pr_curve && pr_curve.map((pt: any, idx: number) => {
                  const { x, y } = getCoords(pt.recall, pt.precision);
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-brand-accent hover:fill-risk-hold cursor-pointer transition-colors"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </svg>
              {hoveredPoint && (
                <div className="absolute top-2 right-2 p-2 bg-brand-panel-light border border-brand-border rounded text-[12px] font-mono text-slate-300 shadow-md">
                  <div>Threshold: <strong className="text-slate-100">{hoveredPoint.threshold.toFixed(2)}</strong></div>
                  <div>Precision: <strong className="text-risk-low">{(hoveredPoint.precision * 100).toFixed(0)}%</strong></div>
                  <div>Recall: <strong className="text-risk-low">{(hoveredPoint.recall * 100).toFixed(0)}%</strong></div>
                </div>
              )}
            </div>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-brand-panel border border-brand-border rounded-lg p-6">
            <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-4">
              Confusion Matrix (Test Set)
            </h3>
            <p className="text-[13px] text-slate-400 mb-6">
              Real count metrics on {metrics.test_set_size} test transactions. Highly imbalanced dataset results.
            </p>
            <div className="grid grid-cols-2 gap-4 text-center text-sm font-mono">
              <div className="p-4 bg-brand-bg/50 border border-brand-border rounded flex flex-col justify-center">
                <span className="text-[11px] text-slate-500 uppercase">True Negative (TN)</span>
                <span className="text-xl font-bold text-slate-200 mt-1">{confusion_matrix.true_negative}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Legit Classified Legit</span>
              </div>
              <div className="p-4 bg-brand-bg/50 border border-brand-border rounded flex flex-col justify-center">
                <span className="text-[11px] text-risk-review uppercase">False Positive (FP)</span>
                <span className="text-xl font-bold text-risk-review mt-1">{confusion_matrix.false_positive}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Legit Flagged Fraud</span>
              </div>
              <div className="p-4 bg-brand-bg/50 border border-brand-border rounded flex flex-col justify-center">
                <span className="text-[11px] text-risk-hold uppercase">False Negative (FN)</span>
                <span className="text-xl font-bold text-risk-hold mt-1">{confusion_matrix.false_negative}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Fraud Missed (Disputes)</span>
              </div>
              <div className="p-4 bg-brand-bg/50 border border-brand-border rounded flex flex-col justify-center">
                <span className="text-[11px] text-risk-low uppercase">True Positive (TP)</span>
                <span className="text-xl font-bold text-risk-low mt-1">{confusion_matrix.true_positive}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Fraud Flagged (Queue)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'explainability' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Global SHAP Feature Importance */}
            <div className="bg-brand-panel border border-brand-border rounded-lg p-6">
              <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-4">
                Global SHAP Feature Importance
              </h3>
              <p className="text-[13px] text-slate-400 mb-6">
                Mean absolute SHAP value across all predictions. Graph features represent Louvain cluster properties.
              </p>
              {globalImportance.length > 0 ? (
                <div className="space-y-3 font-mono text-[12px]">
                  {globalImportance.slice(0, 5).map((feat: any) => {
                    const pct = Math.min(100, Math.round(feat.importance * 220));
                    const isGraphFeat = ["cluster_fraud_rate", "cluster_size", "account_degree", "account_neighbors_count", "avg_edge_weight"].includes(feat.feature);
                    return (
                      <div key={feat.feature} className="space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className={isGraphFeat ? "text-brand-accent font-semibold" : "text-slate-300"}>
                            {feat.feature} {isGraphFeat ? "[G]" : "[T]"}
                          </span>
                          <span className="text-slate-500">{feat.importance.toFixed(3)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-brand-bg rounded overflow-hidden">
                          <div className={`h-full rounded ${isGraphFeat ? 'bg-brand-accent' : 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">No global importance data available.</div>
              )}
              <div className="text-[11px] text-slate-500 font-mono mt-6">
                [G] = Graph / Cluster features | [T] = Tabular features
              </div>
            </div>

            {/* System Model Card */}
            <div className="bg-brand-panel border border-brand-border rounded-lg p-6">
              <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-4 flex items-center gap-1.5">
                System Model Card
              </h3>
              <div className="space-y-4 text-sm leading-relaxed text-slate-355 font-sans">
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1 font-mono uppercase text-[12px] text-brand-accent">Training Specifications</h4>
                  <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-450">
                    <li><strong>Algorithm</strong>: Extreme Gradient Boosting (XGBoost Classifier)</li>
                    <li><strong>Graph features</strong>: Louvain modularity clustering over device_id/IP/address linkages</li>
                    <li><strong>Temporal partition</strong>: Train period (Days 0-45), Test period (Days 46-60)</li>
                    <li><strong>Precision / Recall / F1</strong>: {(metrics.precision * 100).toFixed(1)}% / {(metrics.recall * 100).toFixed(1)}% / {(metrics.f1_score * 100).toFixed(1)}% at threshold {metrics.threshold_used}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1 font-mono uppercase text-[12px] text-brand-accent">Honest Limitations & Concept Drift</h4>
                  <p className="text-[13px] text-slate-450 leading-normal">
                    This system is evaluated on synthetic tabular fraud models simulating Kaggle research. Under live conditions, coordinated networks alter sharing behavior rapidly (concept drift). Relying on automated blocks risks high false positive penalties. This defense-only routing guarantees reviewers can mitigate and isolate false alerts safely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'evaluation' && (
        <div className="space-y-8">
          <div className="bg-brand-panel border border-brand-border rounded-lg p-6">
            <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-6 flex items-center gap-2">
              Temporal Train/Test Split Graphic
            </h3>

            {/* Timeline Graphic */}
            <div className="relative flex flex-col md:flex-row items-center justify-between border border-brand-border bg-brand-bg/40 p-6 rounded-lg gap-6 md:gap-0 font-mono text-sm mb-6">
              {/* Train Phase */}
              <div className="flex-1 w-full text-center md:text-left md:pr-4">
                <span className="text-[13px] font-bold text-risk-low uppercase tracking-widest block">TRAIN PERIOD (Days 0 - 45)</span>
                <p className="text-slate-450 text-[13px] mt-2 leading-relaxed">
                  Used to compile tabular features, construct the Louvain Graph clusters, compute historical fraud rates, and train the XGBoost classifier.
                </p>
              </div>

              {/* Split boundary line */}
              <div className="flex flex-col items-center justify-center border-t-2 border-dashed md:border-t-0 md:border-l-2 border-brand-border px-4 py-2 md:py-8 min-h-[50px] relative">
                <div className="absolute -top-3 md:-top-4 bg-brand-panel-light px-2 py-0.5 border border-brand-border rounded text-[11px] text-brand-accent font-bold">
                  SPLIT BOUNDARY (DAY 45)
                </div>
              </div>

              {/* Test Phase */}
              <div className="flex-1 w-full text-center md:text-right md:pl-4">
                <span className="text-[13px] font-bold text-risk-review uppercase tracking-widest block">TEST PERIOD (Days 46 - 60)</span>
                <p className="text-slate-455 text-[13px] mt-2 leading-relaxed">
                  New transactions evaluated by the model. Test nodes map to the established training clusters; no future data is leaked.
                </p>
              </div>
            </div>

            {/* Leakage Explanation */}
            <div className="p-4 bg-brand-bg/50 border border-brand-border rounded text-[13px] text-slate-300 leading-relaxed space-y-3 font-sans">
              <h4 className="font-bold font-mono text-slate-200 uppercase text-[12px] text-brand-accent">Why Time-Based Splits are Critical</h4>
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
        </div>
      )}
    </div>
  );
}