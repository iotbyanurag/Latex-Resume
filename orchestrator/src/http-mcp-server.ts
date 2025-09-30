import express from 'express';
import cors from 'cors';
import { z } from 'zod';

// Dynamic imports to avoid module resolution issues
let ResumeRunRouter: any;
let runConfigSchema: any;
let router: any;

async function loadModules() {
  const routerModule = await import('../../agents/router.ts');
  const schemasModule = await import('../../agents/schemas.ts');
  
  ResumeRunRouter = routerModule.default;
  runConfigSchema = schemasModule.runConfigSchema;
  router = new ResumeRunRouter();
}

const app = express();
app.use(cors());
app.use(express.json());

// MCP Server Info
const MCP_INFO = {
  name: 'resume-orchestrator',
  version: '0.1.0',
  description: 'AI Resume Orchestrator - Multi-agent resume optimization system'
};

// MCP Tools
const TOOLS = [
  {
    name: 'list-runs',
    description: 'List stored resume automation runs. Optionally filter by status or limit the number returned.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'running', 'needs_review', 'failed', 'completed'],
          description: 'Filter runs by status'
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          description: 'Limit the number of runs returned'
        }
      }
    }
  },
  {
    name: 'get-run',
    description: 'Retrieve a specific run summary by its identifier.',
    inputSchema: {
      type: 'object',
      properties: {
        runId: {
          type: 'string',
          description: 'The unique identifier of the run'
        }
      },
      required: ['runId']
    }
  },
  {
    name: 'create-run',
    description: 'Kick off a new resume automation run using the supplied configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        jobDescription: {
          type: 'string',
          minLength: 10,
          description: 'The job description to optimize the resume for'
        },
        dryRun: {
          type: 'boolean',
          description: 'Whether to run in dry-run mode (no actual changes)'
        },
        providers: {
          type: 'object',
          properties: {
            reviewer: { type: 'string', enum: ['groq', 'claude', 'gemini'] },
            swot: { type: 'string', enum: ['groq', 'claude', 'gemini'] },
            refiner: { type: 'string', enum: ['groq', 'claude', 'gemini'] },
            judge: { type: 'string', enum: ['groq', 'claude', 'gemini'] },
            finalizer: { type: 'string', enum: ['groq', 'claude', 'gemini'] }
          },
          required: ['reviewer', 'swot', 'refiner', 'judge', 'finalizer']
        }
      },
      required: ['jobDescription', 'dryRun', 'providers']
    }
  }
];

// MCP Endpoints
app.get('/mcp/info', (req, res) => {
  res.json(MCP_INFO);
});

app.get('/mcp/tools', (req, res) => {
  res.json({ tools: TOOLS });
});

app.post('/mcp/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const args = req.body;

  try {
    let result;

    switch (toolName) {
      case 'list-runs':
        const runs = await router.listRuns();
        let filtered = runs;

        if (args.status) {
          filtered = filtered.filter((run: any) => run.status === args.status);
        }

        if (typeof args.limit === 'number') {
          filtered = filtered.slice(0, args.limit);
        }

        result = {
          content: [
            {
              type: 'json',
              data: filtered
            }
          ]
        };
        break;

      case 'get-run':
        const run = await router.getRun(args.runId);
        result = {
          content: [
            {
              type: 'json',
              data: run
            }
          ]
        };
        break;

      case 'create-run':
        const summary = await router.createRun(args);
        result = {
          content: [
            {
              type: 'json',
              data: {
                runId: summary.id,
                summary
              }
            }
          ]
        };
        break;

      default:
        return res.status(404).json({ error: 'Tool not found' });
    }

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await loadModules();
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 HTTP MCP Server running on port ${PORT}`);
    console.log(`📊 MCP Info: http://localhost:${PORT}/mcp/info`);
    console.log(`🔧 Tools: http://localhost:${PORT}/mcp/tools`);
    console.log(`❤️ Health: http://localhost:${PORT}/health`);
  });
}

startServer().catch(console.error);
