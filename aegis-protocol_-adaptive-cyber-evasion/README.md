🛡️ AEGIS PROTOCOL: Adaptive Cyber Evasion & AI Pursuit SimulatorAEGIS PROTOCOL is an advanced, gamified cyber-security simulation demonstrating autonomous pursuit and real-time behavioral profiling. The application simulates a high-stakes grid intrusion where a human field operative evades an autonomous tracker drone.Built strictly in Python with custom CSS cyber-aesthetics, the project integrates two distinct AI paradigms—$A^*$ Pathfinding and K-Nearest Neighbors (KNN)—to deliver dynamic difficulty adjustments and real-time algorithmic telemetry.
📋 Table of ContentsExecutive OverviewKey FeaturesDual-AI Architecture & Mathematics1. Search AI: $A^*$ Pathfinding2. Machine Learning AI: KNN Behavioral Profiler3. Meaningful AI Integration (DDA)Repository StructureInstallation & SetupSystem WalkthroughEvaluation Metrics & Live TelemetryEthical ConsiderationsRubric & Assessment MappingLicense & Credits🔬 Executive OverviewWhile presented as a tactical grid game, AEGIS PROTOCOL models a real-world Autonomous Drone Security & Countermeasures System. It evaluates how autonomous units can optimize search trajectories in constrained environments while dynamically adapting to human evasion behavior. 

       +--------------------------------------------------------+
       |               PLAYER (The Operative)                   |
       +--------------------------------------------------------+
                                   |
                         Movement Data & Timings
                                   v
       +--------------------------------------------------------+
       |             KNN Behavioral Classifier                  |
       |       Profiles: Aggressive | Cautious | Panic          |
       +--------------------------------------------------------+
                                   |
                      Dynamic Difficulty Modulation
                                   v
       +--------------------------------------------------------+
       |            A* Pathfinding Search Engine                |
       |     Calculates Optimal Pursuit Trajectory & Cost       |
       +--------------------------------------------------------+
                                   |
                        Pursuit Action & Telemetry
                                   v
       +--------------------------------------------------------+
       |                Streamlit Dashboard UI                  |
       +--------------------------------------------------------+
       
✨ Key FeaturesDark Cyber Custom UI: Custom HTML/CSS styling over Streamlit to override default themes with neon accents, custom grid rendering, and responsive controls.Secure Authentication System: User sessions managed via hashed credentials (bcrypt) and state persistent data (st.session_state).Real-Time AI Telemetry: Side-by-side metric stream rendering search latency ($\text{ms}$), nodes expanded, path cost, and live classification updates.Dynamic Difficulty Adjustment (DDA): The pursuit algorithm adapts its aggressiveness and tactical behavior based on real-time classification of player movement style.Comprehensive Evaluation Suite: Embedded post-game analytics featuring $A^*$ efficiency curves, KNN confusion matrix visualizations, and an automated Markdown report exporter.
🧮 Dual-AI Architecture & Mathematics1. Search AI: $A^*$ PathfindingThe primary threat unit (Tracker Node) uses the $A^*$ search algorithm implemented from scratch without black-box pathfinding libraries.Evaluation Function:
$$f(n) = g(n) + h(n)$$
Where $g(n)$ is the exact cost from the start node to current node $n$, and $h(n)$ is the heuristic estimation cost to the goal.Grid Heuristic (Manhattan Distance):
$$h(n) = \vert{}x_{\text{tracker}} - x_{\text{player}}\vert{} + \vert{}y_{\text{tracker}} - y_{\text{player}}\vert{}$$Telemetry Outputs: Total expanded nodes, optimal path array, step cost, execution time ($\text{ms}$).2. Machine Learning AI: KNN Behavioral ProfilerThe background monitoring engine (The Overmind) classifies human player state across a sliding window of recent moves using a custom K-Nearest Neighbors implementation.Feature Extraction Vector:
$$\mathbf{x} = \begin{bmatrix} \Delta t_{\text{input}} \\ \text{Proximity}_{\text{wall}} \\ d_{\text{hunter}} \end{bmatrix}$$$\Delta t_{\text{input}}$: Average elapsed time between key inputs (ms).$\text{Proximity}_{\text{wall}}$: Ratio of moves made adjacent to grid boundaries or obstacles.$d_{\text{hunter}}$: Mean Manhattan distance maintained from the tracker node.Distance Metric (Euclidean Distance):
$$d(\mathbf{p}, \mathbf{q}) = \sqrt{\sum_{i=1}^{3} (p_i - q_i)^2}$$Target Classes:Aggressive/Rusher (Fast inputs, direct movement toward objectives).Tactical/Cautious (Slow, deliberate moves, high obstacle usage).Erratic/Panic (Inconsistent timings, rapid direction toggles).3. Meaningful AI Integration (DDA)The two AI components interact in a continuous feedback loop:Classified ProfileA∗ Search & Tracker ModifierDynamic EffectAggressiveVelocity DoublingTracker executes 2 search updates per player move.TacticalPredictive Intercept$A^*$ targets predicted future grid coordinate of player.ErraticTrap PlacementDeploys temporary low-cost digital barriers onto grid space.
📁 Repository Structureaegis-protocol/

├── main.py             # Main entry point & Streamlit page layout
├── config.py           # Game parameters & cyber UI CSS theme definitions
├── auth.py             # User authentication & session state management
├── game_engine.py      # Core game state machine & grid generator
├── grid_ui.py          # Custom HTML/CSS grid rendering engine
├── ai_tracker.py       # A* Search algorithm implementation
├── ml_profiler.py      # KNN behavioral classifier & feature extraction
├── telemetry_ui.py     # Real-time telemetry dashboard components
├── eval_dashboard.py   # Post-match evaluation analytics & Matplotlib visualizers
├── ethics_ui.py        # Autonomous ethics & limitations write-up panel
├── report_gen.py       # Automated Markdown academic report generator
├── requirements.txt    # Project dependencies
└── README.md           # Project documentation

⚙️ Installation & SetupPrerequisitesPython 3.9 or higher installed on your system.Quickstart GuideClone the Repository:git clone https://github.com/your-username/aegis-protocol.git
cd aegis-protocol
Create a Virtual Environment:# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
Install Dependencies:pip install -r requirements.txt
Launch the Application:streamlit run main.py
Access the Web Interface:Open your browser and navigate to
🎮 System WalkthroughAuthentication: Create an account or log in via the secure portal.Level Selection: Choose operational difficulty (Level 1 to Level 5) to dynamically scale grid dimensions ($10 \times 10$ to $25 \times 25$) and obstacle density.Active Evasion: Use directional controls to collect all Data Core Objectives ($\text{Gold Orbs}$) while avoiding the Tracker Node ($\text{Red Hexagon}$).Live Telemetry Inspection: Monitor real-time search node expansions and KNN behavioral classifications in the collateral dashboard tab.Post-Match Analytics: Upon victory or capture, review performance curves, confusion matrix accuracy metrics, and export the generated .md academic report.
📊 Evaluation Metrics & Live TelemetryDuring execution, AEGIS PROTOCOL captures quantitative performance data required for academic analysis:Search Performance Metrics:Nodes Expanded: Quantifies $A^*$ computational work across varying obstacle densities.Execution Latency: Search compute time measured in milliseconds per turn.Path Cost: Actual step count of the calculated optimal trajectory.Machine Learning Evaluation Metrics:Classification Confusion Matrix: Evaluates KNN prediction precision vs. actual move patterns.DDA Shift Rate: Tracks frequency of dynamic difficulty state changes during operational runs.
⚖️ Ethical ConsiderationsThe system includes a dedicated module addressing ethical dilemmas related to autonomous AI systems:Autonomous Lethality & Pursuit: Theoretical risks of deploying unmonitored pathfinding pursuit algorithms in physical security or defense drones.Algorithmic Bias in Profiling: How synthetic KNN training datasets may incorrectly classify atypical human movement patterns as hostile or erratic.Data Privacy: Safe handling and storage of behavioral telemetry during user interaction sessions.
💯 Rubric & Assessment MappingThis project is engineered to meet all criteria for the university AI Lab Project evaluation (40 Marks total):Rubric CriteriaAllocated MarksImplementation SummaryProblem Selection & Proposal4Frame as a real-world autonomous security drone pursuit & behavioral simulation.AI Relevance4Direct application of $A^*$ pathfinding and KNN machine learning classification.Algorithm Implementation6Custom, self-written Python implementations for both $A^*$ and KNN from scratch.Integration of AI Components4Meaningful DDA coupling where KNN profile output directly alters $A^*$ pursuit rules.Dataset / Input Handling3Dynamic grid state generation, sliding window feature vector extraction, clean input bounds checking.Testing & Evaluation4Live telemetry metric streams, line graphs of expanded nodes, execution times, and KNN confusion matrices.Code Quality3Strictly modular 11-file architecture, DRY principle adherence, extensive inline academic comments.User Interface / Usability2Custom cyber CSS overlay, responsive flex grid rendering, clear metric layout.Report Quality5Automated module exporting fully formatted academic report in Markdown format.Ethics & Practice2Interactive Ethics tab discussing autonomous pursuit systems, bias, and privacy.Presentation & Viva3Built-in telemetry dashboard for live visual demonstration during viva evaluation.
📜 License & CreditsDistributed under the MIT License. See LICENSE for details.Developed for the Artificial Intelligence Laboratory Project
.Team Members: 2025(S)-SE-83, 2025(S)-SE-69, 2025(S)-SE-92
