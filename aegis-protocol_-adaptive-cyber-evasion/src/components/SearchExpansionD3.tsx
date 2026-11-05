import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { SearchAlgorithmId, SearchResult } from '../types/game';

interface SearchExpansionD3Props {
  grid: number[][];
  trackerPos: [number, number];
  operativePos: [number, number];
  comparison: {
    astar: SearchResult;
    bfs: SearchResult;
    gbfs: SearchResult;
  };
}

const ALG_META: Array<{
  id: SearchAlgorithmId;
  name: string;
  shortLabel: string;
  color: string;
  fillColor: string;
}> = [
  {
    id: 'astar',
    name: 'A* Search (f = g + w·h)',
    shortLabel: 'A* Search',
    color: '#A855F7',
    fillColor: 'rgba(168, 85, 247, 0.16)',
  },
  {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    shortLabel: 'BFS',
    color: '#38BDF8',
    fillColor: 'rgba(56, 189, 248, 0.16)',
  },
  {
    id: 'gbfs',
    name: 'Greedy Best-First (GBFS)',
    shortLabel: 'Greedy Best-First',
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.16)',
  },
];

function manhattanDist(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

export const SearchExpansionD3: React.FC<SearchExpansionD3Props> = ({
  grid,
  trackerPos,
  operativePos,
  comparison,
}) => {
  const maxSteps = Math.max(
    1,
    comparison.astar.expandedNodes.length,
    comparison.bfs.expandedNodes.length,
    comparison.gbfs.expandedNodes.length
  );

  const [currentStep, setCurrentStep] = useState<number>(maxSteps);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [chartMetric, setChartMetric] = useState<'distance' | 'cumulative'>('distance');

  const gridSvgRefs = useRef<Record<SearchAlgorithmId, SVGSVGElement | null>>({
    astar: null,
    bfs: null,
    gbfs: null,
  });
  const timeSeriesSvgRef = useRef<SVGSVGElement | null>(null);

  // Restart animation automatically when comparison data changes
  useEffect(() => {
    setCurrentStep(1);
    setIsPlaying(true);
  }, [comparison]);

  // Step playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(25, Math.round(90 / speedMultiplier));
    const timer = window.setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= maxSteps) {
          setIsPlaying(false);
          return maxSteps;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, maxSteps, speedMultiplier]);

  // 1. D3 Side-by-Side Grid Search Frontier Expansion Renderers
  useEffect(() => {
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 13;
    const size = 240;
    const margin = 10;
    const innerSize = size - margin * 2;
    const cellW = innerSize / cols;
    const cellH = innerSize / rows;

    ALG_META.forEach((alg) => {
      const svgEl = gridSvgRefs.current[alg.id];
      if (!svgEl) return;

      const res = comparison[alg.id];
      const expandedSlice = res.expandedNodes.slice(0, currentStep);
      const reachedGoal = currentStep >= res.expandedNodes.length;

      const expansionOrderMap = new Map<string, number>();
      expandedSlice.forEach(([x, z], idx) => {
        expansionOrderMap.set(`${x},${z}`, idx);
      });

      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();

      const g = svg
        .attr('viewBox', `0 0 ${size} ${size}`)
        .append('g')
        .attr('transform', `translate(${margin},${margin})`);

      // Build flat cell array for D3 data join
      const cells: Array<{ x: number; z: number; wall: number; expOrder?: number }> = [];
      for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
          cells.push({
            x,
            z,
            wall: grid[z][x],
            expOrder: expansionOrderMap.get(`${x},${z}`),
          });
        }
      }

      const colorScale = d3
        .scaleSequential(
          alg.id === 'astar'
            ? d3.interpolatePuRd
            : alg.id === 'bfs'
              ? d3.interpolateYlGnBu
              : d3.interpolateYlOrRd
        )
        .domain([0, Math.max(1, res.expandedNodes.length)]);

      // Render grid cells
      g.selectAll('rect.cell')
        .data(cells)
        .join('rect')
        .attr('class', 'cell')
        .attr('x', (d) => d.x * cellW + 0.6)
        .attr('y', (d) => d.z * cellH + 0.6)
        .attr('width', Math.max(1, cellW - 1.2))
        .attr('height', Math.max(1, cellH - 1.2))
        .attr('rx', 2)
        .attr('fill', (d) => {
          if (d.wall === 1) return '#272b3f';
          if (d.expOrder !== undefined) return colorScale(d.expOrder + 1);
          return '#0b0e17';
        })
        .attr('stroke', (d) => {
          if (d.expOrder !== undefined && d.expOrder === expandedSlice.length - 1) {
            return '#ffffff';
          }
          return '#181d2e';
        })
        .attr('stroke-width', (d) =>
          d.expOrder !== undefined && d.expOrder === expandedSlice.length - 1 ? 1.5 : 0.6
        );

      // Draw Optimal Reconstructed Path once Goal is reached (or partial frontier line)
      if (reachedGoal && res.path.length > 1) {
        const lineGen = d3
          .line<[number, number]>()
          .x((d) => (d[0] + 0.5) * cellW)
          .y((d) => (d[1] + 0.5) * cellH)
          .curve(d3.curveCatmullRom.alpha(0.5));

        g.append('path')
          .datum(res.path)
          .attr('fill', 'none')
          .attr('stroke', '#00FFFF')
          .attr('stroke-width', 2.6)
          .attr('stroke-linecap', 'round')
          .attr('d', lineGen);
      }

      // Render Hunter Start Marker (#FF0055)
      g.append('circle')
        .attr('cx', (trackerPos[0] + 0.5) * cellW)
        .attr('cy', (trackerPos[1] + 0.5) * cellH)
        .attr('r', cellW * 0.34)
        .attr('fill', '#FF0055')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.2);

      // Render Operative Goal Marker (#00FFFF)
      g.append('circle')
        .attr('cx', (operativePos[0] + 0.5) * cellW)
        .attr('cy', (operativePos[1] + 0.5) * cellH)
        .attr('r', cellW * 0.34)
        .attr('fill', '#00FFFF')
        .attr('stroke', '#090a10')
        .attr('stroke-width', 1.2);
    });
  }, [grid, trackerPos, operativePos, comparison, currentStep]);

  // 2. D3 Time-Series Animated Line & Area Chart
  useEffect(() => {
    const svgEl = timeSeriesSvgRef.current;
    if (!svgEl) return;

    const width = 880;
    const height = 250;
    const margin = { top: 20, right: 30, bottom: 38, left: 52 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Build time-series trajectories for all 3 algorithms up to currentStep
    const seriesData = ALG_META.map((alg) => {
      const nodes = comparison[alg.id].expandedNodes;
      const limit = Math.min(currentStep, nodes.length);
      const points: Array<{ step: number; val: number }> = [];

      for (let i = 0; i < limit; i++) {
        const coord = nodes[i];
        const val =
          chartMetric === 'distance'
            ? manhattanDist(coord, operativePos)
            : i + 1;
        points.push({ step: i + 1, val });
      }
      return {
        ...alg,
        points,
        totalNodes: nodes.length,
      };
    });

    const maxY =
      chartMetric === 'distance'
        ? Math.max(
            12,
            d3.max(seriesData, (s) => d3.max(s.points, (p) => p.val)) ?? 18
          )
        : maxSteps;

    const xScale = d3.scaleLinear().domain([1, Math.max(2, maxSteps)]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, maxY]).nice().range([innerH, 0]);

    // Horizontal gridlines
    g.append('g')
      .attr('class', 'grid-lines')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => '')
      )
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel
          .selectAll('line')
          .attr('stroke', '#1e2438')
          .attr('stroke-dasharray', '3,3')
      );

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat((d) => `Step ${d}`))
      .call((sel) => sel.select('.domain').attr('stroke', '#2e3652'))
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#94a3b8')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-size', '10px')
      );

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .call((sel) => sel.select('.domain').attr('stroke', '#2e3652'))
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#94a3b8')
          .attr('font-family', 'JetBrains Mono, monospace')
          .attr('font-size', '10px')
      );

    // Y-Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .text(
        chartMetric === 'distance'
          ? 'Heuristic Distance to Goal h(n)'
          : 'Cumulative Nodes Expanded'
      );

    const lineGen = d3
      .line<{ step: number; val: number }>()
      .x((d) => xScale(d.step))
      .y((d) => yScale(d.val))
      .curve(d3.curveMonotoneX);

    const areaGen = d3
      .area<{ step: number; val: number }>()
      .x((d) => xScale(d.step))
      .y0(innerH)
      .y1((d) => yScale(d.val))
      .curve(d3.curveMonotoneX);

    // Draw area & line for each algorithm
    seriesData.forEach((series) => {
      if (series.points.length === 0) return;

      g.append('path')
        .datum(series.points)
        .attr('fill', series.fillColor)
        .attr('d', areaGen);

      g.append('path')
        .datum(series.points)
        .attr('fill', 'none')
        .attr('stroke', series.color)
        .attr('stroke-width', 2.4)
        .attr('d', lineGen);

      const lastPt = series.points[series.points.length - 1];
      g.append('circle')
        .attr('cx', xScale(lastPt.step))
        .attr('cy', yScale(lastPt.val))
        .attr('r', 4.5)
        .attr('fill', series.color)
        .attr('stroke', '#090a10')
        .attr('stroke-width', 1.5);
    });

    // Playhead vertical indicator line
    g.append('line')
      .attr('x1', xScale(currentStep))
      .attr('x2', xScale(currentStep))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#00FFFF')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '4,4');
  }, [comparison, operativePos, currentStep, maxSteps, chartMetric]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Playback Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#23283b]">
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            D3.js Hunter Node Search Space Expansion Visualizer
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Animates step-by-step frontier node expansion and heuristic convergence across A* Search, BFS, and Greedy Best-First Search.
          </p>
        </div>

        {/* Interactive Animation Playback Bar */}
        <div className="flex flex-wrap items-center gap-2.5 bg-[#0d0f18] p-2 rounded-lg border border-[#23283d]">
          <button
            onClick={() => {
              if (currentStep >= maxSteps) setCurrentStep(1);
              setIsPlaying((p) => !p);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => {
              setCurrentStep(1);
              setIsPlaying(true);
            }}
            className="p-1.5 text-slate-300 hover:text-white bg-[#181c2c] border border-[#282f48] rounded-md cursor-pointer"
            title="Restart Expansion Animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <label htmlFor="d3-step-slider" className="text-xs font-mono text-slate-300 tabular-nums">
              Step: {currentStep} / {maxSteps}
            </label>
            <input
              id="d3-step-slider"
              type="range"
              min={1}
              max={maxSteps}
              value={currentStep}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentStep(Number(e.target.value));
              }}
              className="w-28 md:w-36 accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1 border-l border-[#23283d] pl-2">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2 py-1 text-xs font-mono rounded cursor-pointer ${
                  speedMultiplier === spd
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Side-by-Side D3 Search Space Expansion Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ALG_META.map((alg) => {
          const res = comparison[alg.id];
          const expandedNow = Math.min(currentStep, res.expandedNodes.length);
          const finished = currentStep >= res.expandedNodes.length;

          return (
            <div
              key={alg.id}
              className="p-4 bg-[#0e101a] border border-[#23283b] rounded-lg flex flex-col items-center space-y-3"
            >
              <div className="w-full flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-100">{alg.name}</span>
                <span
                  className={`font-mono tabular-nums ${
                    finished ? 'text-emerald-400 font-semibold' : 'text-amber-300'
                  }`}
                >
                  {finished ? `Goal Locked (${res.nodesExpandedCount}n)` : `Expanding: ${expandedNow}n`}
                </span>
              </div>

              <svg
                ref={(el) => {
                  gridSvgRefs.current[alg.id] = el;
                }}
                className="w-full max-w-[240px] aspect-square bg-[#080a10] rounded-lg border border-[#1d2233]"
              />

              <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums pt-1 border-t border-[#1b2030]">
                <span>Path Cost: {res.pathCost}</span>
                <span>·</span>
                <span>Steps: {res.pathSteps}</span>
                <span>·</span>
                <span>{res.executionTimeMs.toFixed(3)}ms</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom D3 Animated Multi-Series Time-Series Convergence Graph */}
      <div className="p-5 bg-[#0e101a] border border-[#23283b] rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-slate-100">
              Time-Series Convergence &amp; Frontier Expansion Curve
            </h4>
          </div>

          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              {ALG_META.map((alg) => (
                <div key={alg.id} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: alg.color }}
                  />
                  <span className="text-slate-300">{alg.shortLabel}</span>
                </div>
              ))}
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#090b12] rounded-lg border border-[#22263a]">
              <button
                onClick={() => setChartMetric('distance')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  chartMetric === 'distance'
                    ? 'bg-[#252b42] text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Heuristic Convergence h(n)
              </button>
              <button
                onClick={() => setChartMetric('cumulative')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  chartMetric === 'cumulative'
                    ? 'bg-[#252b42] text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cumulative Nodes
              </button>
            </div>
          </div>
        </div>

        <svg
          ref={timeSeriesSvgRef}
          className="w-full h-auto max-h-[260px] bg-[#090b12] rounded-lg border border-[#1d2233]"
        />
      </div>
    </div>
  );
};
