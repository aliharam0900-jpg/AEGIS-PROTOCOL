export type SearchAlgorithmId = 'astar' | 'bfs' | 'gbfs';

export type BehaviorClassName =
  | 'Aggressive Rusher'
  | 'Perimeter Ghost'
  | 'Erratic Evader'
  | 'Calculated Tactician';

export type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export type CameraPresetId = 'isometric' | 'tactical_top' | 'drone_chase';

export interface SearchResult {
  algorithm: SearchAlgorithmId;
  algorithmLabel: string;
  path: [number, number][];
  expandedNodes: [number, number][];
  pathCost: number;
  pathSteps: number;
  nodesExpandedCount: number;
  executionTimeMs: number;
  optimalGuaranteed: boolean;
}

export interface TacticalAdaptation {
  strategyName: string;
  description: string;
  heuristicWeight: number;
  perimeterDiscount: number;
  centerDiscount: number;
  predictiveLeadSteps: number;
}

export interface NearestNeighborInfo {
  distance: number;
  label: BehaviorClassName;
  features: number[];
}

export interface OvermindProfile {
  predictedClass: BehaviorClassName;
  confidence: number;
  k: number;
  probabilities: Record<BehaviorClassName, number>;
  voteCounts: Record<BehaviorClassName, number>;
  normalizedFeatures: number[];
  rawFeatures: number[];
  nearestNeighbors: NearestNeighborInfo[];
  adaptation: TacticalAdaptation;
}

export interface HazardZone {
  x: number;
  z: number;
  state: 'priming' | 'locked';
  turnsRemaining: number;
  reason: string;
}

export interface AIStepResponse {
  status: string;
  engine: string;
  nextTrackerPos: [number, number];
  effectiveGoal: [number, number];
  activeSearch: SearchResult;
  comparison: {
    astar: SearchResult;
    bfs: SearchResult;
    gbfs: SearchResult;
  };
  overmind: OvermindProfile;
  spawnedHazard?: HazardZone | null;
}

export interface PerClassMetric {
  className: BehaviorClassName;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}

export interface KNNEvaluationResult {
  k: number;
  totalSamples: number;
  correctPredictions: number;
  accuracy: number;
  errorRate: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  classes: BehaviorClassName[];
  confusionMatrix: number[][];
  perClassMetrics: PerClassMetric[];
}

export interface KSensitivityPoint {
  k: number;
  accuracy: number;
  errorRate: number;
}

export interface KNNEvaluationResponse {
  status: string;
  engine: string;
  evaluation: KNNEvaluationResult;
  kSensitivity: KSensitivityPoint[];
}

export interface SectorConfig {
  id: number;
  code: string;
  name: string;
  subtitle: string;
  difficulty: 'Standard' | 'Elevated' | 'High Security' | 'Critical' | 'Apex';
  gridSize: number;
  grid: number[][];
  operativeStart: [number, number];
  trackerStart: [number, number];
  dataCores: [number, number][];
  extractionPortal: [number, number];
  empCharges: number;
}

export interface MoveRecord {
  from: [number, number];
  to: [number, number];
  dx: number;
  dz: number;
  intervalMs: number;
  approachedCore: boolean;
  isPerimeter: boolean;
  isBacktrack: boolean;
}
