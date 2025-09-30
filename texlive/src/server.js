import express from 'express';
import { spawn } from 'child_process';
import path from 'path';

const app = express();
app.use(express.json({ limit: '1mb' }));

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/workspace';
const RESUME_DIR = process.env.RESUME_DIR || path.join(WORKSPACE_ROOT, 'resume');

function runLatex() {
  return new Promise((resolve) => {
    const child = spawn('latexmk', ['-pdf', '-interaction=nonstopmode', '-halt-on-error', 'cv.tex'], {
      cwd: RESUME_DIR
    });

    let log = '';
    child.stdout.on('data', (chunk) => {
      log += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      log += chunk.toString();
    });
    child.on('close', (code) => {
      const cleaner = spawn('latexmk', ['-c'], { cwd: RESUME_DIR });
      cleaner.on('close', () => resolve({ log, code: code ?? 1 }));
    });
  });
}

app.post('/build', async (req, res) => {
  const { runId = 'manual' } = req.body ?? {};
  const started = Date.now();
  try {
    const result = await runLatex();
    const durationMs = Date.now() - started;
    if (result.code !== 0) {
      return res.status(500).json({ status: 'FAILED', runId, durationMs, log: result.log });
    }
    return res.json({ status: 'OK', runId, durationMs, log: result.log });
  } catch (error) {
    return res.status(500).json({
      status: 'FAILED',
      runId,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

const port = Number(process.env.PORT || 5001);
app.listen(port, () => {
  console.log(`TeX builder listening on port ${port}`);
});
