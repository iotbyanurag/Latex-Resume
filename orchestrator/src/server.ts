import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
// NodeNext/ESM requires explicit .js extensions for local relative imports
import { ResumeRunRouter } from '../../agents/router.js';

const app = express();
const router = new ResumeRunRouter();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/runs', async (_req, res, next) => {
  try {
    const runs = await router.listRuns();
    res.json(runs);
  } catch (error) {
    next(error);
  }
});

app.get('/runs/:runId', async (req, res, next) => {
  try {
    const run = await router.getRun(req.params.runId);
    res.json(run);
  } catch (error) {
    next(error);
  }
});

app.post('/runs', async (req, res, next) => {
  try {
    const summary = await router.createRun(req.body);
    res.status(201).json({ runId: summary.id });
  } catch (error) {
    next(error);
  }
});

import type { NextFunction, Request, Response } from 'express';

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Orchestrator listening on port ${port}`);
});
