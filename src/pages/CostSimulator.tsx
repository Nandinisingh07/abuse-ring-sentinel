import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Activity, ShieldCheck, DollarSign, Settings2, HelpCircle } from 'lucide-react';
import { CostCurveSchema, CostCurvePoint } from '../types';

export default function CostSimulator() {
  const [costData, setCostData] = useState<CostCurveSchema | null>(null);
  const [threshold, setThreshold] = useState<number>(0.4);
  const [selectedCost, setSelectedCost] = useState<CostCurvePoint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCostData() {
      try {
        setLoading(true);
        const data = await api.getCostCurve();
        setCostData(data);

        const opt = data?.optimal_threshold ?? 0.4;
        setThreshold(opt);

        const sel = await api.getCostAtThreshold(opt);
        setSelectedCost(sel);
      } catch (err) {
        console.error("Error loading cost data", err);
      } finally {
        setLoading(false);
      }
    }
    loadCostData();
  }, []);

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setThreshold(val);
    try {
      const res = await api.getCostAtThreshold(val);
      setSelectedCost(res);
    } catch (err) {
      console.error("Error fetching cost at threshold", err);
    }
  };

  if (loading || !costData || !selectedCost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <DollarSign className="h-8 w-8 text-brand-accent animate-pulse" />
        <span className="text-base text-slate-400 font-mono">Simulating financial models...</span>
      </div>
    );
  }

  const { curve, optimal_threshold, optimal_total_cost, cost_assumptions } = costData;
  const current = selectedCost;

  // Render SVG cost curve
  const width = 500;
  const height = 180;
  const padding = 25;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const maxCost = Math.max(...curve.map((c) => c.total_cost));

  const getCoords = (t: number, totalCost: number) => {
    const x = padding + t * chartWidth;
    const y = padding + (1 - (totalCost / maxCost)) * chartHeight;
    return { x, y };
  };

  let pathD = "";
  curve.forEach((pt, idx: number) => {
    const { x, y } = getCoords(pt.threshold, pt.total_cost);
    if (idx === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  const optCoord = getCoords(optimal_threshold, optimal_total_cost);
  const currCoord = getCoords(current.threshold, current.total_cost);

  return (
    <div className="page-container py-6">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-[26px] font-extrabold text-slate-100 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-brand-accent animate-pulse" /> Cost Simulator
        </h1>
        <p className="text-sm text-slate-400 font-sans mt-1">
          Balance the cost of manual review (false positives) against missed fraud losses (false negatives).
        </p>
      </div>

      {/* Threshold Slider Panel */}
      <div className="bg-brand-panel border border-brand-border rounded-lg p-6 mb-8">
        <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-4 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-brand-accent" /> Decision Threshold Tuning
        </h3>

        <div className="space-y-6">
          <div className="flex justify-between items-center font-mono">
            <span className="text-sm text-slate-400">Current Threshold: <strong className="text-slate-100 text-base">{threshold.toFixed(2)}</strong></span>
            <span className="text-[13px] bg-brand-bg px-2 py-0.5 border border-brand-border rounded text-brand-accent">
              OPTIMAL (MIN COST): {optimal_threshold.toFixed(2)}
            </span>
          </div>

          {/* Slider input */}
          <input
            type="range"
            min="0.01"
            max="0.99"
            step="0.01"
            value={threshold}
            onChange={handleSliderChange}
            className="w-full h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-accent border border-brand-border"
          />

          <div className="flex justify-between text-[12px] font-mono text-slate-500">
            <span>0.01 (FLAG ALMOST ALL)</span>
            <span>0.50</span>
            <span>0.99 (FLAG ALMOST NONE)</span>
          </div>
        </div>
      </div>

      {/* Grid: Stats and Cost Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cost Metrics list */}
        <div className="bg-brand-panel border border-brand-border rounded-lg p-6 space-y-6">
          <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300">
            Expected Cost Breakdown
          </h3>

          <div className="space-y-4 font-mono text-sm">
            {/* Cost item 1 */}
            <div className="p-3 bg-brand-bg/50 border border-brand-border rounded flex justify-between items-center">
              <div>
                <span className="text-[11px] text-risk-review uppercase font-bold block">False Positives ({current.false_positives})</span>
                <span className="text-slate-400 text-[13px] mt-0.5 block">Manual review cost</span>
              </div>
              <span className="text-base font-bold text-slate-200">${current.fp_cost.toFixed(2)}</span>
            </div>

            {/* Cost item 2 */}
            <div className="p-3 bg-brand-bg/50 border border-brand-border rounded flex justify-between items-center">
              <div>
                <span className="text-[11px] text-risk-hold uppercase font-bold block">False Negatives ({current.false_negatives})</span>
                <span className="text-slate-400 text-[13px] mt-0.5 block">Fraud loss + chargeback fee</span>
              </div>
              <span className="text-base font-bold text-slate-200">${current.fn_cost.toFixed(2)}</span>
            </div>

            {/* Caught fraud (informational) */}
            <div className="p-3 bg-brand-bg/50 border border-brand-border rounded flex justify-between items-center">
              <div>
                <span className="text-[11px] text-brand-accent uppercase font-bold block">Caught Fraud ({current.true_positives})</span>
                <span className="text-slate-400 text-[13px] mt-0.5 block">Correctly flagged at this threshold</span>
              </div>
            </div>

            {/* Total Cost */}
            <div className="p-4 bg-brand-accent/10 border border-brand-accent/20 rounded flex justify-between items-center">
              <div>
                <span className="text-[12px] text-brand-accent uppercase font-bold block">Total Expected Cost</span>
                <span className="text-slate-400 text-[12px] mt-0.5 block">Sum of review + fraud loss</span>
              </div>
              <span className="text-xl font-bold text-brand-accent">${current.total_cost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Cost Curve Graph Area */}
        <div className="lg:col-span-2 bg-brand-panel border border-brand-border rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-[17px] font-bold uppercase tracking-wider font-mono text-slate-300 mb-4">
              Financial Cost Curve vs Threshold
            </h3>

            {/* Cost curve chart */}
            <div className="flex justify-center bg-[#090e16] p-4 border border-[#304A66]/60 rounded relative shadow-inner">
              <svg width={width} height={height} className="overflow-visible">
                {/* Horizontal grid lines */}
                <line x1={padding} y1={padding} x2={padding + chartWidth} y2={padding} stroke="#304A66" strokeDasharray="2" />
                <line x1={padding} y1={padding + chartHeight} x2={padding + chartWidth} y2={padding + chartHeight} stroke="#304A66" />

                {/* Axes Label */}
                <text x={padding + chartWidth / 2} y={height - 5} fill="#A8B6C8" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">THRESHOLD</text>
                <text x={10} y={height / 2} fill="#A8B6C8" fontSize="8" textAnchor="middle" transform={`rotate(-90 10 ${height / 2})`} fontFamily="JetBrains Mono">EXPECTED COST</text>

                {/* Total Cost Line Path */}
                {pathD && (
                  <path d={pathD} fill="none" stroke="#7BA7C9" strokeWidth="2.5" />
                )}

                {/* Draw Optimal Point */}
                <circle cx={optCoord.x} cy={optCoord.y} r="5" fill="#34D399" />
                <line x1={optCoord.x} y1={padding} x2={optCoord.x} y2={padding + chartHeight} stroke="#34D399" strokeDasharray="3" strokeWidth="1" />
                <text x={optCoord.x} y={optCoord.y - 10} fill="#34D399" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono">OPT ({optimal_threshold.toFixed(2)})</text>

                {/* Draw Current Selected Point */}
                <circle cx={currCoord.x} cy={currCoord.y} r="6" fill="#38BDF8" stroke="#090e16" strokeWidth="1.5" />
                <line x1={currCoord.x} y1={padding} x2={currCoord.x} y2={padding + chartHeight} stroke="#38BDF8" strokeDasharray="2" strokeWidth="1" />
                <text x={currCoord.x} y={currCoord.y - 12} fill="#38BDF8" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono">CURR ({current.threshold.toFixed(2)})</text>
              </svg>
            </div>
          </div>

          {/* Parameters info */}
          <div className="mt-4 p-4 bg-brand-bg/50 border border-brand-border rounded text-[13px] font-mono text-slate-400 leading-relaxed grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[11px] text-slate-500 uppercase">False Positive Cost</span>
              <div>Per review: <span className="text-slate-300">${cost_assumptions.review_cost_per_false_positive.toFixed(2)}</span></div>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 uppercase">False Negative Cost</span>
              <div>Avg fraud amount: <span className="text-slate-300">${cost_assumptions.avg_fraud_amount_per_false_negative.toFixed(2)}</span></div>
              <div>Chargeback fee: <span className="text-slate-300">${cost_assumptions.chargeback_fee_per_false_negative.toFixed(2)}</span></div>
              <div>Total per missed case: <span className="text-slate-300">${cost_assumptions.fn_cost_per_case.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
