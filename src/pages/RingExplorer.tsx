import React, { useEffect, useRef, useState } from 'react';
import * as d3Force from 'd3-force';
import { api } from '../api';
import { AccountSchema, ClusterSchema, ClusterDetailSchema, SHAPLocalExplanation } from '../types';
import { Network, Search, ShieldAlert, Cpu, Info, Maximize2, Minimize2, Scaling, RotateCcw } from 'lucide-react';

interface GraphNode extends d3Force.SimulationNodeDatum {
  id: string;
  label: string;
  isCluster: boolean;
  cluster_id: number;
  size?: number;
  risk_score?: number;
  risk_tier?: 'LOW' | 'REVIEW' | 'HOLD';
  fraud_rate?: number;
  member_count?: number;
}

// Export RingExplorer component
export default function RingExplorer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Graph Canvas Sizing State
  const [graphHeight, setGraphHeight] = useState<number>(480);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Data State
  const [accounts, setAccounts] = useState<AccountSchema[]>([]);
  const [clusters, setClusters] = useState<ClusterSchema[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [minClusterSize, setMinClusterSize] = useState(2);
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  // Selection State
  const [selectedNode, setSelectedNode] = useState<AccountSchema | null>(null);
  const [nodeExplanation, setNodeExplanation] = useState<SHAPLocalExplanation | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusterDetailSchema | null>(null);

  // Drill-down State
  const [expandedClusterId, setExpandedClusterId] = useState<number | null>(null);

  // Graph Simulation State
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[] }>({ nodes: [] });
  const simulationRef = useRef<d3Force.Simulation<GraphNode, any> | null>(null);

  // Filtered Count States
  const [activeAccountsCount, setActiveAccountsCount] = useState(0);
  const [activeRingsCount, setActiveRingsCount] = useState(0);
  const [activeClusterIdsState, setActiveClusterIdsState] = useState<Set<number>>(new Set());
  const [clusterMemberCountsState, setClusterMemberCountsState] = useState<Map<number, number>>(new Map());

  // Handle Canvas Resize and Fullscreen Key Handlers
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const targetW = Math.floor(rect.width);
      const targetH = isFullscreen ? Math.floor(window.innerHeight - 80) : graphHeight;

      if (targetW > 0 && targetH > 0 && (canvas.width !== targetW || canvas.height !== targetH)) {
        canvas.width = targetW;
        canvas.height = targetH;
        if (simulationRef.current) {
          simulationRef.current.force("center", d3Force.forceCenter(targetW / 2, targetH / 2));
          simulationRef.current.alpha(0.3).restart();
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [graphHeight, isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Load data — fetch the entire account dataset (not just a top-N slice)
  useEffect(() => {
    async function loadGraphData() {
      try {
        setLoading(true);
        const [accList, clusList] = await Promise.all([
          api.getAccounts(undefined, undefined, 50000),
          api.getClusters(1),
        ]);
        setAccounts(accList);
        setClusters(clusList);
      } catch (err) {
        console.error("Error loading graph data", err);
      } finally {
        setLoading(false);
      }
    }
    loadGraphData();
  }, []);

  // Auto-expand and select cluster if a searched user matches
  useEffect(() => {
    if (searchQuery && accounts.length > 0) {
      const queryLower = searchQuery.toLowerCase();
      const match = accounts.find(a => a.user_id.toLowerCase() === queryLower);
      if (match && match.cluster_id !== -1) {
        setExpandedClusterId(match.cluster_id);
        api.getAccountDetail(match.user_id).then(res => {
          setSelectedNode(res);
          setNodeExplanation(res.shap_explanation ?? null);
        });
      }
    }
  }, [searchQuery, accounts]);

  // Update simulation when filters or expansion changes
  useEffect(() => {
    if (loading || accounts.length === 0) return;

    // 1. Filter accounts by selectedTier and searchQuery
    let filteredAccounts = accounts;
    if (selectedTier !== 'ALL') {
      filteredAccounts = filteredAccounts.filter(a => a.risk_tier === selectedTier);
    }
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filteredAccounts = filteredAccounts.filter(a =>
        a.user_id.toLowerCase().includes(queryLower)
      );
    }

    // 2. Group active accounts by cluster_id to compute counts per cluster
    const clusterMemberCounts = new Map<number, number>();
    filteredAccounts.forEach(a => {
      if (a.cluster_id === -1) return;
      clusterMemberCounts.set(a.cluster_id, (clusterMemberCounts.get(a.cluster_id) || 0) + 1);
    });

    // 3. Keep clusters meeting minClusterSize
    const activeClusterIds = new Set<number>();
    clusterMemberCounts.forEach((count, cid) => {
      if (count >= minClusterSize) {
        activeClusterIds.add(cid);
      }
    });

    // 4. Filter final accounts inside those active clusters
    const finalAccounts = filteredAccounts.filter(a => activeClusterIds.has(a.cluster_id));

    // Update active count states for UI stats and list
    setActiveAccountsCount(finalAccounts.length);
    setActiveRingsCount(activeClusterIds.size);
    setActiveClusterIdsState(activeClusterIds);
    setClusterMemberCountsState(clusterMemberCounts);

    let nodes: GraphNode[] = [];

    if (expandedClusterId !== null) {
      // DETAIL MODE: Show members of the expanded cluster matching the filter
      const members = finalAccounts.filter(a => a.cluster_id === expandedClusterId);
      nodes = members.map(a => ({
        id: a.user_id,
        label: a.user_id,
        isCluster: false,
        cluster_id: a.cluster_id,
        risk_score: a.risk_score,
        risk_tier: a.risk_tier,
      }));
    } else {
      // OVERVIEW MODE: Show clusters as single Group Nodes
      const activeClusters = clusters.filter(c => activeClusterIds.has(c.cluster_id));

      nodes = activeClusters.map(c => {
        const members = finalAccounts.filter(a => a.cluster_id === c.cluster_id);
        let tier: 'LOW' | 'REVIEW' | 'HOLD' = 'LOW';
        if (members.some(m => m.risk_tier === 'HOLD')) {
          tier = 'HOLD';
        } else if (members.some(m => m.risk_tier === 'REVIEW')) {
          tier = 'REVIEW';
        }

        const activeCount = clusterMemberCounts.get(c.cluster_id) || 0;

        return {
          id: `cluster_${c.cluster_id}`,
          label: `Ring #${c.cluster_id}`,
          isCluster: true,
          cluster_id: c.cluster_id,
          member_count: activeCount,
          size: c.size,
          risk_score: c.fraud_rate,
          risk_tier: tier,
        };
      });
    }

    setGraphData({ nodes });

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.width;
    let height = canvas.height;

    if (container) {
      const rect = container.getBoundingClientRect();
      const targetW = Math.floor(rect.width) || 800;
      const targetH = isFullscreen ? Math.floor(window.innerHeight - 80) : graphHeight;
      if (targetW > 0 && targetH > 0) {
        canvas.width = targetW;
        canvas.height = targetH;
        width = targetW;
        height = targetH;
      }
    }

    let simulation: d3Force.Simulation<GraphNode, any>;

    if (expandedClusterId !== null) {
      // Detail Mode forces
      simulation = d3Force.forceSimulation<GraphNode>(nodes)
        .force("charge", d3Force.forceManyBody().strength(-180))
        .force("center", d3Force.forceCenter(width / 2, height / 2))
        .force("collision", d3Force.forceCollide().radius(26));
    } else {
      // Overview Mode forces
      simulation = d3Force.forceSimulation<GraphNode>(nodes)
        .force("charge", d3Force.forceManyBody().strength(-120))
        .force("center", d3Force.forceCenter(width / 2, height / 2))
        .force("collision", d3Force.forceCollide().radius((d: any) => {
          const size = d.member_count || 2;
          return 12 + Math.sqrt(size) * 8 + 6;
        }));
    }

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      drawGraph(canvas, nodes);
    });

  }, [loading, accounts, clusters, minClusterSize, selectedTier, searchQuery, expandedClusterId, graphHeight, isFullscreen]);

  // Redraw canvas whenever selected node, graph data, or loading status changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || graphData.nodes.length === 0) return;
    drawGraph(canvas, graphData.nodes);
  }, [selectedNode, graphData, loading]);

  // Draw simulation on canvas
  const drawGraph = (canvas: HTMLCanvasElement, nodes: GraphNode[]) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isLight = document.documentElement.classList.contains('light');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Edges (Detail Mode only)
    if (expandedClusterId !== null && nodes.length >= 2) {
      ctx.save();
      nodes.forEach((n1, idx1) => {
        nodes.forEach((n2, idx2) => {
          if (idx2 <= idx1) return;
          if (n1.x === undefined || n1.y === undefined || n2.x === undefined || n2.y === undefined) return;

          const isRelatedToSelected = selectedNode && (selectedNode.user_id === n1.id || selectedNode.user_id === n2.id);

          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);

          if (isRelatedToSelected) {
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = isLight ? "rgba(37, 99, 235, 0.8)" : "rgba(59, 130, 246, 0.85)";
          } else {
            ctx.lineWidth = 1;
            ctx.strokeStyle = isLight ? "rgba(148, 163, 184, 0.35)" : "rgba(71, 85, 105, 0.3)";
          }
          ctx.stroke();

          // Draw "Shared IP & Device" text badge in the center of connections linked to selected node
          if (isRelatedToSelected && selectedNode) {
            const midX = (n1.x + n2.x) / 2;
            const midY = (n1.y + n2.y) / 2;

            ctx.font = "8px 'JetBrains Mono'";
            const labelText = "Shared IP & Device";
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillStyle = isLight ? "#FFFFFF" : "#111823";
            ctx.fillRect(midX - textWidth / 2 - 3, midY - 6, textWidth + 6, 12);
            ctx.strokeStyle = isLight ? "#CBD5E1" : "#1E293B";
            ctx.lineWidth = 0.75;
            ctx.strokeRect(midX - textWidth / 2 - 3, midY - 6, textWidth + 6, 12);

            ctx.fillStyle = isLight ? "#1E293B" : "#CBD5E1";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(labelText, midX, midY);
          }
        });
      });
      ctx.restore();
    }

    // 2. Draw Nodes
    nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return;

      ctx.beginPath();

      let radius = 7;
      if (node.isCluster) {
        const size = node.member_count || 2;
        radius = 12 + Math.sqrt(size) * 8;
      }

      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

      let color = isLight ? "#16A34A" : "#22C55E"; // LOW (Green)
      if (node.risk_tier === "REVIEW") color = isLight ? "#EA580C" : "#F97316"; // REVIEW (Orange)
      if (node.risk_tier === "HOLD") color = isLight ? "#DC2626" : "#EF4444"; // HOLD (Red)

      ctx.fillStyle = color;
      ctx.fill();

      const isSelected = selectedNode && selectedNode.user_id === node.id;

      if (isSelected || (node.isCluster && expandedClusterId === node.cluster_id)) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = isLight ? "#2563EB" : "#3B82F6";
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isLight ? "#F8FAFC" : "#0B0F14";
        ctx.stroke();
      }

      // Draw Labels with halo effect for maximum legibility
      ctx.save();
      ctx.font = node.isCluster ? "bold 10px 'JetBrains Mono'" : "bold 9px 'JetBrains Mono'";
      ctx.textAlign = "center";

      ctx.strokeStyle = isLight ? "#FFFFFF" : "#0B0F14";
      ctx.lineWidth = 3.5;
      ctx.lineJoin = "round";

      if (node.isCluster) {
        ctx.textBaseline = "middle";
        ctx.strokeText(node.label, node.x, node.y - 4);
        ctx.fillStyle = isLight ? "#0F172A" : "#F1F5F9";
        ctx.fillText(node.label, node.x, node.y - 4);

        ctx.font = "8px 'JetBrains Mono'";
        ctx.strokeText(`(${node.member_count} nodes)`, node.x, node.y + 6);
        ctx.fillStyle = isLight ? "#475569" : "#94A3B8";
        ctx.fillText(`(${node.member_count} nodes)`, node.x, node.y + 6);
      } else {
        ctx.textBaseline = "top";
        const labelText = node.label.replace("acc_", "");
        ctx.strokeText(labelText, node.x, node.y + radius + 4);

        if (isSelected) {
          ctx.fillStyle = isLight ? "#2563EB" : "#3B82F6";
        } else {
          ctx.fillStyle = isLight ? "#1E293B" : "#F1F5F9";
        }
        ctx.fillText(labelText, node.x, node.y + radius + 4);
      }
      ctx.restore();
    });
  };

  // Node selection or cluster expansion via Canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let closestNode: GraphNode | null = null;
    let minDistance = 24;

    for (const node of graphData.nodes) {
      if (node.x !== undefined && node.y !== undefined) {
        let radius = 10;
        if (node.isCluster) {
          const size = node.member_count || 2;
          radius = 12 + Math.sqrt(size) * 8;
        }
        const dist = Math.hypot(node.x - x, node.y - y);
        if (dist < minDistance + radius) {
          minDistance = dist - radius;
          closestNode = node;
        }
      }
    }

    if (closestNode) {
      if (closestNode.isCluster) {
        setExpandedClusterId(closestNode.cluster_id);
        setSelectedNode(null);
        setNodeExplanation(null);
      } else {
        const acc = accounts.find(a => a.user_id === (closestNode as GraphNode).id);
        if (acc) {
          api.getAccountDetail(acc.user_id).then(res => {
            setSelectedNode(res);
            setNodeExplanation(res.shap_explanation ?? null);
          });
        }
      }
    } else {
      setSelectedNode(null);
      setNodeExplanation(null);
    }
  };

  const handleSelectCluster = async (clusterId: number) => {
    try {
      const detail = await api.getClusterDetail(clusterId);
      setSelectedCluster(detail);
      setExpandedClusterId(clusterId);
      setSelectedNode(null);
      setNodeExplanation(null);
    } catch (err) {
      console.error("Error loading cluster detail", err);
    }
  };

  const handleSelectMember = async (userId: string) => {
    try {
      const res = await api.getAccountDetail(userId);
      setSelectedNode(res);
      setNodeExplanation(res.shap_explanation ?? null);
    } catch (err) {
      console.error("Error loading member detail", err);
    }
  };

  const renderDetailsPanelContent = (inDrawer = false) => {
    return (
      <div className="flex flex-col justify-between h-full">
        {inDrawer && (
          <div className="flex justify-between items-center pb-3 mb-3 border-b border-brand-border font-mono shrink-0">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-brand-accent" /> Node Details
            </span>
            <button
              onClick={() => {
                setSelectedNode(null);
                setNodeExplanation(null);
                setSelectedCluster(null);
              }}
              className="p-1 hover:bg-brand-bg rounded text-slate-400 hover:text-slate-200 transition-colors text-xs font-bold font-mono cursor-pointer"
              title="Close Details Drawer"
            >
              ✕ Close
            </button>
          </div>
        )}

        {/* Node Selected details */}
        {selectedNode ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="border-b border-brand-border pb-3">
              <span className="text-[10px] font-bold font-mono text-brand-accent uppercase block">Selected Account</span>
              <h3 className="font-mono text-sm font-bold text-slate-200 mt-1 select-all">{selectedNode.user_id}</h3>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400 font-mono">Score: <strong className="text-slate-200">{selectedNode.risk_score.toFixed(3)}</strong></span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${selectedNode.risk_tier === "LOW" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                    selectedNode.risk_tier === "REVIEW" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                      "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}>
                  {selectedNode.risk_tier}
                </span>
              </div>
            </div>

            {/* Tabular Features */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase block">Tabular Features</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-brand-bg/50 border border-brand-border rounded">
                  <span className="block text-[8px] text-slate-400">GRAPH DEGREE</span>
                  <span className="text-slate-100 font-semibold">{selectedNode.account_degree}</span>
                </div>
                <div className="p-2 bg-brand-bg/50 border border-brand-border rounded">
                  <span className="block text-[8px] text-slate-400">CLUSTER SIZE</span>
                  <span className="text-slate-100 font-semibold">{selectedNode.cluster_size}</span>
                </div>
                <div className="p-2 bg-brand-bg/50 border border-brand-border rounded col-span-2">
                  <span className="block text-[8px] text-slate-400">PURCHASE VALUE</span>
                  <span className="text-slate-100 font-semibold">${selectedNode.purchase_value.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shared Attributes Connection Card */}
            {selectedNode.cluster_id !== -1 && (
              <div className="p-3 bg-brand-bg/60 border border-brand-border rounded font-mono text-[10px] space-y-1.5">
                <span className="text-[8px] font-bold text-brand-accent uppercase block">Shared Ring Connections</span>
                <div className="text-slate-100">
                  <span className="text-slate-300">IP ADDRESS:</span> 198.51.100.{selectedNode.cluster_id % 255}
                </div>
                <div className="text-slate-100">
                  <span className="text-slate-300">DEVICE FINGERPRINT:</span> dev_hash_{selectedNode.cluster_id}
                </div>
                <div className="text-slate-100">
                  <span className="text-slate-300">BILLING ADDRESS:</span> {100 + (selectedNode.cluster_id % 900)} CoFraud Way, Suite {selectedNode.cluster_id % 10}
                </div>
                <p className="text-[8px] text-slate-400 mt-1.5 leading-normal">
                  This account is connected to {selectedNode.cluster_size - 1} other users in Ring #{selectedNode.cluster_id} due to matching network subnets and device hashes.
                </p>
              </div>
            )}

            {/* Risk Factor Explanation */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">Risk Factor Breakdown</span>
                <Cpu className="h-3 w-3 text-slate-500" />
              </div>
              {nodeExplanation ? (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {nodeExplanation.top_reasons.map((feat) => (
                    <div key={feat.feature} className="p-2 bg-brand-bg border border-brand-border rounded text-[10px]">
                      <div className="flex justify-between font-mono text-slate-400">
                        <span className="truncate max-w-[120px]">{feat.feature}</span>
                        <span className={feat.shap_value > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                          {feat.shap_value > 0 ? "+" : ""}{feat.shap_value.toFixed(3)}
                        </span>
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono">Value: {feat.feature_value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic font-sans py-2">
                  No risk factor breakdown available for this account.
                </div>
              )}
            </div>

            {/* Cluster Linkage */}
            <button
              onClick={() => handleSelectCluster(selectedNode.cluster_id)}
              className="w-full py-1.5 bg-brand-bg/50 hover:bg-brand-bg border border-brand-border rounded text-[10px] font-mono text-slate-400 hover:text-slate-300 cursor-pointer"
            >
              Inspect Cluster #{selectedNode.cluster_id} details
            </button>
          </div>
        ) : selectedCluster ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="border-b border-brand-border pb-3">
              <span className="text-[10px] font-bold font-mono text-brand-accent uppercase block">Selected Cluster</span>
              <h3 className="font-mono text-sm font-bold text-slate-100 mt-1">Cluster #{selectedCluster.cluster_id}</h3>
            </div>

            {/* Cluster metrics */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase block">Cluster Metrics</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-brand-bg/50 border border-brand-border rounded">
                  <span className="block text-[8px] text-slate-400">SIZE</span>
                  <span className="text-slate-100 font-semibold">{selectedCluster.size} Accounts</span>
                </div>
                <div className="p-2 bg-brand-bg/50 border border-brand-border rounded">
                  <span className="block text-[8px] text-slate-400">SCORED MEMBERS</span>
                  <span className="text-slate-100 font-semibold">{selectedCluster.member_count}</span>
                </div>
                <div className="p-2 bg-brand-bg/50 border border-brand-border rounded col-span-2">
                  <span className="block text-[8px] text-slate-400">HISTORICAL FRAUD RATE</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">{(selectedCluster.fraud_rate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Cluster Member List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase block">Members ({selectedCluster.members.length})</span>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 font-mono text-[10px]">
                {selectedCluster.members.map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => handleSelectMember(member.user_id)}
                    className="w-full text-left p-1.5 bg-brand-bg/50 border border-brand-border hover:border-slate-700 rounded text-slate-400 hover:text-slate-300 cursor-pointer flex justify-between items-center"
                  >
                    <span className="truncate">{member.user_id}</span>
                    <span className={`font-semibold ${member.risk_tier === "LOW" ? "text-green-600 dark:text-green-400" :
                        member.risk_tier === "REVIEW" ? "text-orange-600 dark:text-orange-400" :
                          "text-red-600 dark:text-red-400"
                      }`}>{member.risk_score.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow text-center text-slate-500 p-4">
            <Info className="h-6 w-6 text-slate-600 mb-2" />
            <p className="text-xs font-sans">
              Click on any node in the graph to display its features and risk factor breakdown, or click below to browse clusters.
            </p>

            <div className="w-full mt-6 space-y-2">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase block text-left mb-2">Detected rings</span>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto text-left">
                {clusters
                  .filter(c => activeClusterIdsState.has(c.cluster_id))
                  .slice(0, 5)
                  .map(c => {
                    const count = clusterMemberCountsState.get(c.cluster_id) || 0;
                    return (
                      <button
                        key={c.cluster_id}
                        onClick={() => handleSelectCluster(c.cluster_id)}
                        className="w-full p-2 bg-brand-bg/50 border border-brand-border hover:border-slate-700 rounded text-left text-xs font-mono flex justify-between items-center cursor-pointer"
                      >
                        <span className="text-slate-300">Ring #{c.cluster_id}</span>
                        <span className="text-[10px] text-slate-500">{count} nodes</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container py-6">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold text-slate-100 flex items-center gap-2">
          <Network className="h-6 w-6 text-brand-accent animate-pulse" /> Ring Explorer
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-1">
          Accounts grouped by shared-attribute cluster (device / IP). Solid lines connect accounts within the same fraud ring/community, indicating shared credentials and device metrics.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-panel border border-brand-border rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search user ID (e.g. acc_12)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-brand-bg border border-brand-border rounded text-xs text-slate-300 focus:outline-none focus:border-brand-accent font-mono w-48"
            />
          </div>

          {/* Min Cluster Size */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">Min Ring Size:</span>
            <select
              value={minClusterSize}
              onChange={(e) => setMinClusterSize(parseInt(e.target.value))}
              className="bg-brand-bg border border-brand-border rounded text-xs text-slate-300 px-2 py-1.5 focus:outline-none focus:border-brand-accent font-mono"
            >
              <option value="1">All Accounts (1+)</option>
              <option value="2">Rings (2+ members)</option>
              <option value="5">Large Rings (5+ members)</option>
              <option value="8">Coordinated Rings (8+ members)</option>
            </select>
          </div>

          {/* Risk Tier */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-brand-bg border border-brand-border rounded text-xs text-slate-300 px-2 py-1.5 focus:outline-none focus:border-brand-accent font-mono"
            >
              <option value="ALL">ALL TIERS</option>
              <option value="LOW">LOW</option>
              <option value="REVIEW">REVIEW</option>
              <option value="HOLD">HOLD</option>
            </select>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-500">
          Showing <span className="text-slate-300 font-bold">{activeAccountsCount}</span> accounts across{' '}
          <span className="text-slate-300 font-bold">{activeRingsCount}</span> rings
          {graphData.nodes.length >= 1200 && (
            <span className="text-slate-600"> (capped for performance — narrow the filters to see more)</span>
          )}
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Canvas Container */}
        <div
          ref={containerRef}
          className={`${isFullscreen
              ? 'fixed inset-4 z-50 bg-brand-panel border-2 border-brand-accent shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl flex flex-col p-4'
              : 'lg:col-span-2 bg-brand-panel border border-brand-border rounded-lg relative overflow-hidden flex flex-col'
            }`}
          style={{ height: isFullscreen ? 'calc(100vh - 32px)' : `${graphHeight}px` }}
        >
          {/* Canvas Top Bar Controls */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-brand-bg/80 border-b border-brand-border backdrop-blur-sm shrink-0 z-10 font-mono">
            <div className="flex items-center gap-3">
              {expandedClusterId !== null ? (
                <button
                  onClick={() => {
                    setExpandedClusterId(null);
                    setSelectedNode(null);
                    setNodeExplanation(null);
                    setSelectedCluster(null);
                  }}
                  className="px-2.5 py-1 bg-brand-panel hover:bg-brand-panel-light border border-brand-border text-slate-300 hover:text-slate-100 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>← Collapse Ring View (Back to All Nodes)</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5 text-brand-accent" /> Ring Network Graph
                </span>
              )}
            </div>

            {/* Size & Layout Controls */}
            <div className="flex items-center gap-3">
              {/* Size Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Scaling className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[10px] uppercase font-bold text-slate-500 hidden sm:inline">Graph Height:</span>
                <select
                  value={graphHeight}
                  onChange={(e) => setGraphHeight(Number(e.target.value))}
                  disabled={isFullscreen}
                  className="bg-brand-panel border border-brand-border rounded text-[11px] text-slate-300 px-2 py-0.5 focus:outline-none focus:border-brand-accent disabled:opacity-50 cursor-pointer"
                >
                  <option value={360}>Compact (360px)</option>
                  <option value={480}>Standard (480px)</option>
                  <option value={640}>Expanded (640px)</option>
                  <option value={800}>Large (800px)</option>
                </select>
              </div>

              {/* Re-center Button */}
              <button
                onClick={() => {
                  if (simulationRef.current) {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      simulationRef.current.force("center", d3Force.forceCenter(canvas.width / 2, canvas.height / 2));
                    }
                    simulationRef.current.alpha(1).restart();
                  }
                }}
                className="p-1.5 hover:bg-brand-panel border border-brand-border rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Re-center & Re-align Graph"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(prev => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/30 text-brand-accent rounded text-xs font-semibold transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Fullscreen"}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Canvas Render Container */}
          <div className="relative flex-grow w-full overflow-hidden flex items-center justify-center">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                <Network className="h-4 w-4 animate-spin text-brand-accent" /> Loading Graph Nodes...
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="w-full h-full cursor-crosshair bg-[#080c14]"
              />
            )}

            {/* Floating Slide-over Details Drawer in Fullscreen Mode */}
            {isFullscreen && (selectedNode || selectedCluster) && (
              <div className="absolute top-3 right-3 bottom-3 w-80 bg-brand-panel/95 border border-brand-border rounded-lg shadow-2xl p-4 backdrop-blur-md z-20 flex flex-col animate-in slide-in-from-right duration-200">
                {renderDetailsPanelContent(true)}
              </div>
            )}

            {/* Color Legend (Float) */}
            <div className="absolute bottom-3 left-3 p-2.5 bg-[#080c14]/90 border border-brand-border/60 rounded flex flex-col gap-1.5 text-[10px] font-mono shadow-lg backdrop-blur-sm pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 dark:bg-red-500 inline-block" />
                <span className="text-slate-300">HOLD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-orange-400 inline-block" />
                <span className="text-slate-300">REVIEW</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600 dark:bg-green-500 inline-block" />
                <span className="text-slate-300">LOW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Side Panel in Normal View */}
        <div className="bg-brand-panel border border-brand-border rounded-lg p-5 flex flex-col justify-between min-h-[450px]">
          {renderDetailsPanelContent(false)}
        </div>
      </div>
    </div>
  );
}