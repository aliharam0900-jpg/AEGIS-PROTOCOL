import React, { useEffect, useState } from 'react';
import {
  Download,
  X,
  Cpu,
  GitCompare,
  FileCode2,
  BookOpen,
  Play,
  CheckCircle2,
  AlertTriangle,
  LineChart,
} from 'lucide-react';
import {
  AIStepResponse,
  KNNEvaluationResponse,
  SearchAlgorithmId,
} from '../types/game';
import {
  ACADEMIC_REPORT_SECTIONS,
  VIVA_QUESTIONS,
} from '../data/academicReport';
import { executeFallbackEvaluation } from '../ai/fallbackEngine';
import { SearchExpansionD3 } from './SearchExpansionD3';

export type AILabTabId = 'search' | 'd3_expansion' | 'ml' | 'python' | 'report';

interface AILabModalProps {
  isOpen: boolean;
  onClose: () => void;
  grid: number[][];
  trackerPos: [number, number];
  operativePos: [number, number];
  aiTelemetry: AIStepResponse;
  activeAlgorithm: SearchAlgorithmId;
  onSelectAlgorithm: (alg: SearchAlgorithmId) => void;
  knnK: number;
  onChangeKnnK: (k: number) => void;
  initialTab?: AILabTabId;
}

export const AILabModal: React.FC<AILabModalProps> = ({
  isOpen,
  onClose,
  grid,
  trackerPos,
  operativePos,
  aiTelemetry,
  activeAlgorithm,
  onSelectAlgorithm,
  knnK,
  onChangeKnnK,
  initialTab = 'search',
}) => {
  const [activeTab, setActiveTab] = useState<AILabTabId>(initialTab);
  const [knnEvalData, setKnnEvalData] = useState<KNNEvaluationResponse>(() =>
    executeFallbackEvaluation(knnK)
  );
  const [pythonSource, setPythonSource] = useState<string>('');
  const [cliOutput, setCliOutput] = useState<string>('');
  const [loadingPython, setLoadingPython] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch('/api/ai/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ k: knnK }),
    })
      .then((r) => r.json())
      .then((data: KNNEvaluationResponse) => {
        if (!cancelled && data?.evaluation) {
          setKnnEvalData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setKnnEvalData(executeFallbackEvaluation(knnK));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, knnK]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'python' || pythonSource) return;
    setLoadingPython(true);
    fetch('/api/ai/python-source')
      .then((r) => r.json())
      .then((data) => {
        if (data?.sourceCode) {
          setPythonSource(data.sourceCode);
          setCliOutput(data.cliDemoOutput || '');
        }
      })
      .catch(() => {
        setCliOutput('Python 3 AI Engine active.');
      })
      .finally(() => setLoadingPython(false));
  }, [isOpen, activeTab, pythonSource]);

  if (!isOpen) return null;

  const { comparison, overmind } = aiTelemetry;
  const evalMetrics = knnEvalData.evaluation;
  const maxExpanded = Math.max(
    1,
    comparison.astar.nodesExpandedCount,
    comparison.bfs.nodesExpandedCount,
    comparison.gbfs.nodesExpandedCount
  );

  const handleDownloadPython = () => {
    const content =
      pythonSource ||
      '# Run python3 ai_engine.py --demo to view full Search + KNN evaluation.\n';
    const blob = new Blob([content], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_engine.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    const lines: string[] = [
      '# AEGIS PROTOCOL: Adaptive Cyber Evasion',
      'Subtitle: An Autonomous Drone Pursuit & Behavioral Profiling Simulator',
      '',
      '## Live Experimental Metrics Snapshot',
      `- A* Search: Cost=${comparison.astar.pathCost}, Steps=${comparison.astar.pathSteps}, Nodes Expanded=${comparison.astar.nodesExpandedCount}, Time=${comparison.astar.executionTimeMs}ms`,
      `- Breadth-First Search (BFS): Cost=${comparison.bfs.pathCost}, Steps=${comparison.bfs.pathSteps}, Nodes Expanded=${comparison.bfs.nodesExpandedCount}, Time=${comparison.bfs.executionTimeMs}ms`,
      `- Greedy Best-First Search (GBFS): Cost=${comparison.gbfs.pathCost}, Steps=${comparison.gbfs.pathSteps}, Nodes Expanded=${comparison.gbfs.nodesExpandedCount}, Time=${comparison.gbfs.executionTimeMs}ms`,
      `- Overmind KNN (K=${evalMetrics.k}): Accuracy=${evalMetrics.accuracy}%, Error Rate=${evalMetrics.errorRate}%, Macro Precision=${evalMetrics.macroPrecision}%, Macro Recall=${evalMetrics.macroRecall}%`,
      '',
    ];

    ACADEMIC_REPORT_SECTIONS.forEach((sec) => {
      lines.push(`## ${sec.number}. ${sec.title}`);
      sec.paragraphs.forEach((p) => {
        lines.push(p, '');
      });
      if (sec.bullets) {
        sec.bullets.forEach((b) => lines.push(`- ${b}`));
        lines.push('');
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AEGIS_PROTOCOL_AI_Lab_Report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 md:p-6">
      <div className="flex flex-col w-full max-w-6xl h-[88vh] bg-[#121521] border border-[#2a2e42] rounded-xl overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-[#0d0f18] border-b border-[#2a2e42]">
          <div>
            <h2 className="font-display text-lg md:text-xl font-bold text-slate-100 tracking-wide">
              AI Lab Evaluation & Academic Deliverables Suite
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              <span>Engine: {aiTelemetry.engine}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Component 1: Graph Search (A*, BFS, GBFS)</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Component 2: Overmind KNN Classifier (K={knnK})</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#1e2235] hover:bg-[#282d46] rounded-lg border border-[#323854] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Return to Simulation</span>
          </button>
        </div>

        {/* Segmented Navigation Bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-[#151826] border-b border-[#24293d] overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-[#0b0d15] rounded-lg border border-[#22263a]">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'search'
                  ? 'bg-[#252b42] text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>01. Search Benchmark</span>
            </button>

            <button
              onClick={() => setActiveTab('d3_expansion')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'd3_expansion'
                  ? 'bg-[#252b42] text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>02. D3 Search Space Expansion</span>
            </button>

            <button
              onClick={() => setActiveTab('ml')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'ml'
                  ? 'bg-[#252b42] text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>03. KNN &amp; Confusion Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('python')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'python'
                  ? 'bg-[#252b42] text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>04. Python 3 Code</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'report'
                  ? 'bg-[#252b42] text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>05. Report &amp; Viva</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={handleDownloadPython}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-[#132a26] hover:bg-[#193833] border border-emerald-800/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ai_engine.py</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-[#122636] hover:bg-[#173247] border border-cyan-800/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report (.md)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SEARCH & PATHFINDING EVALUATION */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23283b]">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Real-Time Search & Pathfinding Evaluation on Active Grid
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Compares Path Cost, Steps, Number of Nodes Expanded, and Execution Time across A*, BFS, and Greedy Best-First Search.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Active Pursuit Solver:</span>
                  {(['astar', 'bfs', 'gbfs'] as SearchAlgorithmId[]).map((alg) => (
                    <button
                      key={alg}
                      onClick={() => onSelectAlgorithm(alg)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        activeAlgorithm === alg
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-[#1a1e2e] text-slate-400 border-[#282e45] hover:text-slate-200'
                      }`}
                    >
                      {alg === 'astar' ? 'A* Search' : alg === 'bfs' ? 'BFS' : 'Greedy Best-First'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparative Metrics Table */}
              <div className="bg-[#0e101a] border border-[#23283b] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#23283b] text-xs font-medium text-slate-400 bg-[#141826]">
                      <th className="py-3 px-4">Search Algorithm</th>
                      <th className="py-3 px-4">Evaluation Function</th>
                      <th className="py-3 px-4 text-right">Path Steps</th>
                      <th className="py-3 px-4 text-right">Weighted Cost</th>
                      <th className="py-3 px-4 text-right">Nodes Expanded</th>
                      <th className="py-3 px-4 text-right">Exec Time (ms)</th>
                      <th className="py-3 px-4">Optimality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1d2233] text-sm font-mono tabular-nums">
                    {(['astar', 'bfs', 'gbfs'] as SearchAlgorithmId[]).map((key) => {
                      const item = comparison[key];
                      const isCurrent = activeAlgorithm === key;
                      return (
                        <tr
                          key={key}
                          className={isCurrent ? 'bg-cyan-950/25' : 'hover:bg-[#141824]'}
                        >
                          <td className="py-3.5 px-4 font-sans font-medium text-slate-100">
                            <span>{item.algorithmLabel}</span>
                            {isCurrent && (
                              <span className="ml-2 text-xs text-cyan-400 font-normal">
                                · Active in 3D
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">
                            {key === 'astar'
                              ? 'f(n) = g(n) + w·h(n)'
                              : key === 'bfs'
                                ? 'FIFO Level Order g(n)'
                                : 'f(n) = h(n) Manhattan'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-200">
                            {item.pathSteps}
                          </td>
                          <td className="py-3.5 px-4 text-right text-cyan-300">
                            {item.pathCost.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-amber-300">
                            {item.nodesExpandedCount}
                          </td>
                          <td className="py-3.5 px-4 text-right text-emerald-300">
                            {item.executionTimeMs.toFixed(4)} ms
                          </td>
                          <td className="py-3.5 px-4 font-sans text-xs">
                            {item.optimalGuaranteed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Guaranteed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Heuristic Only
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Visual Bar Comparison & Integration Callout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 bg-[#0e101a] border border-[#23283b] rounded-lg space-y-4">
                  <h4 className="text-sm font-semibold text-slate-200">
                    Search Space Efficiency (Nodes Expanded Comparison)
                  </h4>
                  {(['astar', 'bfs', 'gbfs'] as SearchAlgorithmId[]).map((key) => {
                    const item = comparison[key];
                    const pct = Math.min(
                      100,
                      Math.round((item.nodesExpandedCount / maxExpanded) * 100)
                    );
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium">
                            {item.algorithmLabel}
                          </span>
                          <span className="font-mono tabular-nums text-slate-400">
                            {item.nodesExpandedCount} nodes · {item.pathSteps} steps
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-[#1a1f30] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              key === 'astar'
                                ? 'bg-violet-500'
                                : key === 'bfs'
                                  ? 'bg-sky-500'
                                  : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-5 bg-[#0e101a] border border-[#23283b] rounded-lg space-y-3">
                  <h4 className="text-sm font-semibold text-slate-200">
                    Two-Component AI Coupling: Overmind KNN → A* Search
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Instead of running A* with static terrain weights,{' '}
                    <strong className="text-cyan-300">The Overmind (KNN Classifier)</strong>{' '}
                    continuously profiles the human player’s movement habits and rewrites the A* cost function in real time:
                  </p>
                  <div className="p-3.5 bg-[#151928] border border-[#262c45] rounded-lg space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Detected Player Class:</span>
                      <span className="font-semibold text-cyan-300">
                        {overmind.predictedClass} ({overmind.confidence}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active A* Modulation:</span>
                      <span className="font-semibold text-rose-400">
                        {overmind.adaptation.strategyName}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono tabular-nums text-slate-300 pt-1">
                      <span>w_heuristic: {overmind.adaptation.heuristicWeight}</span>
                      <span>·</span>
                      <span>perimeter_cost: {overmind.adaptation.perimeterDiscount}</span>
                      <span>·</span>
                      <span>lead_steps: {overmind.adaptation.predictiveLeadSteps}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KNN MACHINE LEARNING EVALUATION & CONFUSION MATRIX */}
          {activeTab === 'ml' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23283b]">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Overmind K-Nearest Neighbors (KNN) Behavioral Evaluation
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Leave-One-Out Cross-Validation (LOOCV) & Boundary Perturbation Evaluation across {evalMetrics.totalSamples} labeled telemetry observations.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Hyperparameter K:</span>
                  {[1, 3, 5, 7, 9].map((kVal) => (
                    <button
                      key={kVal}
                      onClick={() => onChangeKnnK(kVal)}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer ${
                        knnK === kVal
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-[#1a1e2e] text-slate-400 border-[#282e45] hover:text-slate-200'
                      }`}
                    >
                      K = {kVal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top KPI Summary Strip */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div className="p-4 bg-[#0e101a] border border-[#23283b] rounded-lg">
                  <div className="text-xs text-slate-400">Overall Accuracy</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums mt-1">
                    {evalMetrics.accuracy.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                    {evalMetrics.correctPredictions} / {evalMetrics.totalSamples} correct
                  </div>
                </div>

                <div className="p-4 bg-[#0e101a] border border-[#23283b] rounded-lg">
                  <div className="text-xs text-slate-400">Error Rate</div>
                  <div className="text-2xl font-mono font-bold text-rose-400 tabular-nums mt-1">
                    {evalMetrics.errorRate.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    100% − Accuracy
                  </div>
                </div>

                <div className="p-4 bg-[#0e101a] border border-[#23283b] rounded-lg">
                  <div className="text-xs text-slate-400">Macro Precision</div>
                  <div className="text-2xl font-mono font-bold text-cyan-300 tabular-nums mt-1">
                    {evalMetrics.macroPrecision.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    TP / (TP + FP)
                  </div>
                </div>

                <div className="p-4 bg-[#0e101a] border border-[#23283b] rounded-lg">
                  <div className="text-xs text-slate-400">Macro Recall</div>
                  <div className="text-2xl font-mono font-bold text-violet-300 tabular-nums mt-1">
                    {evalMetrics.macroRecall.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    TP / (TP + FN)
                  </div>
                </div>

                <div className="p-4 bg-[#0e101a] border border-[#23283b] rounded-lg">
                  <div className="text-xs text-slate-400">Macro F1-Score</div>
                  <div className="text-2xl font-mono font-bold text-amber-300 tabular-nums mt-1">
                    {evalMetrics.macroF1.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Harmonic Mean
                  </div>
                </div>
              </div>

              {/* 4x4 Confusion Matrix & Per-Class Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 4x4 Confusion Matrix */}
                <div className="p-5 bg-[#0e101a] border border-[#23283b] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-200">
                      4×4 Confusion Matrix (K = {evalMetrics.k})
                    </h4>
                    <span className="text-xs text-slate-400">
                      Rows: Actual Class · Cols: Predicted Class
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse font-mono tabular-nums">
                      <thead>
                        <tr className="border-b border-[#23283b] text-slate-400">
                          <th className="py-2 px-2 text-left font-sans">Actual \ Pred</th>
                          {evalMetrics.classes.map((c) => (
                            <th key={c} className="py-2 px-2 text-center font-sans">
                              {c.split(' ')[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1d2233]">
                        {evalMetrics.confusionMatrix.map((row, rIdx) => (
                          <tr key={evalMetrics.classes[rIdx]}>
                            <td className="py-2.5 px-2 font-sans font-medium text-slate-300">
                              {evalMetrics.classes[rIdx]}
                            </td>
                            {row.map((val, cIdx) => {
                              const isDiag = rIdx === cIdx;
                              return (
                                <td
                                  key={cIdx}
                                  className={`py-2.5 px-2 text-center font-bold rounded ${
                                    isDiag
                                      ? 'bg-emerald-950/60 text-emerald-300'
                                      : val > 0
                                        ? 'bg-rose-950/40 text-rose-300'
                                        : 'text-slate-600'
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Per-Class Precision, Recall, F1 */}
                <div className="p-5 bg-[#0e101a] border border-[#23283b] rounded-lg space-y-3">
                  <h4 className="text-sm font-semibold text-slate-200">
                    Per-Class Classification Report
                  </h4>
                  <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                    <thead>
                      <tr className="border-b border-[#23283b] text-slate-400 font-sans">
                        <th className="py-2 px-2">Behavioral Class</th>
                        <th className="py-2 px-2 text-right">Precision</th>
                        <th className="py-2 px-2 text-right">Recall</th>
                        <th className="py-2 px-2 text-right">F1-Score</th>
                        <th className="py-2 px-2 text-right">Support</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1d2233]">
                      {evalMetrics.perClassMetrics.map((m) => (
                        <tr key={m.className}>
                          <td className="py-2.5 px-2 font-sans font-medium text-slate-200">
                            {m.className}
                          </td>
                          <td className="py-2.5 px-2 text-right text-cyan-300">
                            {m.precision.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-2 text-right text-violet-300">
                            {m.recall.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-2 text-right text-emerald-300">
                            {m.f1Score.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-400">
                            {m.support}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Live Player Feature Vector Breakdown */}
                  <div className="pt-3 border-t border-[#23283b]">
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      Live Operative 5D Telemetry Vector (Normalized [0, 1]):
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center font-mono text-xs">
                      {[
                        ['Interval', `${Math.round(overmind.rawFeatures[0])}ms`],
                        ['Turn Rate', overmind.rawFeatures[1].toFixed(2)],
                        ['Perimeter', overmind.rawFeatures[2].toFixed(2)],
                        ['Core Rush', overmind.rawFeatures[3].toFixed(2)],
                        ['Backtrack', overmind.rawFeatures[4].toFixed(2)],
                      ].map(([lbl, val]) => (
                        <div
                          key={lbl}
                          className="p-2 bg-[#151928] border border-[#262c45] rounded"
                        >
                          <div className="text-[10px] text-slate-400 font-sans">{lbl}</div>
                          <div className="text-cyan-300 font-semibold mt-0.5">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PYTHON 3 IMPLEMENTATION CODE & TERMINAL DEMO */}
          {activeTab === 'python' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23283b]">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Practical Python 3 Implementation (ai_engine.py)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Self-written, modular Python 3 implementation of A*, BFS, Greedy Best-First Search, and Distance-Weighted KNN with LOOCV evaluation.
                  </p>
                </div>

                <button
                  onClick={handleDownloadPython}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ai_engine.py for Submission</span>
                </button>
              </div>

              {cliOutput && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <Play className="w-3.5 h-3.5" />
                    <span>Live Output of `python3 ai_engine.py --demo` on Server:</span>
                  </div>
                  <pre className="p-4 bg-[#090b12] border border-[#23283b] rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    {cliOutput}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">
                  Full Source Code (`ai_engine.py`):
                </div>
                <pre className="p-4 bg-[#090b12] border border-[#23283b] rounded-lg text-xs font-mono text-slate-200 overflow-x-auto max-h-[420px] leading-relaxed select-text">
                  {loadingPython
                    ? 'Loading ai_engine.py from server...'
                    : pythonSource || 'Run python3 ai_engine.py --demo'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: 40-MARK ACADEMIC REPORT & VIVA GUIDE */}
          {activeTab === 'report' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#23283b]">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Complete Project Report & Viva Voce Preparation Guide
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Covers Abstract, Problem Statement, Methodology, Evaluation, Ethical Considerations, Limitations, References, and Viva Answers.
                  </p>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full Report (.md)</span>
                </button>
              </div>

              {/* Report Sections */}
              <div className="grid grid-cols-1 gap-5">
                {ACADEMIC_REPORT_SECTIONS.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-5 bg-[#0e101a] border border-[#23283b] rounded-lg space-y-3 select-text"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="font-display text-base font-bold text-slate-100">
                        {sec.number}. {sec.title}
                      </h4>
                      <span className="text-xs text-slate-400">{sec.summary}</span>
                    </div>

                    {sec.paragraphs.map((p, idx) => (
                      <p
                        key={idx}
                        className="text-sm text-slate-300 leading-relaxed max-w-[75ch]"
                      >
                        {p}
                      </p>
                    ))}

                    {sec.formula && (
                      <div className="p-3 bg-[#151928] border border-[#262c45] rounded font-mono text-xs text-cyan-300">
                        {sec.formula}
                      </div>
                    )}

                    {sec.bullets && (
                      <ul className="space-y-1.5 pt-1 text-xs text-slate-300 list-disc list-inside">
                        {sec.bullets.map((b, i) => (
                          <li key={i} className="leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Viva Voce Q&A Section */}
              <div className="space-y-4 pt-4 border-t border-[#23283b]">
                <h4 className="font-display text-base font-bold text-slate-100">
                  08. Presentation & Viva Voce Defense Questions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {VIVA_QUESTIONS.map((vq, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#0e101a] border border-[#23283b] rounded-lg space-y-2 select-text"
                    >
                      <div className="text-xs text-cyan-400 font-medium">
                        {vq.category}
                      </div>
                      <div className="text-sm font-semibold text-slate-100">
                        Q: {vq.q}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {vq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 (NEW): D3.JS SEARCH SPACE EXPANSION VISUALIZER */}
          {activeTab === 'd3_expansion' && (
            <SearchExpansionD3
              grid={grid}
              trackerPos={trackerPos}
              operativePos={operativePos}
              comparison={comparison}
            />
          )}
        </div>
      </div>
    </div>
  );
};
