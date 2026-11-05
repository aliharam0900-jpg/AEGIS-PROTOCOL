import { SectorConfig } from '../types/game';

export const SECTORS: SectorConfig[] = [
  {
    id: 1,
    code: 'SEC-01',
    name: 'Perimeter Gateway Vault',
    subtitle: 'Symmetric server corridors with central firewall U-traps ideal for comparing A* vs GBFS.',
    difficulty: 'Standard',
    gridSize: 13,
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    operativeStart: [6, 11],
    trackerStart: [6, 1],
    dataCores: [
      [1, 6],
      [11, 6],
      [6, 4],
    ],
    extractionPortal: [6, 12],
    empCharges: 2,
  },
  {
    id: 2,
    code: 'SEC-02',
    name: 'Neural Switchboard Array',
    subtitle: 'Interlocking data conduits where perimeter wall-hugging triggers Overmind KNN cutoff.',
    difficulty: 'Elevated',
    gridSize: 13,
    grid: [
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0],
      [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
      [0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0],
      [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    ],
    operativeStart: [1, 11],
    trackerStart: [11, 1],
    dataCores: [
      [2, 2],
      [6, 6],
      [10, 10],
      [10, 2],
    ],
    extractionPortal: [0, 6],
    empCharges: 2,
  },
  {
    id: 3,
    code: 'SEC-03',
    name: 'Deep Packet Labyrinth',
    subtitle: 'Dense concave firewall pockets that expose Greedy Best-First Search suboptimality.',
    difficulty: 'High Security',
    gridSize: 13,
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
      [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    operativeStart: [6, 12],
    trackerStart: [6, 0],
    dataCores: [
      [2, 2],
      [10, 2],
      [6, 6],
      [2, 10],
    ],
    extractionPortal: [12, 6],
    empCharges: 3,
  },
  {
    id: 4,
    code: 'SEC-04',
    name: 'Overmind Core Sanctum',
    subtitle: 'Multi-ring mainframe with high-risk inner shortcuts and rapid predictive interception.',
    difficulty: 'Critical',
    gridSize: 13,
    grid: [
      [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0],
      [1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
      [1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1],
      [0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    ],
    operativeStart: [0, 12],
    trackerStart: [12, 0],
    dataCores: [
      [2, 2],
      [10, 2],
      [6, 6],
      [2, 10],
      [10, 10],
    ],
    extractionPortal: [6, 0],
    empCharges: 3,
  },
];

export function generateProceduralSector(seedNumber = Date.now()): SectorConfig {
  const size = 13;
  let seed = seedNumber % 2147483647;
  if (seed <= 0) seed += 2147483646;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  for (let z = 1; z < size - 1; z++) {
    for (let x = 1; x <= Math.floor(size / 2); x++) {
      if ((x === 1 && z === 11) || (x === 6 && z === 6)) continue;
      if (nextRand() < 0.28) {
        grid[z][x] = 1;
        grid[z][size - 1 - x] = 1;
      }
    }
  }

  // Carve guaranteed perimeter and cross highways so the graph is 100% connected
  for (let i = 0; i < size; i++) {
    grid[0][i] = 0;
    grid[size - 1][i] = 0;
    grid[i][0] = 0;
    grid[i][size - 1] = 0;
    grid[6][i] = 0;
    grid[i][6] = 0;
  }

  // Place a classic concave U-barrier near center to highlight A* vs GBFS
  grid[4][5] = 1;
  grid[4][6] = 1;
  grid[4][7] = 1;
  grid[5][5] = 1;
  grid[5][7] = 1;

  return {
    id: 5,
    code: 'SEC-X',
    name: 'Procedural Cyber Matrix',
    subtitle: 'Dynamically synthesized server topology with guaranteed graph connectivity.',
    difficulty: 'Apex',
    gridSize: size,
    grid,
    operativeStart: [1, 11],
    trackerStart: [11, 1],
    dataCores: [
      [2, 2],
      [10, 2],
      [6, 6],
      [10, 10],
    ],
    extractionPortal: [6, 0],
    empCharges: 3,
  };
}
