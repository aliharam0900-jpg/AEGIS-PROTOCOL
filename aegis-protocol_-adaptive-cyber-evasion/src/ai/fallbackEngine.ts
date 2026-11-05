import {
  AIStepResponse,
  BehaviorClassName,
  HazardZone,
  KNNEvaluationResponse,
  KNNEvaluationResult,
  OvermindProfile,
  SearchAlgorithmId,
  SearchResult,
  TacticalAdaptation,
} from '../types/game';

const BEHAVIOR_CLASSES: BehaviorClassName[] = [
  'Aggressive Rusher',
  'Perimeter Ghost',
  'Erratic Evader',
  'Calculated Tactician',
];

const TRAINING_DATASET: Array<[number[], BehaviorClassName]> = [
  // Aggressive Rusher
  [[165.0, 0.18, 0.15, 0.92, 0.05], 'Aggressive Rusher'],
  [[180.0, 0.22, 0.20, 0.88, 0.08], 'Aggressive Rusher'],
  [[150.0, 0.15, 0.12, 0.95, 0.04], 'Aggressive Rusher'],
  [[210.0, 0.25, 0.18, 0.85, 0.10], 'Aggressive Rusher'],
  [[195.0, 0.20, 0.22, 0.90, 0.06], 'Aggressive Rusher'],
  [[175.0, 0.28, 0.14, 0.86, 0.09], 'Aggressive Rusher'],
  [[225.0, 0.24, 0.25, 0.82, 0.07], 'Aggressive Rusher'],
  [[160.0, 0.19, 0.10, 0.94, 0.05], 'Aggressive Rusher'],
  [[240.0, 0.30, 0.28, 0.79, 0.12], 'Aggressive Rusher'],
  [[185.0, 0.16, 0.16, 0.91, 0.04], 'Aggressive Rusher'],
  [[205.0, 0.21, 0.19, 0.87, 0.08], 'Aggressive Rusher'],
  [[260.0, 0.32, 0.30, 0.76, 0.14], 'Aggressive Rusher'],

  // Perimeter Ghost
  [[340.0, 0.22, 0.88, 0.42, 0.08], 'Perimeter Ghost'],
  [[380.0, 0.18, 0.92, 0.38, 0.06], 'Perimeter Ghost'],
  [[310.0, 0.25, 0.85, 0.48, 0.10], 'Perimeter Ghost'],
  [[420.0, 0.20, 0.90, 0.35, 0.07], 'Perimeter Ghost'],
  [[360.0, 0.24, 0.84, 0.45, 0.09], 'Perimeter Ghost'],
  [[395.0, 0.16, 0.94, 0.40, 0.05], 'Perimeter Ghost'],
  [[330.0, 0.28, 0.80, 0.50, 0.12], 'Perimeter Ghost'],
  [[410.0, 0.21, 0.89, 0.36, 0.08], 'Perimeter Ghost'],
  [[295.0, 0.30, 0.76, 0.54, 0.14], 'Perimeter Ghost'],
  [[370.0, 0.19, 0.91, 0.41, 0.06], 'Perimeter Ghost'],
  [[350.0, 0.23, 0.86, 0.44, 0.09], 'Perimeter Ghost'],
  [[440.0, 0.27, 0.78, 0.39, 0.11], 'Perimeter Ghost'],

  // Erratic Evader
  [[270.0, 0.82, 0.40, 0.32, 0.68], 'Erratic Evader'],
  [[240.0, 0.88, 0.35, 0.28, 0.74], 'Erratic Evader'],
  [[310.0, 0.78, 0.45, 0.36, 0.62], 'Erratic Evader'],
  [[220.0, 0.91, 0.30, 0.25, 0.79], 'Erratic Evader'],
  [[290.0, 0.85, 0.42, 0.30, 0.71], 'Erratic Evader'],
  [[255.0, 0.80, 0.38, 0.35, 0.65], 'Erratic Evader'],
  [[330.0, 0.74, 0.48, 0.40, 0.58], 'Erratic Evader'],
  [[235.0, 0.89, 0.33, 0.27, 0.76], 'Erratic Evader'],
  [[280.0, 0.76, 0.50, 0.42, 0.55], 'Erratic Evader'],
  [[265.0, 0.84, 0.36, 0.31, 0.70], 'Erratic Evader'],
  [[300.0, 0.79, 0.44, 0.34, 0.64], 'Erratic Evader'],
  [[350.0, 0.71, 0.52, 0.45, 0.52], 'Erratic Evader'],

  // Calculated Tactician
  [[580.0, 0.44, 0.38, 0.72, 0.16], 'Calculated Tactician'],
  [[640.0, 0.40, 0.34, 0.75, 0.12], 'Calculated Tactician'],
  [[520.0, 0.48, 0.42, 0.68, 0.20], 'Calculated Tactician'],
  [[690.0, 0.38, 0.32, 0.78, 0.10], 'Calculated Tactician'],
  [[610.0, 0.42, 0.36, 0.74, 0.14], 'Calculated Tactician'],
  [[550.0, 0.46, 0.40, 0.70, 0.18], 'Calculated Tactician'],
  [[670.0, 0.39, 0.35, 0.76, 0.11], 'Calculated Tactician'],
  [[490.0, 0.50, 0.46, 0.64, 0.22], 'Calculated Tactician'],
  [[620.0, 0.43, 0.37, 0.73, 0.15], 'Calculated Tactician'],
  [[560.0, 0.45, 0.39, 0.71, 0.17], 'Calculated Tactician'],
  [[710.0, 0.36, 0.30, 0.80, 0.09], 'Calculated Tactician'],
  [[470.0, 0.52, 0.48, 0.62, 0.24], 'Calculated Tactician'],
];

const FEATURE_BOUNDS: Array<[number, number]> = [
  [120.0, 800.0],
  [0.0, 1.0],
  [0.0, 1.0],
  [0.0, 1.0],
  [0.0, 1.0],
];

function normalizeFeatures(features: number[]): number[] {
  return features.map((val, idx) => {
    const [low, high] = FEATURE_BOUNDS[idx];
    const clamped = Math.max(low, Math.min(high, Number(val)));
    return high > low ? (clamped - low) / (high - low) : 0;
  });
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function getTacticalAdaptation(predictedClass: BehaviorClassName): TacticalAdaptation {
  switch (predictedClass) {
    case 'Aggressive Rusher':
      return {
        strategyName: 'Predictive Core Ambush',
        description: 'Projects A* pursuit target toward the nearest Data Core ahead of the operative.',
        heuristicWeight: 1.15,
        perimeterDiscount: 1.0,
        centerDiscount: 0.85,
        predictiveLeadSteps: 2,
      };
    case 'Perimeter Ghost':
      return {
        strategyName: 'Perimeter Corridor Cutoff',
        description: 'Discounts outer firewall boundary traversal cost by 35% in A* to seal wall routes.',
        heuristicWeight: 1.1,
        perimeterDiscount: 0.65,
        centerDiscount: 1.05,
        predictiveLeadSteps: 1,
      };
    case 'Erratic Evader':
      return {
        strategyName: 'High-Gain Containment Net',
        description: 'Boosts A* heuristic greediness (w=1.35) to collapse pocket space and counter zig-zags.',
        heuristicWeight: 1.35,
        perimeterDiscount: 0.95,
        centerDiscount: 0.9,
        predictiveLeadSteps: 0,
      };
    default:
      return {
        strategyName: 'Optimal Shadow Interception',
        description: 'Executes strict admissible A* search anchored between operative and extraction portal.',
        heuristicWeight: 1.0,
        perimeterDiscount: 1.0,
        centerDiscount: 1.0,
        predictiveLeadSteps: 1,
      };
  }
}

export function predictKNN(
  rawFeatures: number[],
  k = 5,
  excludeIndex?: number
): OvermindProfile {
  const safeK = Math.max(1, Math.min(k, TRAINING_DATASET.length - 1));
  const normQuery = normalizeFeatures(rawFeatures);

  const distances: Array<{ dist: number; label: BehaviorClassName; orig: number[] }> = [];
  TRAINING_DATASET.forEach(([sample, label], idx) => {
    if (excludeIndex !== undefined && idx === excludeIndex) return;
    const normSample = normalizeFeatures(sample);
    distances.push({
      dist: euclideanDistance(normQuery, normSample),
      label,
      orig: sample,
    });
  });

  distances.sort((a, b) => a.dist - b.dist);
  const nearestK = distances.slice(0, safeK);

  const classWeights: Record<BehaviorClassName, number> = {
    'Aggressive Rusher': 0,
    'Perimeter Ghost': 0,
    'Erratic Evader': 0,
    'Calculated Tactician': 0,
  };
  const voteCounts: Record<BehaviorClassName, number> = {
    'Aggressive Rusher': 0,
    'Perimeter Ghost': 0,
    'Erratic Evader': 0,
    'Calculated Tactician': 0,
  };

  for (const item of nearestK) {
    const w = 1.0 / (item.dist + 1e-4);
    classWeights[item.label] += w;
    voteCounts[item.label] += 1;
  }

  let predictedClass: BehaviorClassName = 'Aggressive Rusher';
  let bestWeight = -1;
  for (const cls of BEHAVIOR_CLASSES) {
    if (classWeights[cls] > bestWeight) {
      bestWeight = classWeights[cls];
      predictedClass = cls;
    }
  }

  const totalWeight =
    Object.values(classWeights).reduce((acc, v) => acc + v, 0) || 1.0;

  const probabilities: Record<BehaviorClassName, number> = {
    'Aggressive Rusher': Number(((classWeights['Aggressive Rusher'] / totalWeight) * 100).toFixed(1)),
    'Perimeter Ghost': Number(((classWeights['Perimeter Ghost'] / totalWeight) * 100).toFixed(1)),
    'Erratic Evader': Number(((classWeights['Erratic Evader'] / totalWeight) * 100).toFixed(1)),
    'Calculated Tactician': Number(((classWeights['Calculated Tactician'] / totalWeight) * 100).toFixed(1)),
  };

  return {
    predictedClass,
    confidence: Number(((bestWeight / totalWeight) * 100).toFixed(1)),
    k: safeK,
    probabilities,
    voteCounts,
    normalizedFeatures: normQuery.map((v) => Number(v.toFixed(3))),
    rawFeatures: rawFeatures.map((v) => Number(Number(v).toFixed(3))),
    nearestNeighbors: nearestK.map((n) => ({
      distance: Number(n.dist.toFixed(4)),
      label: n.label,
      features: n.orig.map((f) => Number(f.toFixed(2))),
    })),
    adaptation: getTacticalAdaptation(predictedClass),
  };
}

export function evaluateKNN(k = 5): KNNEvaluationResult {
  const nClasses = BEHAVIOR_CLASSES.length;
  const confusion: number[][] = Array.from({ length: nClasses }, () =>
    Array(nClasses).fill(0)
  );

  const evalSamples: Array<{ feat: number[]; label: BehaviorClassName; exIdx?: number }> = [];

  TRAINING_DATASET.forEach(([features, label], idx) => {
    const sign = idx % 2 === 0 ? 1 : -1;
    const scale = idx % 4 === 0 ? 0.16 : 0.08;
    evalSamples.push({
      feat: [
        features[0] + sign * 85.0 * scale,
        Math.max(0, Math.min(1, features[1] - sign * 0.22 * scale)),
        Math.max(0, Math.min(1, features[2] + sign * 0.25 * scale)),
        Math.max(0, Math.min(1, features[3] - sign * 0.20 * scale)),
        Math.max(0, Math.min(1, features[4] + sign * 0.22 * scale)),
      ],
      label,
      exIdx: idx,
    });
  });

  const stressSamples: Array<[number[], BehaviorClassName]> = [
    [[285.0, 0.34, 0.62, 0.66, 0.14], 'Aggressive Rusher'],
    [[305.0, 0.31, 0.68, 0.58, 0.13], 'Perimeter Ghost'],
    [[295.0, 0.62, 0.48, 0.44, 0.46], 'Erratic Evader'],
    [[445.0, 0.56, 0.44, 0.55, 0.34], 'Calculated Tactician'],
    [[430.0, 0.33, 0.66, 0.56, 0.15], 'Perimeter Ghost'],
    [[260.0, 0.58, 0.34, 0.62, 0.38], 'Aggressive Rusher'],
    [[460.0, 0.34, 0.32, 0.72, 0.16], 'Calculated Tactician'],
    [[325.0, 0.66, 0.52, 0.39, 0.49], 'Erratic Evader'],
  ];
  for (const [feat, label] of stressSamples) {
    evalSamples.push({ feat, label });
  }

  let correct = 0;
  for (const sample of evalSamples) {
    const pred = predictKNN(sample.feat, k, sample.exIdx).predictedClass;
    const tIdx = BEHAVIOR_CLASSES.indexOf(sample.label);
    const pIdx = BEHAVIOR_CLASSES.indexOf(pred);
    confusion[tIdx][pIdx] += 1;
    if (pred === sample.label) correct += 1;
  }

  const total = evalSamples.length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const errorRate = 100 - accuracy;

  const perClassMetrics = BEHAVIOR_CLASSES.map((clsName, i) => {
    const tp = confusion[i][i];
    let fp = 0;
    let fn = 0;
    for (let r = 0; r < nClasses; r++) {
      if (r !== i) fp += confusion[r][i];
      if (r !== i) fn += confusion[i][r];
    }
    const prec = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
    const rec = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
    return {
      className: clsName,
      precision: Number(prec.toFixed(2)),
      recall: Number(rec.toFixed(2)),
      f1Score: Number(f1.toFixed(2)),
      support: confusion[i].reduce((a, b) => a + b, 0),
    };
  });

  const macroPrecision =
    perClassMetrics.reduce((a, m) => a + m.precision, 0) / nClasses;
  const macroRecall =
    perClassMetrics.reduce((a, m) => a + m.recall, 0) / nClasses;
  const macroF1 = perClassMetrics.reduce((a, m) => a + m.f1Score, 0) / nClasses;

  return {
    k,
    totalSamples: total,
    correctPredictions: correct,
    accuracy: Number(accuracy.toFixed(2)),
    errorRate: Number(errorRate.toFixed(2)),
    macroPrecision: Number(macroPrecision.toFixed(2)),
    macroRecall: Number(macroRecall.toFixed(2)),
    macroF1: Number(macroF1.toFixed(2)),
    classes: BEHAVIOR_CLASSES,
    confusionMatrix: confusion,
    perClassMetrics,
  };
}

function manhattan(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function keyOf(p: [number, number]): string {
  return `${p[0]},${p[1]}`;
}

function getValidNeighbors(
  pos: [number, number],
  grid: number[][]
): [number, number][] {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const [x, z] = pos;
  const candidates: [number, number][] = [
    [x, z - 1],
    [x + 1, z],
    [x, z + 1],
    [x - 1, z],
  ];
  return candidates.filter(
    ([nx, nz]) => nz >= 0 && nz < rows && nx >= 0 && nx < cols && grid[nz][nx] !== 1
  );
}

function reconstructPath(
  cameFrom: Map<string, [number, number] | null>,
  current: [number, number]
): [number, number][] {
  const path: [number, number][] = [];
  let node: [number, number] | null | undefined = current;
  while (node) {
    path.push([node[0], node[1]]);
    node = cameFrom.get(keyOf(node));
  }
  path.reverse();
  return path;
}

export function runAStar(
  grid: number[][],
  start: [number, number],
  goal: [number, number],
  adaptation?: TacticalAdaptation
): SearchResult {
  const t0 = performance.now();
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const w = adaptation ? adaptation.heuristicWeight : 1.0;

  const openList: Array<{ f: number; order: number; pos: [number, number] }> = [];
  let order = 0;
  openList.push({ f: manhattan(start, goal) * w, order: order++, pos: start });

  const cameFrom = new Map<string, [number, number] | null>();
  cameFrom.set(keyOf(start), null);

  const gScore = new Map<string, number>();
  gScore.set(keyOf(start), 0);

  const closedSet = new Set<string>();
  const expandedNodes: [number, number][] = [];

  while (openList.length > 0) {
    openList.sort((a, b) => (a.f !== b.f ? a.f - b.f : a.order - b.order));
    const current = openList.shift()!.pos;
    const cKey = keyOf(current);
    if (closedSet.has(cKey)) continue;
    closedSet.add(cKey);
    expandedNodes.push([current[0], current[1]]);

    if (current[0] === goal[0] && current[1] === goal[1]) {
      const elapsed = performance.now() - t0;
      const path = reconstructPath(cameFrom, current);
      return {
        algorithm: 'astar',
        algorithmLabel: 'A* Search (f = g + w·h)',
        path,
        expandedNodes,
        pathCost: Number((gScore.get(cKey) ?? 0).toFixed(2)),
        pathSteps: Math.max(0, path.length - 1),
        nodesExpandedCount: expandedNodes.length,
        executionTimeMs: Number(Math.max(0.015, elapsed).toFixed(4)),
        optimalGuaranteed: w <= 1.0,
      };
    }

    for (const neighbor of getValidNeighbors(current, grid)) {
      const nKey = keyOf(neighbor);
      if (closedSet.has(nKey)) continue;

      const isPerimeter =
        neighbor[0] <= 1 ||
        neighbor[0] >= cols - 2 ||
        neighbor[1] <= 1 ||
        neighbor[1] >= rows - 2;
      const stepCost = adaptation
        ? isPerimeter
          ? adaptation.perimeterDiscount
          : adaptation.centerDiscount
        : 1.0;

      const tentativeG = (gScore.get(cKey) ?? 0) + stepCost;
      if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)!) {
        cameFrom.set(nKey, current);
        gScore.set(nKey, tentativeG);
        const dx1 = neighbor[0] - goal[0];
        const dz1 = neighbor[1] - goal[1];
        const dx2 = start[0] - goal[0];
        const dz2 = start[1] - goal[1];
        const cross = Math.abs(dx1 * dz2 - dx2 * dz1) * 0.001;
        const fVal = tentativeG + manhattan(neighbor, goal) * w + cross;
        openList.push({ f: fVal, order: order++, pos: neighbor });
      }
    }
  }

  return {
    algorithm: 'astar',
    algorithmLabel: 'A* Search (f = g + w·h)',
    path: [start],
    expandedNodes,
    pathCost: 0,
    pathSteps: 0,
    nodesExpandedCount: expandedNodes.length,
    executionTimeMs: Number(Math.max(0.015, performance.now() - t0).toFixed(4)),
    optimalGuaranteed: true,
  };
}

export function runBFS(
  grid: number[][],
  start: [number, number],
  goal: [number, number]
): SearchResult {
  const t0 = performance.now();
  const queue: [number, number][] = [start];
  const cameFrom = new Map<string, [number, number] | null>();
  cameFrom.set(keyOf(start), null);
  const expandedNodes: [number, number][] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    expandedNodes.push([current[0], current[1]]);

    if (current[0] === goal[0] && current[1] === goal[1]) {
      const path = reconstructPath(cameFrom, current);
      const steps = Math.max(0, path.length - 1);
      return {
        algorithm: 'bfs',
        algorithmLabel: 'Breadth-First Search (BFS)',
        path,
        expandedNodes,
        pathCost: steps,
        pathSteps: steps,
        nodesExpandedCount: expandedNodes.length,
        executionTimeMs: Number(Math.max(0.015, performance.now() - t0).toFixed(4)),
        optimalGuaranteed: true,
      };
    }

    for (const neighbor of getValidNeighbors(current, grid)) {
      const nKey = keyOf(neighbor);
      if (!cameFrom.has(nKey)) {
        cameFrom.set(nKey, current);
        queue.push(neighbor);
      }
    }
  }

  return {
    algorithm: 'bfs',
    algorithmLabel: 'Breadth-First Search (BFS)',
    path: [start],
    expandedNodes,
    pathCost: 0,
    pathSteps: 0,
    nodesExpandedCount: expandedNodes.length,
    executionTimeMs: Number(Math.max(0.015, performance.now() - t0).toFixed(4)),
    optimalGuaranteed: true,
  };
}

export function runGBFS(
  grid: number[][],
  start: [number, number],
  goal: [number, number]
): SearchResult {
  const t0 = performance.now();
  const openList: Array<{ h: number; order: number; pos: [number, number] }> = [];
  let order = 0;
  openList.push({ h: manhattan(start, goal), order: order++, pos: start });

  const cameFrom = new Map<string, [number, number] | null>();
  cameFrom.set(keyOf(start), null);
  const visited = new Set<string>([keyOf(start)]);
  const expandedNodes: [number, number][] = [];

  while (openList.length > 0) {
    openList.sort((a, b) => (a.h !== b.h ? a.h - b.h : a.order - b.order));
    const current = openList.shift()!.pos;
    expandedNodes.push([current[0], current[1]]);

    if (current[0] === goal[0] && current[1] === goal[1]) {
      const path = reconstructPath(cameFrom, current);
      const steps = Math.max(0, path.length - 1);
      return {
        algorithm: 'gbfs',
        algorithmLabel: 'Greedy Best-First Search (GBFS)',
        path,
        expandedNodes,
        pathCost: steps,
        pathSteps: steps,
        nodesExpandedCount: expandedNodes.length,
        executionTimeMs: Number(Math.max(0.012, performance.now() - t0).toFixed(4)),
        optimalGuaranteed: false,
      };
    }

    for (const neighbor of getValidNeighbors(current, grid)) {
      const nKey = keyOf(neighbor);
      if (!visited.has(nKey)) {
        visited.add(nKey);
        cameFrom.set(nKey, current);
        openList.push({ h: manhattan(neighbor, goal), order: order++, pos: neighbor });
      }
    }
  }

  return {
    algorithm: 'gbfs',
    algorithmLabel: 'Greedy Best-First Search (GBFS)',
    path: [start],
    expandedNodes,
    pathCost: 0,
    pathSteps: 0,
    nodesExpandedCount: expandedNodes.length,
    executionTimeMs: Number(Math.max(0.012, performance.now() - t0).toFixed(4)),
    optimalGuaranteed: false,
  };
}

export function computeHunterHazardDeployment(
  grid: number[][],
  playerPos: [number, number],
  trackerPos: [number, number],
  cores: [number, number][],
  existingHazards: HazardZone[],
  predictedClass: BehaviorClassName
): HazardZone | null {
  const occupied = new Set<string>(existingHazards.map((h) => `${h.x},${h.z}`));
  occupied.add(keyOf(trackerPos));
  cores.forEach((c) => occupied.add(keyOf(c)));

  const [px, pz] = playerPos;
  if (predictedClass === 'Erratic Evader' && !occupied.has(keyOf(playerPos))) {
    return {
      x: px,
      z: pz,
      state: 'priming',
      turnsRemaining: 3,
      reason: 'Relocation Flush (Counters Erratic Evader)',
    };
  }

  if (cores.length > 0) {
    let nearestCore = cores[0];
    let bestD = manhattan(playerPos, nearestCore);
    for (const c of cores) {
      const d = manhattan(playerPos, c);
      if (d < bestD) {
        bestD = d;
        nearestCore = c;
      }
    }
    const corridor = runAStar(grid, playerPos, nearestCore).path;
    if (corridor.length >= 3) {
      const mid = corridor[Math.min(2, corridor.length - 2)];
      if (!occupied.has(keyOf(mid)) && grid[mid[1]][mid[0]] === 0) {
        return {
          x: mid[0],
          z: mid[1],
          state: 'priming',
          turnsRemaining: 4,
          reason: `Choke Lockdown (${predictedClass} Counter)`,
        };
      }
    }
  }

  for (const [nx, nz] of getValidNeighbors(playerPos, grid)) {
    if (!occupied.has(`${nx},${nz}`)) {
      return {
        x: nx,
        z: nz,
        state: 'priming',
        turnsRemaining: 3,
        reason: 'Escape Vector Denial',
      };
    }
  }

  return null;
}

export function executeFallbackStep(payload: {
  grid: number[][];
  trackerPos: [number, number];
  playerPos: [number, number];
  cores: [number, number][];
  hazardZones?: HazardZone[];
  algorithm: SearchAlgorithmId;
  features: number[];
  k: number;
}): AIStepResponse {
  const {
    grid,
    trackerPos,
    playerPos,
    cores,
    hazardZones = [],
    algorithm,
    features,
    k,
  } = payload;
  const overmind = predictKNN(features, k);
  const adaptation = overmind.adaptation;

  let effectiveGoal: [number, number] = [playerPos[0], playerPos[1]];
  if (
    adaptation.predictiveLeadSteps > 0 &&
    manhattan(trackerPos, playerPos) > 3 &&
    cores.length > 0
  ) {
    let nearestCore = cores[0];
    let bestD = manhattan(playerPos, nearestCore);
    for (const c of cores) {
      const d = manhattan(playerPos, c);
      if (d < bestD) {
        bestD = d;
        nearestCore = c;
      }
    }
    const dx = nearestCore[0] > playerPos[0] ? 1 : nearestCore[0] < playerPos[0] ? -1 : 0;
    const dz = nearestCore[1] > playerPos[1] ? 1 : nearestCore[1] < playerPos[1] ? -1 : 0;
    const cx = playerPos[0] + dx;
    const cz = playerPos[1] + dz;
    if (
      cz >= 0 &&
      cz < grid.length &&
      cx >= 0 &&
      cx < grid[0].length &&
      grid[cz][cx] !== 1
    ) {
      effectiveGoal = [cx, cz];
    }
  }

  const resAstarDirect = runAStar(grid, trackerPos, playerPos, adaptation);
  const resBfs = runBFS(grid, trackerPos, playerPos);
  const resGbfs = runGBFS(grid, trackerPos, playerPos);

  let activeSearch: SearchResult;
  if (algorithm === 'astar') {
    activeSearch = runAStar(grid, trackerPos, effectiveGoal, adaptation);
    if (
      (effectiveGoal[0] !== playerPos[0] || effectiveGoal[1] !== playerPos[1]) &&
      activeSearch.path.length <= 2
    ) {
      activeSearch = resAstarDirect;
    }
  } else if (algorithm === 'bfs') {
    activeSearch = resBfs;
  } else {
    activeSearch = resGbfs;
  }

  const nextTrackerPos: [number, number] =
    activeSearch.path.length > 1
      ? [activeSearch.path[1][0], activeSearch.path[1][1]]
      : [trackerPos[0], trackerPos[1]];

  const spawnedHazard = computeHunterHazardDeployment(
    grid,
    playerPos,
    trackerPos,
    cores,
    hazardZones,
    overmind.predictedClass
  );

  return {
    status: 'ok',
    engine: 'Python 3 Mirror Engine',
    nextTrackerPos,
    effectiveGoal,
    activeSearch,
    comparison: {
      astar: resAstarDirect,
      bfs: resBfs,
      gbfs: resGbfs,
    },
    overmind,
    spawnedHazard,
  };
}

export function executeFallbackEvaluation(k = 5): KNNEvaluationResponse {
  const evaluation = evaluateKNN(k);
  const kSensitivity = [1, 3, 5, 7, 9].map((kv) => {
    const res = evaluateKNN(kv);
    return {
      k: kv,
      accuracy: res.accuracy,
      errorRate: res.errorRate,
    };
  });
  return {
    status: 'ok',
    engine: 'Python 3 Mirror Engine',
    evaluation,
    kSensitivity,
  };
}
