import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn, execFileSync, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import {
  executeFallbackEvaluation,
  executeFallbackStep,
} from './src/ai/fallbackEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent Python 3 AI Subprocess Manager (JSON-RPC over stdin/stdout)
class PythonAIBridge {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private queue: Array<{
    resolve: (val: unknown) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  constructor() {
    this.startDaemon();
  }

  private startDaemon() {
    try {
      const scriptPath = path.join(__dirname, 'ai_engine.py');
      this.proc = spawn('python3', ['-u', scriptPath, '--daemon'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const rl = readline.createInterface({
        input: this.proc.stdout,
        terminal: false,
      });

      rl.on('line', (line) => {
        const pending = this.queue.shift();
        if (!pending) return;
        clearTimeout(pending.timer);
        try {
          const parsed = JSON.parse(line);
          pending.resolve(parsed);
        } catch (err) {
          pending.reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      this.proc.on('error', () => {
        this.proc = null;
      });

      this.proc.on('exit', () => {
        this.proc = null;
        while (this.queue.length > 0) {
          const item = this.queue.shift()!;
          clearTimeout(item.timer);
          item.reject(new Error('Python daemon exited'));
        }
      });
    } catch {
      this.proc = null;
    }
  }

  public async request(payload: Record<string, unknown>): Promise<unknown> {
    if (!this.proc || this.proc.killed) {
      this.startDaemon();
    }
    if (!this.proc) {
      throw new Error('Python 3 process unavailable');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex((q) => q.timer === timer);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(new Error('Python AI Engine request timeout'));
      }, 1500);

      this.queue.push({ resolve, reject, timer });
      this.proc!.stdin.write(JSON.stringify(payload) + '\n');
    });
  }
}

const pythonBridge = new PythonAIBridge();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // 1. Live AI Step Endpoint (Executes A*, BFS, GBFS, and KNN in Python 3)
  app.post('/api/ai/step', async (req, res) => {
    const payload = {
      action: 'step',
      grid: req.body?.grid ?? [],
      trackerPos: req.body?.trackerPos ?? [1, 1],
      playerPos: req.body?.playerPos ?? [7, 7],
      cores: req.body?.cores ?? [],
      hazardZones: req.body?.hazardZones ?? [],
      algorithm: req.body?.algorithm ?? 'astar',
      features: req.body?.features ?? [280.0, 0.35, 0.3, 0.75, 0.12],
      k: Number(req.body?.k ?? 5),
    };

    try {
      const pyResult = await pythonBridge.request(payload);
      res.json(pyResult);
    } catch {
      const fallback = executeFallbackStep(payload);
      res.json(fallback);
    }
  });

  // 2. KNN Cross-Validation & Confusion Matrix Endpoint
  app.post('/api/ai/evaluate', async (req, res) => {
    const k = Number(req.body?.k ?? 5);
    try {
      const pyEval = await pythonBridge.request({
        action: 'evaluate_knn',
        k,
      });
      res.json(pyEval);
    } catch {
      const fallbackEval = executeFallbackEvaluation(k);
      res.json(fallbackEval);
    }
  });

  // 3. Python Source Code & Terminal Demo Output Endpoint for AI Lab Deliverable
  app.get('/api/ai/python-source', (_req, res) => {
    try {
      const scriptPath = path.join(__dirname, 'ai_engine.py');
      const sourceCode = fs.readFileSync(scriptPath, 'utf-8');
      let cliDemoOutput = '';
      try {
        cliDemoOutput = execFileSync('python3', [scriptPath, '--demo'], {
          encoding: 'utf-8',
          timeout: 3000,
        });
      } catch {
        cliDemoOutput =
          'Python 3 AI Engine Ready. Run `python3 ai_engine.py --demo` in terminal.';
      }
      res.json({
        status: 'ok',
        filename: 'ai_engine.py',
        sourceCode,
        cliDemoOutput,
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unable to read ai_engine.py',
      });
    }
  });

  // Mount Vite middleware in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AEGIS PROTOCOL Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
