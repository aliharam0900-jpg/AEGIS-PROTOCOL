import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldAlert,
  Trophy,
  Compass,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { CyberGrid3D } from './components/CyberGrid3D';
import { AILabModal, AILabTabId } from './components/AILabModal';
import { SECTORS, generateProceduralSector } from './data/sectors';
import { executeFallbackStep } from './ai/fallbackEngine';
import { soundEngine } from './utils/soundEngine';
import {
  AIStepResponse,
  CameraPresetId,
  GamePhase,
  HazardZone,
  MoveRecord,
  SearchAlgorithmId,
  SectorConfig,
} from './types/game';

function manhattan(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function buildEffectiveGrid(baseGrid: number[][], hazards: HazardZone[]): number[][] {
  const cloned = baseGrid.map((row) => [...row]);
  for (const h of hazards) {
    if (h.state === 'locked' && cloned[h.z] && cloned[h.z][h.x] !== undefined) {
      cloned[h.z][h.x] = 1;
    }
  }
  return cloned;
}

function extract5DTelemetryFeatures(
  history: MoveRecord[],
  defaultFeatures = [265.0, 0.24, 0.25, 0.82, 0.08]
): number[] {
  if (history.length === 0) return defaultFeatures;
  const recent = history.slice(-10);
  const avgInterval =
    recent.reduce((acc, m) => acc + m.intervalMs, 0) / recent.length;

  let turns = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].dx !== recent[i - 1].dx || recent[i].dz !== recent[i - 1].dz) {
      turns++;
    }
  }
  const directionChangeRate =
    recent.length > 1 ? turns / (recent.length - 1) : 0.22;

  const perimeterRatio =
    recent.filter((m) => m.isPerimeter).length / recent.length;
  const coreApproachRate =
    recent.filter((m) => m.approachedCore).length / recent.length;
  const backtrackRate =
    recent.filter((m) => m.isBacktrack).length / recent.length;

  return [
    Number(avgInterval.toFixed(1)),
    Number(directionChangeRate.toFixed(3)),
    Number(perimeterRatio.toFixed(3)),
    Number(coreApproachRate.toFixed(3)),
    Number(backtrackRate.toFixed(3)),
  ];
}

export default function App() {
  const [sectors, setSectors] = useState<SectorConfig[]>(() => [
    ...SECTORS,
    generateProceduralSector(104729),
  ]);
  const [selectedSectorIdx, setSelectedSectorIdx] = useState<number>(0);
  const currentSector = sectors[selectedSectorIdx];

  const [phase, setPhase] = useState<GamePhase>('title');
  const [operativePos, setOperativePos] = useState<[number, number]>(
    currentSector.operativeStart
  );
  const [trackerPos, setTrackerPos] = useState<[number, number]>(
    currentSector.trackerStart
  );
  const [remainingCores, setRemainingCores] = useState<[number, number][]>(
    currentSector.dataCores
  );
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [hazardAlert, setHazardAlert] = useState<string | null>(null);
  const [empCharges, setEmpCharges] = useState<number>(currentSector.empCharges);
  const [trackerStunTurns, setTrackerStunTurns] = useState<number>(0);
  const [empWaveTrigger, setEmpWaveTrigger] = useState<number>(0);

  const [turnCount, setTurnCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [algorithm, setAlgorithm] = useState<SearchAlgorithmId>('astar');
  const [knnK, setKnnK] = useState<number>(5);
  const [showFrontier, setShowFrontier] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('isometric');
  const [cameraZoom] = useState<number>(1.0);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const [labModalOpen, setLabModalOpen] = useState<boolean>(false);
  const [labInitialTab, setLabInitialTab] = useState<AILabTabId>('d3_expansion');

  const moveHistoryRef = useRef<MoveRecord[]>([]);
  const lastMoveTimeRef = useRef<number>(performance.now());
  const stepBusyRef = useRef<boolean>(false);

  const [aiTelemetry, setAiTelemetry] = useState<AIStepResponse>(() =>
    executeFallbackStep({
      grid: currentSector.grid,
      trackerPos: currentSector.trackerStart,
      playerPos: currentSector.operativeStart,
      cores: currentSector.dataCores,
      hazardZones: [],
      algorithm: 'astar',
      features: [265.0, 0.24, 0.25, 0.82, 0.08],
      k: 5,
    })
  );

  // Sync AI preview whenever algorithm, K, or sector changes
  const refreshAISnapshot = useCallback(
    async (
      grid: number[][],
      tPos: [number, number],
      pPos: [number, number],
      cores: [number, number][],
      alg: SearchAlgorithmId,
      kVal: number,
      currentHazards: HazardZone[] = []
    ) => {
      const features = extract5DTelemetryFeatures(moveHistoryRef.current);
      const effectiveGrid = buildEffectiveGrid(grid, currentHazards);
      try {
        const resp = await fetch('/api/ai/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grid: effectiveGrid,
            trackerPos: tPos,
            playerPos: pPos,
            cores,
            hazardZones: currentHazards,
            algorithm: alg,
            features,
            k: kVal,
          }),
        });
        if (resp.ok) {
          const data: AIStepResponse = await resp.json();
          if (data?.activeSearch) {
            setAiTelemetry(data);
            return data;
          }
        }
      } catch {
        // Fallback below
      }
      const fallback = executeFallbackStep({
        grid: effectiveGrid,
        trackerPos: tPos,
        playerPos: pPos,
        cores,
        hazardZones: currentHazards,
        algorithm: alg,
        features,
        k: kVal,
      });
      setAiTelemetry(fallback);
      return fallback;
    },
    []
  );

  // Load or reset a sector
  const initSector = useCallback(
    (idx: number, nextPhase: GamePhase = 'playing') => {
      const sec = sectors[idx];
      setSelectedSectorIdx(idx);
      setOperativePos(sec.operativeStart);
      setTrackerPos(sec.trackerStart);
      setRemainingCores(sec.dataCores);
      setHazardZones([]);
      setHazardAlert(null);
      setEmpCharges(sec.empCharges);
      setTrackerStunTurns(0);
      setTurnCount(0);
      moveHistoryRef.current = [];
      lastMoveTimeRef.current = performance.now();
      setPhase(nextPhase);
      refreshAISnapshot(
        sec.grid,
        sec.trackerStart,
        sec.operativeStart,
        sec.dataCores,
        algorithm,
        knnK,
        []
      );
    },
    [sectors, algorithm, knnK, refreshAISnapshot]
  );

  // Regenerate procedural sector
  const handleRegenerateProcedural = () => {
    const newProc = generateProceduralSector(Date.now());
    const nextSectors = [...SECTORS, newProc];
    setSectors(nextSectors);
    setSelectedSectorIdx(4);
    setOperativePos(newProc.operativeStart);
    setTrackerPos(newProc.trackerStart);
    setRemainingCores(newProc.dataCores);
    setHazardZones([]);
    setHazardAlert(null);
    setEmpCharges(newProc.empCharges);
    setTrackerStunTurns(0);
    setTurnCount(0);
    moveHistoryRef.current = [];
    refreshAISnapshot(
      newProc.grid,
      newProc.trackerStart,
      newProc.operativeStart,
      newProc.dataCores,
      algorithm,
      knnK,
      []
    );
  };

  // Manual or AI-triggered Hunter Hazard Zone deployment
  const handleDeployHunterHazard = useCallback(() => {
    if (phase !== 'playing') return;
    const candidate = aiTelemetry.spawnedHazard;
    if (!candidate) return;
    setHazardZones((prev) => {
      if (prev.some((h) => h.x === candidate.x && h.z === candidate.z)) {
        return prev;
      }
      soundEngine.playHazardDeploy();
      setHazardAlert(
        `Hunter activated Hazard Zone at (${candidate.x},${candidate.z}) — ${candidate.reason}`
      );
      return [...prev.slice(-5), candidate];
    });
  }, [phase, aiTelemetry.spawnedHazard]);

  // Execute a player move + Hazard Zone progression + Python AI pursuit step
  const handlePlayerStep = useCallback(
    async (dx: number, dz: number) => {
      if (phase !== 'playing' || labModalOpen || stepBusyRef.current) return;

      const grid = currentSector.grid;
      const rows = grid.length;
      const cols = grid[0].length;
      const nx = operativePos[0] + dx;
      const nz = operativePos[1] + dz;

      // Validate bounds, static Firewall obstacles, and LOCKED Hazard Zones
      const isBlockedByLockedHazard = hazardZones.some(
        (h) => h.state === 'locked' && h.x === nx && h.z === nz
      );
      if (
        nx < 0 ||
        nx >= cols ||
        nz < 0 ||
        nz >= rows ||
        grid[nz][nx] === 1 ||
        isBlockedByLockedHazard
      ) {
        if (isBlockedByLockedHazard) {
          setHazardAlert('Path blocked by active Hunter Hazard Lockdown!');
        }
        return;
      }

      stepBusyRef.current = true;
      soundEngine.playMove();

      const now = performance.now();
      const intervalMs = Math.min(900, Math.max(120, now - lastMoveTimeRef.current));
      lastMoveTimeRef.current = now;

      let newOpPos: [number, number] = [nx, nz];

      // Determine behavioral telemetry traits for this move
      let approachedCore = false;
      if (remainingCores.length > 0) {
        const prevMinDist = Math.min(
          ...remainingCores.map((c) => manhattan(operativePos, c))
        );
        const newMinDist = Math.min(
          ...remainingCores.map((c) => manhattan(newOpPos, c))
        );
        approachedCore = newMinDist < prevMinDist;
      } else {
        approachedCore =
          manhattan(newOpPos, currentSector.extractionPortal) <
          manhattan(operativePos, currentSector.extractionPortal);
      }

      const isPerimeter =
        nx <= 1 || nx >= cols - 2 || nz <= 1 || nz >= rows - 2;
      const prevMove =
        moveHistoryRef.current[moveHistoryRef.current.length - 1];
      const isBacktrack = prevMove
        ? prevMove.from[0] === nx && prevMove.from[1] === nz
        : false;

      moveHistoryRef.current.push({
        from: operativePos,
        to: newOpPos,
        dx,
        dz,
        intervalMs,
        approachedCore,
        isPerimeter,
        isBacktrack,
      });

      // Advance existing Hazard Zones (priming -> locked; locked -> decrement TTL)
      const progressedHazards: HazardZone[] = [];
      let forcedRelocationTriggered = false;

      for (const hz of hazardZones) {
        if (hz.state === 'priming') {
          const lockedHz: HazardZone = {
            ...hz,
            state: 'locked',
            turnsRemaining: hz.turnsRemaining,
          };
          progressedHazards.push(lockedHz);

          // If Operative failed to relocate off a priming Hazard Zone when it locks, force relocation!
          if (lockedHz.x === newOpPos[0] && lockedHz.z === newOpPos[1]) {
            const dirs: [number, number][] = [
              [0, -1],
              [1, 0],
              [0, 1],
              [-1, 0],
            ];
            for (const [rx, rz] of dirs) {
              const tx = newOpPos[0] + rx;
              const tz = newOpPos[1] + rz;
              const occupiedByHazard = hazardZones.some(
                (item) => item.x === tx && item.z === tz
              );
              if (
                tx >= 0 &&
                tx < cols &&
                tz >= 0 &&
                tz < rows &&
                grid[tz][tx] === 0 &&
                !occupiedByHazard &&
                (tx !== trackerPos[0] || tz !== trackerPos[1])
              ) {
                newOpPos = [tx, tz];
                forcedRelocationTriggered = true;
                break;
              }
            }
          }
        } else if (hz.turnsRemaining > 1) {
          progressedHazards.push({
            ...hz,
            turnsRemaining: hz.turnsRemaining - 1,
          });
        }
      }

      if (forcedRelocationTriggered) {
        setScore((s) => Math.max(0, s - 75));
        soundEngine.playHazardDeploy();
        setHazardAlert(
          'Hazard Zone locked down under you! Forced emergency relocation (-75 pts).'
        );
      }

      // Check Data Core collection
      let updatedCores = remainingCores;
      const pickedCoreIdx = remainingCores.findIndex(
        (c) => c[0] === newOpPos[0] && c[1] === newOpPos[1]
      );
      if (pickedCoreIdx !== -1) {
        updatedCores = remainingCores.filter((_, i) => i !== pickedCoreIdx);
        setRemainingCores(updatedCores);
        setScore((s) => s + 250);
        soundEngine.playCorePickup();
      } else {
        setScore((s) => s + 10);
      }

      const nextTurn = turnCount + 1;
      setOperativePos(newOpPos);
      setTurnCount(nextTurn);

      // Check Extraction Portal victory
      const portalUnlocked = updatedCores.length === 0;
      if (
        portalUnlocked &&
        newOpPos[0] === currentSector.extractionPortal[0] &&
        newOpPos[1] === currentSector.extractionPortal[1]
      ) {
        setScore((s) => s + 1000);
        soundEngine.playVictory();
        setPhase('victory');
        stepBusyRef.current = false;
        return;
      }

      // Check if player walked directly into Tracker Node
      if (newOpPos[0] === trackerPos[0] && newOpPos[1] === trackerPos[1]) {
        soundEngine.playCapture();
        setPhase('gameover');
        stepBusyRef.current = false;
        return;
      }

      // Query Python AI Backend for Tracker Node response, KNN telemetry, and Hazard placement
      const aiResponse = await refreshAISnapshot(
        grid,
        trackerPos,
        newOpPos,
        updatedCores,
        algorithm,
        knnK,
        progressedHazards
      );

      // Hunter Node automatically activates a new Hazard Zone every 2 turns (up to 4 active)
      if (
        trackerStunTurns === 0 &&
        nextTurn % 2 === 0 &&
        progressedHazards.length < 4 &&
        aiResponse.spawnedHazard
      ) {
        const sh = aiResponse.spawnedHazard;
        const alreadyExists = progressedHazards.some(
          (h) => h.x === sh.x && h.z === sh.z
        );
        if (
          !alreadyExists &&
          (sh.x !== currentSector.extractionPortal[0] ||
            sh.z !== currentSector.extractionPortal[1])
        ) {
          progressedHazards.push(sh);
          soundEngine.playHazardDeploy();
          if (sh.x === newOpPos[0] && sh.z === newOpPos[1]) {
            setHazardAlert(
              `WARNING: Hunter priming Hazard Zone on your tile (${sh.x},${sh.z}) — RELOCATE IMMEDIATELY!`
            );
          } else {
            setHazardAlert(
              `Hunter deployed Hazard Zone at (${sh.x},${sh.z}) · ${sh.reason}`
            );
          }
        }
      }

      setHazardZones(progressedHazards);

      if (trackerStunTurns > 0) {
        setTrackerStunTurns((s) => s - 1);
        stepBusyRef.current = false;
        return;
      }

      const nextTracker = aiResponse.nextTrackerPos;
      setTrackerPos(nextTracker);

      if (nextTracker[0] === newOpPos[0] && nextTracker[1] === newOpPos[1]) {
        soundEngine.playCapture();
        setPhase('gameover');
      }

      stepBusyRef.current = false;
    },
    [
      phase,
      labModalOpen,
      currentSector,
      operativePos,
      hazardZones,
      remainingCores,
      turnCount,
      trackerPos,
      algorithm,
      knnK,
      trackerStunTurns,
      refreshAISnapshot,
    ]
  );

  // Trigger EMP Pulse (Stuns Tracker Node for 2 turns & purges active Hazard Zones)
  const handleTriggerEmp = useCallback(() => {
    if (phase !== 'playing' || empCharges <= 0) return;
    setEmpCharges((c) => c - 1);
    setTrackerStunTurns(2);
    setHazardZones([]);
    setHazardAlert('EMP Shockwave discharged — Hunter stunned & Hazard Zones purged!');
    setEmpWaveTrigger((v) => v + 1);
    soundEngine.playEmpPulse();
  }, [phase, empCharges]);

  // Click-to-Move on 3D grid tile
  const handleTileClick = useCallback(
    (targetPos: [number, number]) => {
      if (phase !== 'playing') return;
      const dx = targetPos[0] - operativePos[0];
      const dz = targetPos[1] - operativePos[1];
      if (Math.abs(dx) + Math.abs(dz) === 1) {
        handlePlayerStep(dx, dz);
      } else if (Math.abs(dx) + Math.abs(dz) > 1) {
        if (Math.abs(dx) >= Math.abs(dz)) {
          handlePlayerStep(dx > 0 ? 1 : -1, 0);
        } else {
          handlePlayerStep(0, dz > 0 ? 1 : -1);
        }
      }
    },
    [phase, operativePos, handlePlayerStep]
  );

  // Keyboard bindings (WASD, Arrows, Space, F, Esc, L, H, C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setLabModalOpen((o) => !o);
        return;
      }

      if (labModalOpen) {
        if (e.key === 'Escape') setLabModalOpen(false);
        return;
      }

      if (phase === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          initSector(selectedSectorIdx, 'playing');
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setPhase((p) => (p === 'playing' ? 'paused' : p === 'paused' ? 'playing' : p));
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setDockCollapsed((c) => !c);
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setCameraPreset((prev) =>
          prev === 'isometric'
            ? 'tactical_top'
            : prev === 'tactical_top'
              ? 'drone_chase'
              : 'isometric'
        );
        return;
      }

      if (phase !== 'playing') return;

      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          e.preventDefault();
          handlePlayerStep(0, -1);
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          e.preventDefault();
          handlePlayerStep(0, 1);
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          e.preventDefault();
          handlePlayerStep(-1, 0);
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          e.preventDefault();
          handlePlayerStep(1, 0);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleDeployHunterHazard();
          break;
        case ' ':
          e.preventDefault();
          handleTriggerEmp();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    phase,
    labModalOpen,
    selectedSectorIdx,
    initSector,
    handlePlayerStep,
    handleDeployHunterHazard,
    handleTriggerEmp,
  ]);

  const handleAlgorithmSwitch = (alg: SearchAlgorithmId) => {
    setAlgorithm(alg);
    refreshAISnapshot(
      currentSector.grid,
      trackerPos,
      operativePos,
      remainingCores,
      alg,
      knnK,
      hazardZones
    );
  };

  const handleKnnKSwitch = (kVal: number) => {
    setKnnK(kVal);
    refreshAISnapshot(
      currentSector.grid,
      trackerPos,
      operativePos,
      remainingCores,
      algorithm,
      kVal,
      hazardZones
    );
  };

  const toggleMute = () => {
    soundEngine.muted = !muted;
    setMuted(!muted);
  };

  const portalUnlocked = remainingCores.length === 0;
  const { activeSearch, overmind, comparison } = aiTelemetry;
  const standingOnPrimingHazard = hazardZones.some(
    (h) => h.state === 'priming' && h.x === operativePos[0] && h.z === operativePos[1]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090a10] select-none">
      {/* 1. ISOLATED THREE.JS 3D VIEWPORT */}
      <CyberGrid3D
        grid={currentSector.grid}
        operativePos={operativePos}
        trackerPos={trackerPos}
        effectiveGoal={aiTelemetry.effectiveGoal}
        dataCores={remainingCores}
        hazardZones={hazardZones}
        extractionPortal={currentSector.extractionPortal}
        portalUnlocked={portalUnlocked}
        activePath={activeSearch.path}
        expandedNodes={activeSearch.expandedNodes}
        showFrontier={showFrontier}
        algorithm={algorithm}
        cameraPreset={cameraPreset}
        cameraZoom={cameraZoom}
        empWaveTrigger={empWaveTrigger}
        phase={phase}
        onTileClick={handleTileClick}
      />

      {/* 2. PERIMETER HUD OVERLAY (WHEN PLAYING / PAUSED / END STATES) */}
      {phase !== 'title' && (
        <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 md:p-5">
          {/* TOP PERIMETER STATUS CLUSTERS */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Top-Left: Mission & Operative Status Cluster */}
            <div className="pointer-events-auto flex flex-col gap-1.5">
              <div className="flex items-center gap-4 px-4 py-2.5 bg-[#121521]/95 border border-[#2a2e42] rounded-xl shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-cyan-400 tracking-wide">
                      {currentSector.code}: {currentSector.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                    <span>Score: {score}</span>
                    <span aria-hidden="true">·</span>
                    <span>Turns: {turnCount}</span>
                    <span aria-hidden="true">·</span>
                    <span className={portalUnlocked ? 'text-emerald-400 font-semibold' : 'text-amber-300'}>
                      {portalUnlocked
                        ? 'PORTAL UNLOCKED — EXTRACT NOW'
                        : `Data Cores: ${remainingCores.length} Left`}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-orange-400">
                      Hazards: {hazardZones.length}
                    </span>
                    {trackerStunTurns > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-cyan-300 font-semibold">
                          HUNTER EMP STUNNED ({trackerStunTurns}T)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-7 w-px bg-[#262b40]" />

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleTriggerEmp}
                    disabled={empCharges <= 0}
                    title="Trigger EMP Shockwave (Spacebar) — Stuns Hunter Node & Purges Hazard Zones"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      empCharges > 0
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25'
                        : 'bg-[#181c2b] text-slate-600 border-[#23283d] cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>EMP ({empCharges})</span>
                  </button>

                  <button
                    onClick={() => initSector(selectedSectorIdx, 'playing')}
                    title="Reset Sector"
                    className="p-2 text-slate-300 hover:text-white bg-[#1a1f30] hover:bg-[#252b42] border border-[#2c324c] rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      setPhase((p) => (p === 'playing' ? 'paused' : 'playing'))
                    }
                    title="Pause Simulation (Esc)"
                    className="p-2 text-slate-300 hover:text-white bg-[#1a1f30] hover:bg-[#252b42] border border-[#2c324c] rounded-lg transition-colors cursor-pointer"
                  >
                    {phase === 'paused' ? (
                      <Play className="w-3.5 h-3.5" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={toggleMute}
                    title={muted ? 'Unmute Audio' : 'Mute Audio'}
                    className="p-2 text-slate-300 hover:text-white bg-[#1a1f30] hover:bg-[#252b42] border border-[#2c324c] rounded-lg transition-colors cursor-pointer"
                  >
                    {muted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic Hazard Tactical Alert Strip */}
              {(standingOnPrimingHazard || hazardAlert) && (
                <div
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                    standingOnPrimingHazard
                      ? 'bg-amber-950/90 border-amber-500/60 text-amber-200'
                      : 'bg-[#171829]/95 border-[#34385c] text-slate-300'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {standingOnPrimingHazard
                      ? 'RELOCATE IMMEDIATELY: Hunter Hazard Zone is priming under your Operative!'
                      : hazardAlert}
                  </span>
                </div>
              )}
            </div>

            {/* Top-Right: Overmind KNN & Search Telemetry Readout (#1E1E2E) */}
            <div className="pointer-events-auto flex items-center gap-4 px-4 py-2.5 bg-[#1e1e2e]/95 border border-[#323652] rounded-xl shadow-lg">
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="text-slate-400">Overmind KNN (K={knnK}):</span>
                  <span className="font-semibold text-cyan-300">
                    {overmind.predictedClass}
                  </span>
                  <span className="font-mono tabular-nums text-slate-400">
                    ({overmind.confidence.toFixed(0)}%)
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-xs font-mono tabular-nums text-slate-400 mt-0.5">
                  <span className="text-rose-400 font-sans font-medium">
                    {overmind.adaptation.strategyName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Cost: {activeSearch.pathCost}</span>
                  <span aria-hidden="true">·</span>
                  <span>Nodes: {activeSearch.nodesExpandedCount}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeSearch.executionTimeMs.toFixed(2)}ms</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setLabInitialTab('search');
                  setLabModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>AI Lab & Report</span>
              </button>
            </div>
          </div>

          {/* COLLAPSIBLE BOTTOM CONTROL DOCK */}
          <div className="pointer-events-auto mx-auto w-full max-w-[960px] flex flex-col items-center">
            <button
              onClick={() => setDockCollapsed((c) => !c)}
              className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium text-slate-300 bg-[#121521]/95 hover:bg-[#1b2033] border border-b-0 border-[#2a2e42] rounded-t-lg transition-colors cursor-pointer"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Show Tactical & AI Controls (H)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hide Controls (H)</span>
                </>
              )}
            </button>

            {!dockCollapsed && (
              <div className="w-full px-4 py-3 bg-[#121521]/95 border border-[#2a2e42] rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3">
                {/* 1. Search Algorithm Selector + Live Node Counts */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 mr-1">Pursuit AI:</span>
                  {(['astar', 'bfs', 'gbfs'] as SearchAlgorithmId[]).map((alg) => {
                    const stats = comparison[alg];
                    const active = algorithm === alg;
                    return (
                      <button
                        key={alg}
                        onClick={() => handleAlgorithmSwitch(alg)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : 'bg-[#181c2c] text-slate-400 border-[#252b42] hover:text-slate-200'
                        }`}
                      >
                        <span>
                          {alg === 'astar' ? 'A*' : alg === 'bfs' ? 'BFS' : 'GBFS'}
                        </span>
                        <span className="ml-1.5 font-mono text-[11px] opacity-80 tabular-nums">
                          ({stats.nodesExpandedCount}n)
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. KNN Hyperparameter K, Frontier Toggle & Hazard Trigger */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#0d0f18] px-2 py-1 rounded-lg border border-[#23283d]">
                    <span className="text-xs text-slate-400 mr-1">KNN:</span>
                    {[3, 5, 7].map((kv) => (
                      <button
                        key={kv}
                        onClick={() => handleKnnKSwitch(kv)}
                        className={`px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                          knnK === kv
                            ? 'bg-cyan-500/25 text-cyan-300 font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        K={kv}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowFrontier((f) => !f)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      showFrontier
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                        : 'bg-[#181c2c] text-slate-400 border-[#252b42]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>3D Frontier</span>
                  </button>

                  <button
                    onClick={handleDeployHunterHazard}
                    title="Force Hunter Node to deploy a tactical Hazard Zone (Shortcut: F)"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Deploy Hazard (F)</span>
                  </button>
                </div>

                {/* 3. Sector Switcher & Camera Controls */}
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Select Security Sector"
                    value={selectedSectorIdx}
                    onChange={(e) => initSector(Number(e.target.value), 'playing')}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-[#181c2c] border border-[#282f48] rounded-lg cursor-pointer"
                  >
                    {sectors.map((s, idx) => (
                      <option key={s.id} value={idx}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      setCameraPreset((prev) =>
                        prev === 'isometric'
                          ? 'tactical_top'
                          : prev === 'tactical_top'
                            ? 'drone_chase'
                            : 'isometric'
                      )
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-[#181c2c] hover:bg-[#22283e] border border-[#282f48] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {cameraPreset === 'isometric'
                        ? 'Isometric 3D'
                        : cameraPreset === 'tactical_top'
                          ? 'Top-Down'
                          : 'Chase View'}
                    </span>
                  </button>
                </div>

                {/* 4. Compact Tactical Step Pad (for Mouse / Touch convenience) */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePlayerStep(-1, 0)}
                    aria-label="Move West"
                    className="p-1.5 text-slate-200 bg-[#1b2033] hover:bg-cyan-500/25 border border-[#2c3452] rounded-md cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handlePlayerStep(0, -1)}
                    aria-label="Move North"
                    className="p-1.5 text-slate-200 bg-[#1b2033] hover:bg-cyan-500/25 border border-[#2c3452] rounded-md cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handlePlayerStep(0, 1)}
                    aria-label="Move South"
                    className="p-1.5 text-slate-200 bg-[#1b2033] hover:bg-cyan-500/25 border border-[#2c3452] rounded-md cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handlePlayerStep(1, 0)}
                    aria-label="Move East"
                    className="p-1.5 text-slate-200 bg-[#1b2033] hover:bg-cyan-500/25 border border-[#2c3452] rounded-md cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TITLE SCREEN OVERLAY */}
      {phase === 'title' && (
        <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-10 bg-gradient-to-t from-[#090a10] via-[#090a10]/65 to-transparent">
          {/* Top Minimal Bar */}
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-bold tracking-wider text-cyan-400">
              AEGIS PROTOCOL
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setLabInitialTab('report');
                  setLabModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#161a29]/90 hover:bg-[#1f253a] border border-[#2c334d] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Academic Report & Viva Guide
              </button>
              <button
                onClick={() => {
                  setLabInitialTab('python');
                  setLabModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-medium text-emerald-300 bg-[#112622]/90 hover:bg-[#17352f] border border-emerald-800/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Python 3 Source (ai_engine.py)
              </button>
            </div>
          </div>

          {/* Center Hero Title Lockup */}
          <div className="my-auto max-w-2xl space-y-6">
            {/* Bespoke Inline SVG Title Lockup */}
            <div className="space-y-2">
              <svg
                viewBox="0 0 560 92"
                className="w-full max-w-[520px] h-auto"
                role="img"
                aria-label="AEGIS PROTOCOL: Adaptive Cyber Evasion"
              >
                <defs>
                  <linearGradient id="aegisCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00FFFF" />
                    <stop offset="60%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#FF0055" />
                  </linearGradient>
                </defs>
                {/* Hexagonal Tactical Emblem */}
                <polygon
                  points="36,12 62,27 62,57 36,72 10,57 10,27"
                  fill="none"
                  stroke="url(#aegisCyan)"
                  strokeWidth="3"
                />
                <polygon
                  points="36,24 50,32 50,52 36,60 22,52 22,32"
                  fill="#00FFFF"
                  fillOpacity="0.2"
                  stroke="#00FFFF"
                  strokeWidth="1.5"
                />
                <circle cx="36" cy="42" r="5" fill="#FFD700" />
                <text
                  x="82"
                  y="48"
                  fill="#F8FAFC"
                  fontFamily="Chakra Petch, sans-serif"
                  fontWeight="700"
                  fontSize="40"
                  letterSpacing="2"
                >
                  AEGIS PROTOCOL
                </text>
                <text
                  x="84"
                  y="74"
                  fill="#38BDF8"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="500"
                  fontSize="13.5"
                  letterSpacing="1.2"
                >
                  ADAPTIVE CYBER EVASION · PYTHON A* &amp; KNN SIMULATOR
                </text>
              </svg>

              <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-xl">
                Breach the server grid as <strong className="text-cyan-300">The Operative</strong>, recover encrypted{' '}
                <strong className="text-amber-300">Data Cores</strong>, and reach the extraction gate before the{' '}
                <strong className="text-rose-400">Tracker Node</strong> intercepts you using real-time Python{' '}
                <strong className="text-slate-100">A* Pathfinding</strong> and{' '}
                <strong className="text-slate-100">Overmind KNN Behavioral Profiling</strong>.
              </p>
            </div>

            {/* Sector Selector Strip */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-400">
                Select Target Server Sector:
              </div>
              <div className="flex flex-wrap gap-2">
                {sectors.map((sec, idx) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setSelectedSectorIdx(idx);
                      initSector(idx, 'title');
                    }}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedSectorIdx === idx
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60'
                        : 'bg-[#121521]/90 text-slate-300 border-[#262b40] hover:border-slate-500'
                    }`}
                  >
                    <span>{sec.code}: {sec.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">{currentSector.subtitle}</p>
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={() => initSector(selectedSectorIdx, 'playing')}
                className="px-6 py-3 text-sm font-display font-bold tracking-wide text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Start Simulation
              </button>

              <button
                onClick={() => {
                  setLabInitialTab('search');
                  setLabModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-100 bg-[#171b2b]/95 hover:bg-[#222840] border border-[#2f3654] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                <span>Open AI Lab &amp; Benchmarks</span>
              </button>
            </div>
          </div>

          {/* Flat Control Hint Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-400 font-mono">
            <span>
              WASD / Arrows or Click Tile to Move · Space EMP Pulse · C Camera View · L AI Lab · Esc Pause
            </span>
            <span>
              AI Components: Search (A*, BFS, GBFS) · Machine Learning (KNN Behavioral Classifier)
            </span>
          </div>
        </div>
      )}

      {/* 4. PAUSE / VICTORY / GAME OVER MODAL */}
      {(phase === 'paused' || phase === 'victory' || phase === 'gameover') && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md p-6 bg-[#121521] border border-[#2c324c] rounded-xl shadow-2xl space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center bg-[#1a1f33] border border-[#2e3654]">
              {phase === 'victory' ? (
                <Trophy className="w-6 h-6 text-amber-400" />
              ) : phase === 'gameover' ? (
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              ) : (
                <Pause className="w-6 h-6 text-cyan-400" />
              )}
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-bold text-slate-100">
                {phase === 'victory'
                  ? 'Sector Extraction Complete'
                  : phase === 'gameover'
                    ? 'Intercepted by Tracker Node'
                    : 'Simulation Paused'}
              </h2>
              <p className="text-xs text-slate-400">
                {phase === 'victory'
                  ? `All Data Cores recovered in ${turnCount} turns. Overmind classified your style as ${overmind.predictedClass}.`
                  : phase === 'gameover'
                    ? `Hunter Node closed pursuit using ${activeSearch.algorithmLabel} (${overmind.adaptation.strategyName}).`
                    : `${currentSector.code}: ${currentSector.name}`}
              </p>
            </div>

            {/* Post-Run AI Telemetry Summary */}
            <div className="p-3.5 bg-[#0d0f18] border border-[#23283b] rounded-lg text-xs font-mono tabular-nums space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Score / Turns:</span>
                <span className="text-slate-100 font-semibold">
                  {score} pts · {turnCount} turns
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Overmind KNN Class:</span>
                <span className="text-cyan-300 font-semibold">
                  {overmind.predictedClass} ({overmind.confidence.toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Active Search Metric:</span>
                <span className="text-amber-300">
                  {activeSearch.nodesExpandedCount} nodes · {activeSearch.executionTimeMs.toFixed(3)}ms
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {phase === 'paused' && (
                <button
                  onClick={() => setPhase('playing')}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
                >
                  Resume Simulation
                </button>
              )}

              {phase === 'victory' && (
                <button
                  onClick={() => {
                    const nextIdx = (selectedSectorIdx + 1) % sectors.length;
                    initSector(nextIdx, 'playing');
                  }}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  Next Security Sector
                </button>
              )}

              <button
                onClick={() => initSector(selectedSectorIdx, 'playing')}
                className="flex-1 py-2.5 px-4 text-xs font-medium text-slate-200 bg-[#1b2033] hover:bg-[#252c45] border border-[#2e3654] rounded-lg transition-colors cursor-pointer"
              >
                Retry Sector
              </button>

              {selectedSectorIdx === 4 && (
                <button
                  onClick={handleRegenerateProcedural}
                  className="flex-1 py-2.5 px-4 text-xs font-medium text-amber-300 bg-[#261f14] hover:bg-[#362b1b] border border-amber-700/50 rounded-lg transition-colors cursor-pointer"
                >
                  New Procedural Seed
                </button>
              )}

              <button
                onClick={() => setPhase('title')}
                className="py-2.5 px-4 text-xs font-medium text-slate-400 hover:text-slate-200 bg-[#141724] border border-[#24293e] rounded-lg transition-colors cursor-pointer"
              >
                Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. AI LAB EVALUATION, PYTHON CODE & 40-MARK REPORT MODAL */}
      <AILabModal
        isOpen={labModalOpen}
        onClose={() => setLabModalOpen(false)}
        grid={buildEffectiveGrid(currentSector.grid, hazardZones)}
        trackerPos={trackerPos}
        operativePos={operativePos}
        aiTelemetry={aiTelemetry}
        activeAlgorithm={algorithm}
        onSelectAlgorithm={handleAlgorithmSwitch}
        knnK={knnK}
        onChangeKnnK={handleKnnKSwitch}
        initialTab={labInitialTab}
      />
    </div>
  );
}
