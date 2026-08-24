import React, { useEffect, useRef, useState } from 'react';
import { 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  AlertCircle, 
  Play, 
  RotateCcw, 
  Info, 
  HelpCircle,
  Network,
  Cpu,
  Shield,
  Layers,
  Activity,
  FileText,
  CheckCircle
} from 'lucide-react';

// Custom CSS styles injected directly into the document head
const CustomStyles = () => (
  <style>{`
    /* 3D Flip Card Styles */
    .flip-card-container {
      perspective: 1000px;
      width: 100%;
    }
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 220px;
      text-align: center;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      transform-style: preserve-3d;
    }
    .flip-card-inner.is-flipped {
      transform: rotateY(180deg);
    }
    .flip-card-front, .flip-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      border-radius: 12px;
    }
    .flip-card-back {
      transform: rotateY(180deg);
    }
    
    /* Custom Gradients and Glows */
    .glow-mint {
      box-shadow: 0 0 15px rgba(52, 211, 153, 0.15);
      border-color: rgba(52, 211, 153, 0.3) !important;
    }
    .glow-cyan {
      box-shadow: 0 0 15px rgba(34, 211, 238, 0.15);
      border-color: rgba(34, 211, 238, 0.3) !important;
    }
    .glow-lavender {
      box-shadow: 0 0 15px rgba(192, 132, 252, 0.15);
      border-color: rgba(192, 132, 252, 0.3) !important;
    }
    .glow-blue {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4) !important;
    }
    
    /* Background Grid Overlay */
    .bg-grid-overlay {
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(38, 38, 43, 0.25) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(38, 38, 43, 0.25) 1px, transparent 1px);
    }

    /* Bolder and Brighter High-Contrast Text Overrides */
    .text-slate-100 { color: #f8fafc !important; font-weight: 700 !important; }
    .text-slate-150 { color: #f8fafc !important; font-weight: 700 !important; }
    .text-slate-200 { color: #f1f5f9 !important; font-weight: 600 !important; }
    .text-slate-250 { color: #e2e8f0 !important; font-weight: 600 !important; }
    .text-slate-300 { color: #e2e8f0 !important; font-weight: 500 !important; }
    .text-slate-350 { color: #cbd5e1 !important; font-weight: 550 !important; }
    .text-slate-355 { color: #cbd5e1 !important; font-weight: 550 !important; }
    .text-slate-400 { color: #cbd5e1 !important; font-weight: 550 !important; }
    .text-slate-450 { color: #94a3b8 !important; font-weight: 550 !important; }
    .text-slate-455 { color: #94a3b8 !important; font-weight: 600 !important; }
    .text-slate-500 { color: #94a3b8 !important; font-weight: 600 !important; }
    .text-slate-550 { color: #64748b !important; font-weight: 600 !important; }
    .text-slate-600 { color: #64748b !important; font-weight: 600 !important; }
    
    p {
      font-weight: 500 !important;
    }
  `}</style>
);

interface RevealCardProps {
  title: string;
  question: string;
  answer: string;
  details?: string;
  accentColor?: 'mint' | 'cyan' | 'lavender' | 'blue';
}

// 3D Flip Card Component
function RevealCard({ title, question, answer, details, accentColor = 'blue' }: RevealCardProps) {
  const [flipped, setFlipped] = useState(false);
  
  const getBorderClass = () => {
    if (flipped) {
      if (accentColor === 'mint') return 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
      if (accentColor === 'cyan') return 'border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]';
      if (accentColor === 'lavender') return 'border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]';
      return 'border-brand-accent/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
    }
    return 'border-brand-border hover:border-slate-700';
  };

  const getAccentText = () => {
    if (accentColor === 'mint') return 'text-emerald-400';
    if (accentColor === 'cyan') return 'text-cyan-400';
    if (accentColor === 'lavender') return 'text-purple-400';
    return 'text-brand-accent';
  };

  return (
    <div 
      className="flip-card-container h-[220px]"
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`flip-card-inner h-full ${flipped ? 'is-flipped' : ''}`}>
        {/* Front side */}
        <div className={`flip-card-front bg-brand-panel/40 border p-6 flex flex-col items-center justify-between h-full cursor-pointer transition-all duration-300 ${getBorderClass()}`}>
          <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">{title}</div>
          <div className="flex flex-col items-center gap-1">
            <HelpCircle className="h-10 w-10 text-slate-600 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mt-1">Reveal Question</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Click to explore</div>
        </div>
        
        {/* Back side */}
        <div className={`flip-card-back bg-brand-panel border p-5 flex flex-col justify-between h-full cursor-pointer transition-all duration-300 ${getBorderClass()}`}>
          <div className="space-y-2 text-left flex-grow overflow-y-auto pr-1">
            <div className={`text-[10px] font-mono tracking-widest uppercase font-bold ${getAccentText()}`}>{title}</div>
            <div className="text-xs font-bold text-slate-200 leading-tight">{question}</div>
            <p className="text-[12px] text-slate-400 leading-relaxed font-sans">{answer}</p>
            {details && <p className="text-[10px] text-slate-500 font-mono italic leading-tight pt-1 border-t border-brand-border/40">{details}</p>}
          </div>
          <div className="text-[9px] text-slate-500 font-mono text-right mt-1 pt-1 border-t border-brand-border/30">Click to flip back</div>
        </div>
      </div>
    </div>
  );
}

interface VisualNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isRing: boolean;
  angleOffset: number;
}

// Canvas-based interactive network visualizer with Mouse Interaction
function NetworkVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<VisualNode | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const elementHeight = rect.height;
      const denominator = elementHeight - window.innerHeight;
      const progress = denominator > 0 
        ? Math.min(Math.max(-rect.top / denominator, 0), 1) 
        : 0;
      setScrollProgress(isNaN(progress) ? 0 : progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      setHoveredNode(null);
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Initialize 40 nodes
    const nodeCount = 40;
    const nodes: VisualNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const isRing = i < 8; // First 8 form the cluster
      nodes.push({
        id: `acc_${Math.floor(100 + i * 13)}`,
        x: isRing 
          ? width / 2 + (Math.random() - 0.5) * 120 
          : Math.random() * width,
        y: isRing 
          ? height / 2 + (Math.random() - 0.5) * 120 
          : Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: isRing ? 6.5 : 4.5,
        isRing,
        angleOffset: Math.random() * Math.PI * 2
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const connectionDist = 80 + scrollProgress * 70;
      const ringRevealStrength = scrollProgress;
      const mouse = mouseRef.current;
      let activeHoverNode: VisualNode | null = null;

      // Update positions & find hovered node
      for (const node of nodes) {
        if (node.isRing) {
          const targetX = width / 2 + Math.cos(Date.now() * 0.0006 + node.angleOffset) * 60;
          const targetY = height / 2 + Math.sin(Date.now() * 0.0006 + node.angleOffset) * 60;
          node.x += (targetX - node.x) * (0.01 + ringRevealStrength * 0.04);
          node.y += (targetY - node.y) * (0.01 + ringRevealStrength * 0.04);
        } else {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        }

        // Check hover
        const dist = Math.hypot(node.x - mouse.x, node.y - mouse.y);
        if (dist < 15) {
          activeHoverNode = node;
        }
      }

      if (activeHoverNode) {
        setHoveredNode(activeHoverNode);
      }

      // Draw connections
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);

          if (dist < connectionDist) {
            let alpha = (1 - dist / connectionDist) * 0.15;
            const isHoveredConnection = activeHoverNode && (activeHoverNode.id === n1.id || activeHoverNode.id === n2.id);

            if (n1.isRing && n2.isRing) {
              alpha = (1 - dist / connectionDist) * (0.1 + ringRevealStrength * 0.75);
              ctx.strokeStyle = isHoveredConnection 
                ? `rgba(239, 68, 68, 0.95)` 
                : `rgba(239, 68, 68, ${alpha})`;
              ctx.lineWidth = isHoveredConnection 
                ? 2.5 
                : 1 + ringRevealStrength * 1.5;
            } else {
              ctx.strokeStyle = isHoveredConnection 
                ? `rgba(59, 130, 246, 0.7)` 
                : `rgba(71, 85, 105, ${alpha})`;
              ctx.lineWidth = isHoveredConnection ? 1.5 : 0.8;
            }

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Nodes
      nodes.forEach((node) => {
        ctx.beginPath();
        const isSelected = activeHoverNode && activeHoverNode.id === node.id;
        ctx.arc(node.x, node.y, isSelected ? node.radius + 3 : node.radius, 0, Math.PI * 2);
        
        if (node.isRing) {
          const r = Math.floor(59 + (239 - 59) * ringRevealStrength);
          const g = Math.floor(130 + (68 - 130) * ringRevealStrength);
          const b = Math.floor(246 + (68 - 246) * ringRevealStrength);
          ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 1)' : `rgb(${r}, ${g}, ${b})`;
          ctx.shadowBlur = isSelected ? 18 : ringRevealStrength * 10;
          ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        } else {
          ctx.fillStyle = isSelected ? '#3B82F6' : '#475569';
          ctx.shadowBlur = isSelected ? 15 : 0;
          ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        }
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        // Halo stroke for selected
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scrollProgress]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full pointer-events-auto" />
      {hoveredNode && (
        <div 
          className="absolute bg-brand-panel/90 border border-brand-border px-4 py-2.5 rounded-lg text-left text-xs font-mono shadow-2xl pointer-events-none animate-in fade-in duration-100 backdrop-blur-md"
          style={{ 
            left: `${Math.min(mouseRef.current.x + 15, (canvasRef.current?.offsetWidth || 0) - 180)}px`, 
            top: `${Math.min(mouseRef.current.y + 15, (canvasRef.current?.offsetHeight || 0) - 100)}px` 
          }}
        >
          <div className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Node Inspector</div>
          <div className="text-slate-100 font-bold mt-1 text-[13px]">{hoveredNode.id}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            Status: <span className={hoveredNode.isRing ? 'text-red-400 font-bold' : 'text-slate-400'}>{hoveredNode.isRing ? 'Coordinated (Ring #42)' : 'Isolated Account'}</span>
          </div>
          <div className="text-[9px] text-slate-600 mt-0.5">Role: Bipartite Node</div>
        </div>
      )}
    </div>
  );
}

// Watch the System Work Simulation Component
function SystemSimulation() {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const timerRef = useRef<any>(null);

  const steps = [
    { label: "New Input Detected", desc: "Raw transaction webhook parsed", log: "Inbound Webhook: Received transaction tx_9841 ($320.00) from user acc_392" },
    { label: "Entity Extraction", desc: "Device, IP and Address hashes resolved", log: "Entity Resolver: Extracted Device dev_9013 and IP subnet 198.51.100.42" },
    { label: "Relationship Mapping", desc: "Bipartite linkages established", log: "Graph Engine: Linked acc_392 to Ring #42 (Shared Device & Billing address)" },
    { label: "Network Partitioning", desc: "Louvain community modularity updated", log: "Louvain Community: Ring #42 updated. Modularity index 0.65, member count 9." },
    { label: "Risk Scored", desc: "XGBoost continuous risk scored", log: "XGBoost Model: Scored risk = 0.892 (Primary driver: Ring #42 historical fraud history)" },
    { label: "Alert Generated", desc: "Optimal threshold classification set", log: "Classifier: Risk score 0.892 exceeds threshold 0.26. Routed to REVIEW." },
    { label: "Command Center Dispatched", desc: "Review queue updated with SHAP details", log: "Sentinel Core: Flagged card dispatched to Review Queue for human triage." }
  ];

  const startSimulation = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveStep(0);
    setProgress(0);
    setLogs([steps[0].log]);
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setActiveStep(-1);
    setProgress(0);
    setLogs([]);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = 1200; // time per step in ms
    timerRef.current = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setIsPlaying(false);
          clearInterval(timerRef.current);
          return prev;
        }
        setLogs((prevLogs) => [...prevLogs, steps[next].log]);
        return next;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 8;
      });
    }, 100);
    return () => clearInterval(progressInterval);
  }, [activeStep, isPlaying]);

  return (
    <div className="w-full bg-brand-panel border border-brand-border rounded-xl p-6 md:p-8 space-y-6 glow-blue">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 font-sans">Active Risk Analysis Simulation</h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">Watch raw data flows transform into an actionable investigator report</p>
        </div>
        <div className="flex items-center gap-2">
          {!isPlaying && activeStep === -1 ? (
            <button 
              onClick={startSimulation}
              className="px-4 py-2 bg-brand-accent hover:bg-blue-600 text-white rounded font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_2px_10px_rgba(59,130,246,0.25)]"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Run Simulation
            </button>
          ) : (
            <button 
              onClick={resetSimulation}
              className="px-4 py-2 border border-brand-border hover:bg-brand-panel-light text-slate-350 rounded font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset / Replay
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Steps display */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block">System Flow Pipeline</span>
          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isActive = idx === activeStep;
              const isPassed = idx < activeStep;
              
              let statusBorder = 'border-brand-border bg-brand-bg/25';
              let numBg = 'bg-brand-bg border-brand-border text-slate-500';
              
              if (isActive) {
                statusBorder = 'border-brand-accent/40 bg-brand-accent/5 glow-blue';
                numBg = 'bg-brand-accent text-white border-brand-accent';
              } else if (isPassed) {
                statusBorder = 'border-emerald-500/25 bg-emerald-500/5';
                numBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
              }

              return (
                <div key={idx} className={`border p-3.5 rounded-lg flex items-center gap-4 transition-all duration-300 ${statusBorder}`}>
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-mono text-xs font-bold shrink-0 ${numBg}`}>
                    0{idx + 1}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-[13px] font-bold font-mono ${isActive ? 'text-slate-100' : isPassed ? 'text-slate-300' : 'text-slate-500'}`}>
                        {step.label}
                      </h4>
                      {isActive && isPlaying && (
                        <span className="text-[9px] font-mono text-brand-accent animate-pulse font-bold">PROCESSING...</span>
                      )}
                      {isPassed && (
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className={`text-[11.5px] truncate mt-0.5 ${isActive ? 'text-slate-350' : 'text-slate-500'}`}>{step.desc}</p>
                    
                    {/* Step progress bar */}
                    {isActive && isPlaying && (
                      <div className="h-1 w-full bg-brand-border/60 rounded overflow-hidden mt-2.5">
                        <div className="bg-brand-accent h-full transition-all duration-100" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live system logs */}
        <div className="flex flex-col h-full min-h-[300px]">
          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block mb-3">Live Log Stream</span>
          <div className="bg-brand-bg border border-brand-border rounded-lg p-4 flex-grow font-mono text-[11px] text-slate-400 overflow-y-auto space-y-3 leading-relaxed shadow-inner">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-slate-600 italic font-sans text-xs">
                Click \"Run Simulation\" to inspect log outputs
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="animate-in slide-in-from-bottom-2 duration-200 border-l border-brand-border pl-3 ml-1 py-0.5">
                  <span className="text-brand-accent font-bold">► </span>
                  <span className="text-slate-300">{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ArchNode {
  id: number;
  label: string;
  x: number;
  y: number;
  desc: string;
}

interface Connection {
  from: number;
  to: number;
  path: string;
}

interface NodeDetail {
  title: string;
  input: string;
  output: string;
  why: string;
}

// Clickable Interactive Architecture Diagram
function InteractiveArchitecture() {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const nodes: ArchNode[] = [
    { id: 0, label: "INPUT", x: 400, y: 30, desc: "Raw transaction database records containing device_ids, IP routes, timestamps, and address fields." },
    { id: 1, label: "AI ANALYSIS", x: 400, y: 100, desc: "Combines modularity values with standard transactional parameters to feed the feature extractor." },
    { id: 2, label: "ENTITIES", x: 280, y: 175, desc: "Device, IP and attribute extraction. Maps unique hardware descriptors and transaction cards." },
    { id: 3, label: "RELATIONSHIPS", x: 520, y: 175, desc: "Bipartite shared-attribute graph linkages. Connects separate customer ids using identical hardware fingerprints." },
    { id: 4, label: "NETWORK", x: 400, y: 250, desc: "Modularity community detection via Louvain Algorithm to partition transaction nodes into communities (rings)." },
    { id: 5, label: "RISK ENGINE", x: 400, y: 325, desc: "XGBoost continuous risk probability scorer [0.0 - 1.0]. Integrates local transaction details with graph features." },
    { id: 6, label: "ALERTS", x: 280, y: 400, desc: "Optimal cost-based threshold classification. Categorizes accounts into LOW, REVIEW, and HOLD risk tiers." },
    { id: 7, label: "RANKING", x: 520, y: 400, desc: "Severity ranking queue. Sorts pending reviews based on risk level and purchase value to maximize review efficiency." },
    { id: 8, label: "COMMAND CENTER", x: 400, y: 475, desc: "Sentinel Core Human Triage console. Evaluates details, checks SHAP explainers, and logs action records to the audit log." }
  ];

  const connections: Connection[] = [
    { from: 0, to: 1, path: "M 400 47 L 400 83" },
    { from: 1, to: 2, path: "M 380 117 Q 330 125 280 158" },
    { from: 1, to: 3, path: "M 420 117 Q 470 125 520 158" },
    { from: 2, to: 4, path: "M 280 192 Q 330 220 370 233" },
    { from: 3, to: 4, path: "M 520 192 Q 470 220 430 233" },
    { from: 4, to: 5, path: "M 400 267 L 400 308" },
    { from: 5, to: 6, path: "M 380 342 Q 330 350 280 383" },
    { from: 5, to: 7, path: "M 420 342 Q 470 350 520 383" },
    { from: 6, to: 8, path: "M 280 417 Q 330 445 370 458" },
    { from: 7, to: 8, path: "M 520 417 Q 470 445 430 458" }
  ];

  const nodeDetails: Record<number, NodeDetail> = {
    0: { title: "Raw Transaction Ingest", input: "Merchant webhooks & payment data", output: "SQLite transaction records", why: "Forms the raw temporal database for Sentinel's pattern recognition." },
    1: { title: "Feature Pipeline", input: "Structured transaction columns", output: "Tabular features + Graph Modularities", why: "Ensures network topology metrics are fed alongside transactional values." },
    2: { title: "Entity Extraction", input: "SQLite transaction tuples", output: "Indexed device & IP fingerprints", why: "Extracts primary identification nodes for graph connection creation." },
    3: { title: "Bipartite Linkages", input: "Identity node attributes", output: "Bipartite device-IP shared edges", why: "Builds connection links showing which distinct accounts share hardware details." },
    4: { title: "Louvain Community Engine", input: "Shared device-IP graph linkages", output: "Community cluster (modularity class) assignments", why: "Identifies hidden fraud ring structures (rings) bypassing typical velocity rules." },
    5: { title: "XGBoost Classifier Scorer", input: "Local metadata + Global ring properties", output: "Continuous risk probability [0.0 - 1.0]", why: "Fuses local transaction details with graph features to compute precise threat scores." },
    6: { title: "Threshold Classifier", input: "XGBoost continuous risk score", output: "LOW, REVIEW, or HOLD risk tiers", why: "Splits probability ranges to group accounts based on optimal cost-model thresholds (0.26)." },
    7: { title: "Severity Queue Ranking", input: "Classified account list", output: "Ordered pending review items", why: "Ensures investigators prioritize high-value/high-risk anomalies, minimizing fraud exposure." },
    8: { title: "Sentinel Human Review Console", input: "Ordered review queue", output: "Approve, Escalate, or Dismiss actions logged to audit trail", why: "Fosters human accountability over payment routing. The system strictly disables auto-blocking." }
  };

  const getPathClass = (conn: Connection) => {
    if (activeNode === null) return "stroke-slate-700/50";
    if (conn.from === activeNode || conn.to === activeNode) {
      return "stroke-brand-accent/80 stroke-[2.5px]";
    }
    return "stroke-slate-800/20";
  };

  const getNodeClass = (node: ArchNode) => {
    if (activeNode === null) return "border-brand-border hover:border-slate-600 bg-brand-panel/60 text-slate-300";
    if (node.id === activeNode) {
      return "border-brand-accent/80 text-brand-accent font-bold bg-brand-accent/5 glow-blue";
    }
    const isConnected = connections.some(c => (c.from === activeNode && c.to === node.id) || (c.to === activeNode && c.from === node.id));
    if (isConnected) {
      return "border-brand-border/90 text-slate-200 bg-brand-panel-light/40";
    }
    return "border-brand-border/30 text-slate-600 bg-brand-panel/10 opacity-30";
  };

  const details = activeNode !== null ? nodeDetails[activeNode] : null;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      {/* SVG Interactive Map */}
      <div className="lg:col-span-3 bg-brand-panel border border-brand-border rounded-xl p-4 md:p-6 overflow-x-auto relative flex justify-center shadow-inner">
        <svg width="680" height="520" className="overflow-visible select-none">
          {/* Connection Lines */}
          {connections.map((conn, idx) => (
            <g key={idx}>
              <path 
                d={conn.path} 
                fill="none" 
                className={`transition-all duration-300 ${getPathClass(conn)}`}
                strokeWidth="1.5" 
              />
              {/* Glowing animated data particle */}
              {(activeNode === null || conn.from === activeNode || conn.to === activeNode) && (
                <circle r="2.5" fill={conn.from === activeNode || conn.to === activeNode ? "var(--accent)" : "#4b5563"}>
                  <animateMotion dur={conn.from === activeNode || conn.to === activeNode ? "1.8s" : "3.5s"} repeatCount="indefinite" path={conn.path} />
                </circle>
              )}
            </g>
          ))}

          {/* Render Interactive Nodes */}
          {nodes.map((node) => {
            const isClickable = true;
            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x - 70}, ${node.y - 17})`}
                onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                className="cursor-pointer group"
              >
                {/* Node Box */}
                <rect 
                  width="140" 
                  height="34" 
                  rx="6" 
                  className={`fill-brand-panel transition-all duration-300 stroke-[1.5px] ${
                    node.id === activeNode 
                      ? 'stroke-brand-accent fill-brand-accent/5' 
                      : 'stroke-brand-border group-hover:stroke-slate-600'
                  }`}
                />
                
                {/* Text Label */}
                <text 
                  x="70" 
                  y="17" 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  className={`font-mono text-[10px] tracking-wider select-none pointer-events-none transition-all duration-300 ${
                    node.id === activeNode 
                      ? 'fill-brand-accent font-bold' 
                      : 'fill-slate-300 group-hover:fill-slate-100'
                  }`}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail description sidebar */}
      <div className="lg:col-span-2 space-y-4">
        <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest block">Node Inspector</span>
        {details ? (
          <div className="bg-brand-panel border-2 border-brand-accent/40 rounded-xl p-5 md:p-6 space-y-4 animate-in fade-in duration-200 glow-blue">
            <div>
              <span className="text-[9px] font-mono tracking-widest text-brand-accent uppercase font-bold">STAGE DETAILED LOG</span>
              <h4 className="text-[16px] font-bold text-slate-100 mt-1">{details.title}</h4>
            </div>

            <div className="space-y-3 font-mono text-[11px] leading-relaxed">
              <div className="p-2.5 bg-brand-bg border border-brand-border rounded">
                <span className="text-slate-500 uppercase block text-[8px] tracking-wider">Inflow Feed</span>
                <span className="text-slate-300">{details.input}</span>
              </div>
              <div className="p-2.5 bg-brand-bg border border-brand-border rounded">
                <span className="text-slate-500 uppercase block text-[8px] tracking-wider">Outflow Stream</span>
                <span className="text-slate-300">{details.output}</span>
              </div>
            </div>

            <p className="text-[12.5px] text-slate-400 font-sans leading-relaxed pt-2 border-t border-brand-border">
              {details.why}
            </p>

            <button 
              onClick={() => setActiveNode(null)}
              className="w-full py-2 bg-brand-bg border border-brand-border hover:bg-brand-panel-light text-[10px] font-semibold text-slate-400 hover:text-slate-350 rounded font-mono cursor-pointer transition-colors"
            >
              ✕ Collapse Inspection
            </button>
          </div>
        ) : (
          <div className="bg-brand-panel border border-brand-border border-dashed rounded-xl p-6 h-[260px] flex flex-col items-center justify-center text-center text-slate-500 font-sans space-y-2">
            <Info className="h-6 w-6 text-slate-600" />
            <div>
              <p className="text-xs font-semibold text-slate-400">Interactive Diagram Mode</p>
              <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto mt-1">
                Click any node in the architecture diagram to inspect data inflows, processes, outputs, and pipeline connections.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// MAIN PAGE EXPORT
export default function PresentationApp() {
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
      { threshold: 0.05 }
    );

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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

  return (
    <div className="min-h-screen bg-brand-bg text-slate-300 font-sans select-none scroll-smooth overflow-x-hidden relative bg-grid-overlay">
      <CustomStyles />
      
      {/* Top sticky nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-brand-bg/85 backdrop-blur-md border-b border-brand-border z-50">
        <div className="max-w-[1000px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-accent animate-pulse" />
            <span className="font-mono font-bold tracking-wider text-slate-100 text-[13px] uppercase">
              Sentinel Presentation
            </span>
          </div>
          <a
            href="/"
            className="px-4 py-1.5 bg-brand-accent hover:bg-blue-600 text-white rounded text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_2px_12px_rgba(59,130,246,0.25)]"
          >
            Open Live System <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </nav>

      {/* SECTION 1: HERO (Cinematic interactive visualizer) */}
      <section className="relative min-h-[95vh] flex items-center justify-center border-b border-brand-border pt-16">
        <NetworkVisual />

        <div className="max-w-[760px] mx-auto px-6 text-center space-y-6 z-10 reveal" style={{ transitionDelay: '100ms' }}>
          <span className="text-[11px] font-bold tracking-[0.25em] text-brand-accent uppercase font-mono px-3 py-1 bg-brand-accent/10 border border-brand-accent/25 rounded-full inline-block">
            THE SYSTEM LOGIC
          </span>
          <h1 className="text-[40px] md:text-[58px] font-extrabold text-slate-100 leading-[1.1] tracking-tight font-sans">
            Fraud rings hide in plain sight. <br className="hidden md:inline" />
            Sentinel uncovers coordinated abuse.
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-[620px] mx-auto leading-relaxed">
            Traditional systems inspect transactions individually, missing the coordinated networks hiding behind shared devices, IPs, and address combinations.
          </p>
          <div className="text-[12px] font-mono text-slate-500 uppercase tracking-widest pt-2">
            Move mouse to inspect node coordinates • Scroll to unfold system architecture
          </div>

          {/* False-Positive Research Warning */}
          <div className="max-w-[580px] mx-auto p-4 bg-brand-panel/75 border border-brand-border rounded-lg flex items-start gap-3 text-left font-sans text-xs text-slate-400 leading-relaxed mt-8 shadow-2xl backdrop-blur">
            <AlertCircle className="h-5 w-5 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-350 block mb-0.5">Friction Cost Over Fraud Loss</strong>
              Multiple 2025-2026 risk reports (cited in Visa and J.P. Morgan research) show that wrong blocks (false positives) cost merchants more than fraud itself, as blocked customers often permanently abandon platforms.
            </div>
          </div>
        </div>
      </section>


      {/* SECTION 2: INTERACTIVE REVEAL FLASHCARDS */}
      <section className="py-24 border-b border-brand-border bg-brand-panel/10">
        <div className="max-w-[1000px] mx-auto px-6 space-y-12">
          <div className="max-w-[640px] space-y-3 reveal">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-accent uppercase font-mono block">
              CORE SYSTEM CONCEPT
            </span>
            <h2 className="text-[28px] font-extrabold text-slate-100 tracking-tight font-sans">
              Discover the Sentinel pipeline logic
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              Click the reveal cards below to flip and inspect the system objectives, data inputs, AI scoring mechanics, and manual review routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal" style={{ transitionDelay: '100ms' }}>
            <RevealCard 
              title="CARD 01: THE PROBLEM"
              question="What is the primary vulnerability Sentinel addresses?"
              answer="Coordinated fraud rings. Bad actors distribute attacks across multiple separate accounts using shared hardware devices and IP subnets to bypass single-velocity transaction filters."
              details="Vulnerability: Individual reviews miss the connection."
              accentColor="blue"
            />
            <RevealCard 
              title="CARD 02: SYSTEM INPUTS"
              question="What data points are required by the pipeline?"
              answer="Raw e-commerce transaction details, billing address strings, payment methods, user IDs, raw network subnets, and hardware device fingerprints."
              details="Input source: Relational SQLite database exports."
              accentColor="cyan"
            />
            <RevealCard 
              title="CARD 03: HYBRID AI"
              question="How does the AI process and evaluate the score?"
              answer="An XGBoost classifier combines local transaction features (e.g. amount) with modularity network metrics (e.g. cluster historical fraud rates) to predict an anomaly score."
              details="Architecture: NetworkX bipartite graph + XGBoost."
              accentColor="lavender"
            />
            <RevealCard 
              title="CARD 04: RELATIONSHIPS"
              question="How are account-to-account connections established?"
              answer="By linking users into a bipartite shared-attribute graph whenever they access the merchant using identical device fingerprints, IP addresses, or credit details."
              details="Engine: Shared attribute edges build rings."
              accentColor="mint"
            />
            <RevealCard 
              title="CARD 05: RISK ANALYSIS"
              question="How is threat priority calculated?"
              answer="Calculates continuous risk probability [0.0 - 1.0]. Uses a cost model balancing manual review friction ($2.00) against chargeback losses ($52.00) to find the optimal alert limit."
              details="Optimal threshold: 0.26 (Cost: $48,061.18)"
              accentColor="blue"
            />
            <RevealCard 
              title="CARD 06: HUMAN CONTROL"
              question="What happens once coordination is flagged?"
              answer="Routed to Review Queue. Decisions are kept strictly manual (Approve, Escalate, Dismiss) and logged. Sentinel has absolutely zero automated block functionality."
              details="Policy: 100% human-in-the-loop compliance."
              accentColor="cyan"
            />
          </div>
        </div>
      </section>


      {/* SECTION 3: LIVING SYSTEM FLOW & INTERACTIVE ARCHITECTURE */}
      <section className="py-24 border-b border-brand-border bg-brand-bg/50">
        <div className="max-w-[1000px] mx-auto px-6 space-y-12">
          <div className="max-w-[640px] space-y-3 reveal">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-accent uppercase font-mono block">
              SYSTEM INFRASTRUCTURE
            </span>
            <h2 className="text-[28px] font-extrabold text-slate-100 tracking-tight font-sans">
              Interactive System Flow Architecture
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              Click on any stage box below to highlight data connection lines, inspect inputs, processes, and check how metrics travel through the decision layers.
            </p>
          </div>

          <div className="reveal" style={{ transitionDelay: '100ms' }}>
            <InteractiveArchitecture />
          </div>
        </div>
      </section>


      {/* SECTION 4: SIMULATION - WATCH THE SYSTEM WORK */}
      <section className="py-24 border-b border-brand-border bg-brand-panel/10">
        <div className="max-w-[1000px] mx-auto px-6 space-y-12">
          <div className="max-w-[640px] space-y-3 reveal">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-accent uppercase font-mono block">
              LIVE SIMULATION
            </span>
            <h2 className="text-[28px] font-extrabold text-slate-100 tracking-tight font-sans">
              Watch the decision engine run in real time
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              Click the controller buttons to simulate a transaction webhook. Inspect how the data shifts, updates the Louvain network ring, calculates SHAP drivers, and flags reviewer alert logs.
            </p>
          </div>

          <div className="reveal" style={{ transitionDelay: '100ms' }}>
            <SystemSimulation />
          </div>
        </div>
      </section>


      {/* SECTION 5: REAL RESULTS */}
      <section className="py-24 border-b border-brand-border">
        <div className="max-w-[760px] mx-auto px-6 space-y-12">
          
          <div className="space-y-3 reveal">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-accent uppercase font-mono block">
              REAL RESULTS
            </span>
            <h2 className="text-[28px] font-extrabold text-slate-100 tracking-tight font-sans">
              Tested on real transaction data.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              We evaluated the fusion model on a historical cohort of 151,112 transactions. The results represent an honest performance assessment under strict temporal constraints:
            </p>
          </div>

          {/* Metrics Displays */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono reveal" style={{ transitionDelay: '100ms' }}>
            <div className="p-5 bg-brand-panel border border-brand-border rounded-lg">
              <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Precision</span>
              <span className="text-3xl font-bold text-slate-200 mt-1 block">23.09%</span>
            </div>
            <div className="p-5 bg-brand-panel border border-brand-border rounded-lg">
              <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Recall</span>
              <span className="text-3xl font-bold text-slate-200 mt-1 block">37.80%</span>
            </div>
            <div className="p-5 bg-brand-panel border border-brand-border rounded-lg col-span-2 md:col-span-1">
              <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">F1-Score</span>
              <span className="text-3xl font-bold text-slate-200 mt-1 block">28.67%</span>
            </div>
            <div className="p-5 bg-brand-panel border border-brand-border rounded-lg col-span-2">
              <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Test Dataset Volume</span>
              <span className="text-sm font-bold text-slate-350 mt-1 block">30,222 transactions • 1,389 fraud cases</span>
            </div>
          </div>

          {/* Temporal Split Callout */}
          <div className="p-4 bg-brand-panel/30 border border-brand-border/60 rounded-lg text-xs leading-relaxed space-y-3 reveal" style={{ transitionDelay: '150ms' }}>
            <span className="font-bold text-slate-350 block font-mono">No Future Data Leakage</span>
            <p className="text-slate-450">
              In fraud research, using random train-test splits creates leakage (the graph links transactions across time, giving the model future knowledge). Sentinel is split purely on time (Day 45 boundary). Training features never incorporate subsequent relations, simulating actual deployment conditions.
            </p>
          </div>

          <div className="pt-2 reveal" style={{ transitionDelay: '200ms' }}>
            <a 
              href="/"
              className="inline-flex px-6 py-3 bg-brand-accent hover:bg-blue-600 text-white font-semibold rounded-lg items-center gap-2 transition-all text-sm font-mono cursor-pointer shadow-[0_2px_10px_rgba(59,130,246,0.2)]"
            >
              Open the Live System <ArrowRight className="h-4 w-4" />
            </a>
          </div>

        </div>
      </section>


      {/* SECTION 6: ENGINEERING DECISIONS */}
      <section className="py-24 border-b border-brand-border bg-brand-panel/10">
        <div className="max-w-[760px] mx-auto px-6 space-y-12">
          
          <div className="space-y-3 reveal">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-accent uppercase font-mono block">
              ENGINEERING DECISIONS
            </span>
            <h2 className="text-[28px] font-extrabold text-slate-100 tracking-tight font-sans">
              Every important choice has a reason.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              We justify our architecture choices based on empirical results, failure recovery stories, and actual cost curves:
            </p>
          </div>

          {/* Cards Table */}
          <div className="border border-brand-border rounded-lg overflow-hidden bg-brand-panel/20 font-mono text-[11.5px] reveal" style={{ transitionDelay: '100ms' }}>
            
            <div className="p-4 border-b border-brand-border grid grid-cols-1 md:grid-cols-3 gap-2">
              <span className="text-slate-300 font-bold">Graph + Tabular</span>
              <p className="md:col-span-2 text-slate-400 font-sans text-xs leading-relaxed">
                Fusing transaction-level attributes with Louvain community attributes (modularity partitioning) uncovers group abuse vectors that typical rules engines ignore.
              </p>
            </div>

            <div className="p-4 border-b border-brand-border grid grid-cols-1 md:grid-cols-3 gap-2">
              <span className="text-slate-300 font-bold">Temporal Split</span>
              <p className="md:col-span-2 text-slate-400 font-sans text-xs leading-relaxed">
                Splitting train/test split purely chronologically at Day 45 blocks future data leakage, preventing inflated evaluation figures.
              </p>
            </div>

            <div className="p-4 border-b border-brand-border grid grid-cols-1 md:grid-cols-3 gap-2">
              <span className="text-slate-300 font-bold">XGBoost + SHAP</span>
              <p className="md:col-span-2 text-slate-400 font-sans text-xs leading-relaxed">
                Lightweight classifiers combined with additive local SHAP features provide auditable explanations for reviewers, running easily inside free-tier constraints.
              </p>
            </div>

            <div className="p-4 border-b border-brand-border grid grid-cols-1 md:grid-cols-3 gap-2">
              <span className="text-slate-300 font-bold">Target Leakage Fix</span>
              <p className="md:col-span-2 text-slate-400 font-sans text-xs leading-relaxed flex flex-col gap-1">
                <span className="text-risk-review font-bold">Leakage Bug Identified & Fixed:</span>
                <span className="font-sans">
                  Computing the cluster's historical fraud rate by including the current transaction's label causes target leakage. We implemented a <strong>leave-one-out</strong> cluster fraud calculation that excludes the target transaction's label, resolving the leakage bug.
                </span>
              </p>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <span className="text-slate-300 font-bold">Cost-Based threshold</span>
              <p className="md:col-span-2 text-slate-400 font-sans text-xs leading-relaxed">
                Using `data/cost_curve.json`, we bypass standard 0.5 decision boundaries. A cost model balancing manual review friction ($2.00/review) against missed fraud chargebacks ($52.00/loss) defines an optimal threshold at **0.26**, minimizing simulated cost to **$48,061.18**.
              </p>
            </div>

          </div>

          {/* References */}
          <div className="space-y-3 font-mono text-[11px] text-slate-500 pt-4 reveal" style={{ transitionDelay: '150ms' }}>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Academic References</span>
            <ul className="space-y-2 list-disc pl-4 font-sans text-slate-450 text-[12px]">
              <li>
                Visa Research & Camouflaged Fraud: <a href="https://arxiv.org/pdf/2411.05815" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">camouflaged fraudsters graph neural networks review</a>
              </li>
              <li>
                J.P. Morgan Case Study (Friction vs Fraud): <a href="https://www.jpmorgan.com/insights/payments/data-intelligence/cnp-fraud-prevention-combat-chargebacks" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">card-not-present chargeback study</a>
              </li>
              <li>
                Expected cost modeling in payment networks (Javelin Strategy & Aite Group): <a href="https://www.fluxforce.ai/blog/false-positives-in-fraud-detection-why-they-cost-more-than-actual-fraud" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">expected cost modeling</a>
              </li>
            </ul>
          </div>

        </div>
      </section>


      {/* SECTION 7: DEFENSE-ONLY COMPLIANCE */}
      <section className="py-24 border-b border-brand-border bg-brand-bg/50">
        <div className="max-w-[760px] mx-auto px-6 space-y-8">
          
          <div className="space-y-3 reveal">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-accent uppercase font-mono block">
              DEFENSE-ONLY BY DESIGN
            </span>
            <h2 className="text-[28px] font-extrabold text-slate-100 tracking-tight font-sans">
              Every score ends with a human. Nothing ends with an automatic block.
            </h2>
          </div>

          {/* Three Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px] reveal" style={{ transitionDelay: '100ms' }}>
            <div className="p-4 bg-brand-panel border border-brand-border rounded flex flex-col justify-between">
              <span className="text-brand-accent font-bold block mb-1">HUMAN IN THE LOOP</span>
              <span className="text-slate-400 font-sans text-xs leading-relaxed">
                The system outputs risk scores and attributes reasons. Reviewers perform final actions; no automated blocks are enabled.
              </span>
            </div>
            <div className="p-4 bg-brand-panel border border-brand-border rounded flex flex-col justify-between">
              <span className="text-brand-accent font-bold block mb-1">FULL AUDIT LEDGER</span>
              <span className="text-slate-400 font-sans text-xs leading-relaxed">
                Every review state modification is recorded on a write-only log, ensuring historical accountability.
              </span>
            </div>
            <div className="p-4 bg-brand-panel border border-brand-border rounded flex flex-col justify-between">
              <span className="text-brand-accent font-bold block mb-1">STRICTLY PROTECTIVE</span>
              <span className="text-slate-400 font-sans text-xs leading-relaxed">
                Zero scanner, recon, or offensive components are contained in the codebase. The app is purely defense-only.
              </span>
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 8: CLOSING */}
      <section className="py-32 text-center bg-gradient-to-b from-brand-bg to-[#0d0d0e]">
        <div className="max-w-[760px] mx-auto px-6 space-y-12 reveal">
          
          <div className="space-y-4">
            <h2 className="text-[32px] md:text-[40px] font-extrabold text-slate-100 tracking-tight">
              Built for the Razorpay AI Buildathon 2026
            </h2>
            <span className="text-[12px] font-mono tracking-widest text-slate-500 uppercase block">
              AI Risk Manager Track (Track 02)
            </span>
            <p className="text-slate-400 max-w-[580px] mx-auto text-sm leading-relaxed">
              Abuse-Ring Sentinel brings together transaction intelligence, network relationships, explainable AI, and human judgment to help reviewers see coordinated risk that individual transactions can hide.
            </p>
          </div>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-[520px] mx-auto font-mono text-xs">
            <a 
              href="/"
              className="flex-1 px-5 py-3 bg-brand-accent hover:bg-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-[0_2px_10px_rgba(59,130,246,0.25)]"
            >
              Open Live System <ArrowRight className="h-4 w-4" />
            </a>
            <a 
              href="https://github.com/Nandini-Singh/Abuse-Ring-Sentinel" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 px-5 py-3 border border-brand-border hover:bg-brand-panel-light text-slate-350 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              View GitHub Repo
            </a>
            <button 
              onClick={() => {
                alert("Opening original extracted proposal document: Abuse_Ring_Sentinel_Project_Proposal");
              }} 
              className="flex-1 px-5 py-3 border border-brand-border hover:bg-brand-panel-light text-slate-350 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              Read Full Proposal
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-600 uppercase tracking-widest pt-8">
            Built by Nandini Singh • AI Risk Manager Track • Razorpay AI Buildathon 2026
          </div>

        </div>
      </section>

    </div>
  );
}
