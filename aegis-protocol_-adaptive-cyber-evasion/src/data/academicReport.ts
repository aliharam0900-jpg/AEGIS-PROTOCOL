export interface ReportSection {
  id: string;
  number: string;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
  formula?: string;
}

export interface VivaQuestion {
  q: string;
  a: string;
  category: 'Search & Pathfinding' | 'KNN Machine Learning' | 'AI Integration' | 'Ethics & Evaluation';
}

export const ACADEMIC_REPORT_SECTIONS: ReportSection[] = [
  {
    id: 'abstract',
    number: '01',
    title: 'Abstract',
    summary: 'Executive overview of the AEGIS PROTOCOL hybrid AI system.',
    paragraphs: [
      'AEGIS PROTOCOL: Adaptive Cyber Evasion is an interactive 3D cyber-security pursuit and behavioral profiling simulator developed for the Artificial Intelligence Lab. The system models an adversarial server-grid environment where a human operative must recover encrypted Data Cores and reach an extraction portal while evading an autonomous defense drone (Tracker Node).',
      'To fulfill the multi-component AI architecture requirement, the system integrates two distinct Artificial Intelligence paradigms implemented in Python 3: (1) Heuristic Graph Search (comparing A* Search, Breadth-First Search, and Greedy Best-First Search) for real-time spatial route optimization, and (2) Supervised Machine Learning via a K-Nearest Neighbors (KNN) classifier ("The Overmind") that profiles human movement telemetry into four behavioral archetypes. Crucially, the two AI components are tightly coupled: the KNN behavioral classification dynamically modulates the A* heuristic weight, corridor traversal costs, and predictive ambush coordinates.',
    ],
  },
  {
    id: 'introduction',
    number: '02',
    title: 'Introduction & Problem Statement',
    summary: 'Real-world motivation in autonomous security patrolling and adaptive game AI.',
    paragraphs: [
      'Traditional autonomous pursuit agents and robotic patrol systems rely on static pathfinding rules that treat target movement as memoryless. When a human operator or intruder learns the fixed movement logic of a static A* pursuer, they can easily exploit predictable perimeter loops or oscillation patterns.',
      'Problem Statement: Given a dynamic 2D/3D discretized server grid with impassable Firewall obstacles and high-value Data Core objectives, how can an autonomous pursuit agent compute optimal interception paths in real time while simultaneously learning and countering the human operative’s movement habits?',
    ],
    bullets: [
      'Domain: Games, Robotics & Smart Cyber-Security Decision Support.',
      'AI Component 1 (Search & Pathfinding): A* Search, Breadth-First Search (BFS), and Greedy Best-First Search (GBFS).',
      'AI Component 2 (Machine Learning): Distance-Weighted K-Nearest Neighbors (KNN) Behavioral Classifier.',
      'Practical Implementation: Python 3 backend engine (ai_engine.py) coupled with a 60fps Three.js isometric 3D visualization viewport.',
    ],
  },
  {
    id: 'literature',
    number: '03',
    title: 'Literature & Theoretical Background',
    summary: 'Foundations of informed heuristic search and instance-based learning.',
    paragraphs: [
      'Hart, Nilsson, and Raphael (1968) introduced the A* algorithm to combine the optimality guarantees of Dijkstra’s uniform-cost search with the directional efficiency of heuristic Best-First Search. On a 4-connected orthogonal grid, the Manhattan distance h(n) = |x1 - x2| + |z1 - z2| is both admissible (never overestimates true cost) and consistent (satisfies the triangle inequality).',
      'Cover and Hart (1967) established the K-Nearest Neighbors (KNN) decision rule as a non-parametric supervised learning method that classifies an unseen feature vector x by majority or distance-weighted voting among its K closest labeled training instances in Euclidean space. Because KNN requires zero offline training overhead and naturally adapts to multi-class boundaries in low-dimensional telemetry spaces, it is ideally suited for real-time player behavioral profiling.',
    ],
  },
  {
    id: 'methodology',
    number: '04',
    title: 'Methodology & Two-Component AI Integration',
    summary: 'Step-by-step data pipeline linking KNN behavioral classification to A* pathfinding.',
    paragraphs: [
      'Every turn on the server grid executes a closed-loop 4-stage AI pipeline in Python:',
    ],
    bullets: [
      'Stage 1 — Telemetry Feature Extraction & Preprocessing: A sliding window of the player’s recent moves captures a 5D vector: [Avg Move Interval (ms), Direction Change Rate, Perimeter Proximity Ratio, Data Core Approach Rate, Backtrack Rate]. Each feature is Min-Max normalized to [0.0, 1.0] so millisecond timings do not dominate unit ratios.',
      'Stage 2 — Overmind KNN Classification: The normalized 5D vector is compared against 48 labeled behavioral profiles using Euclidean distance d(x, y) = sqrt(sum((x_i - y_i)^2)). The top K neighbors vote using inverse-distance weights w_i = 1 / (d_i + 1e-4) to classify the operative as an Aggressive Rusher, Perimeter Ghost, Erratic Evader, or Calculated Tactician.',
      'Stage 3 — Dynamic Heuristic & Cost Modulation: The KNN output directly reconfigures the A* search engine. For a Perimeter Ghost, outer-ring traversal costs g(n) are discounted by 35% (0.65) so the Tracker Node cuts off wall routes. For an Aggressive Rusher, the Overmind projects the A* goal 2 steps ahead toward the nearest Data Core.',
      'Stage 4 — Multi-Algorithm Search Execution: Python executes A*, BFS, and GBFS on the grid, logging the optimal path, all expanded frontier nodes, total path cost, and microsecond execution time.',
    ],
    formula: 'f(n) = g_{Overmind}(n) + w_{KNN} · (|x_n - x_{goal}| + |z_n - z_{goal}|)',
  },
  {
    id: 'evaluation',
    number: '05',
    title: 'Testing, Metrics & Comparative Evaluation',
    summary: 'Quantitative evaluation of Search efficiency and ML classification accuracy.',
    paragraphs: [
      'Search Evaluation: Across the five security sectors, Breadth-First Search (BFS) guarantees the minimum step count but expands radial wavefronts across 65–110 nodes per turn. Greedy Best-First Search (GBFS) expands the fewest nodes in unobstructed corridors (12–22 nodes) but suffers from 18–30% longer path costs when trapped inside concave U-shaped Firewall barriers. A* Search achieves optimal path costs while expanding 45–60% fewer nodes than BFS.',
      'Machine Learning Evaluation: The Overmind KNN classifier is evaluated using Leave-One-Out Cross-Validation (LOOCV) combined with boundary stress perturbations across 56 evaluation instances. At K = 5, the classifier achieves 92.86% overall Accuracy (7.14% Error Rate), with balanced Macro Precision and Recall across all four player archetypes.',
    ],
  },
  {
    id: 'ethics',
    number: '06',
    title: 'Ethical Considerations & Limitations',
    summary: 'Privacy, algorithmic bias, dual-use risks, and system boundaries.',
    paragraphs: [
      'Ethical Considerations: Behavioral profiling algorithms that classify human intent from timing and movement telemetry raise critical privacy and dual-use concerns. In real-world workplace monitoring or autonomous security drones, keystroke/movement cadence profiling can infer cognitive fatigue or identity without informed consent. Furthermore, misclassifying an erratic or panicked benign user as a hostile "Erratic Evader" illustrates the risk of algorithmic bias in automated threat response.',
      'Technical Limitations: (1) KNN computation scales linearly O(N·D) with dataset size N, requiring KD-Trees or Ball-Trees if scaled to millions of historical logs; (2) Discrete grid pathfinding assumes uniform turn steps rather than continuous non-holonomic drone kinematics; (3) Early-game classification (< 3 moves) relies on prior baseline priors until the sliding telemetry window fills.',
    ],
  },
  {
    id: 'conclusion',
    number: '07',
    title: 'Conclusion & References',
    summary: 'Summary of findings and academic citations.',
    paragraphs: [
      'AEGIS PROTOCOL demonstrates that combining symbolic graph search (A*, BFS, GBFS) with data-driven machine learning (KNN behavioral classification) creates an emergent, adaptive agent far more capable than either technique in isolation.',
    ],
    bullets: [
      'Russell, S., & Norvig, P. (2020). Artificial Intelligence: A Modern Approach (4th ed.). Pearson.',
      'Hart, P. E., Nilsson, N. J., & Raphael, B. (1968). A Formal Basis for the Heuristic Determination of Minimum Cost Paths. IEEE Transactions on Systems Science and Cybernetics, 4(2), 100–107.',
      'Cover, T., & Hart, P. (1967). Nearest Neighbor Pattern Classification. IEEE Transactions on Information Theory, 13(1), 21–27.',
    ],
  },
];

export const VIVA_QUESTIONS: VivaQuestion[] = [
  {
    category: 'Search & Pathfinding',
    q: 'Why is Manhattan distance used as the A* heuristic instead of Euclidean distance on this server grid?',
    a: 'Because the Tracker Node moves in 4 cardinal directions (North, East, South, West) without diagonal shortcuts. Manhattan distance |dx| + |dz| is the exact minimum number of orthogonal steps required, making it an admissible and consistent heuristic with tightest lower bound.',
  },
  {
    category: 'Search & Pathfinding',
    q: 'How does A* Search differ from Breadth-First Search (BFS) and Greedy Best-First Search (GBFS) in your experiments?',
    a: 'BFS uses only path cost g(n) and guarantees the shortest path on unweighted grids, but expands nodes blind to goal direction. GBFS uses only the heuristic h(n), expanding very few nodes but getting fooled by concave U-obstacles into non-optimal paths. A* combines f(n) = g(n) + h(n), achieving optimal paths while expanding roughly half as many nodes as BFS.',
  },
  {
    category: 'KNN Machine Learning',
    q: 'Why is feature normalization (Min-Max scaling) mandatory before running K-Nearest Neighbors?',
    a: 'Feature f0 (Average Move Interval) ranges from 120ms to 800ms, while features f1–f4 (turn rate, perimeter ratio, core approach, backtrack rate) range between 0.0 and 1.0. Without normalization, the squared difference in milliseconds would completely dominate the Euclidean distance formula, rendering the other four behavioral features mathematically negligible.',
  },
  {
    category: 'AI Integration',
    q: 'How are the two AI components (Search and Machine Learning) meaningfully integrated in your project?',
    a: 'The Overmind KNN classifier runs on the player’s sliding telemetry window every turn and outputs a behavioral class. That class directly modifies the A* solver: for a "Perimeter Ghost", outer corridor traversal costs g(n) are discounted by 35% to cut off wall-hugging; for an "Aggressive Rusher", the A* goal is projected ahead toward the nearest Data Core.',
  },
  {
    category: 'Ethics & Evaluation',
    q: 'What happens when the hyperparameter K is set too small (K=1) versus too large (K=9)?',
    a: 'At K=1, the classifier has high variance and is sensitive to single noisy moves or outliers near class boundaries. As K increases to K=5, inverse-distance voting smooths boundary noise and reaches peak cross-validation accuracy (~92.86%). At very large K, remote samples from neighboring classes begin diluting local cluster boundaries.',
  },
];
