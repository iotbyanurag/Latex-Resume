import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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

const server = new McpServer({
  name: 'resume-orchestrator',
  version: '0.1.0'
});

const runStatusValues = ['pending', 'running', 'needs_review', 'failed', 'completed'] as const;

const listRunsInputSchema = z.object({
  status: z.enum(runStatusValues).optional(),
  limit: z.number().int().min(1).max(100).optional()
});

const getRunInputSchema = z.object({
  runId: z.string()
});

const createRunInputSchema = z.object({
  jobDescription: z.string(),
  dryRun: z.boolean(),
  providers: z.object({
    reviewer: z.enum(['groq', 'claude', 'gemini']),
    swot: z.enum(['groq', 'claude', 'gemini']),
    refiner: z.enum(['groq', 'claude', 'gemini']),
    judge: z.enum(['groq', 'claude', 'gemini']),
    finalizer: z.enum(['groq', 'claude', 'gemini'])
  })
});

server.registerTool(
  'list-runs',
  {
    description: 'List stored resume automation runs. Optionally filter by status or limit the number returned.',
    inputSchema: listRunsInputSchema
  },
  async (args) => {
    const runs = await router.listRuns();
    let filtered = runs;

    if (args.status) {
      filtered = filtered.filter((run: any) => run.status === args.status);
    }

    if (typeof args.limit === 'number') {
      filtered = filtered.slice(0, args.limit);
    }

    return {
      content: [
        {
          type: 'json',
          data: filtered
        }
      ]
    };
  }
);

server.registerTool(
  'get-run',
  {
    description: 'Retrieve a specific run summary by its identifier.',
    inputSchema: getRunInputSchema
  },
  async (args) => {
    try {
      const run = await router.getRun(args.runId);
      return {
        content: [
          {
            type: 'json',
            data: run
          }
        ]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching run';
      throw new Error(message);
    }
  }
);

server.registerTool(
  'create-run',
  {
    description: 'Kick off a new resume automation run using the supplied configuration.',
    inputSchema: createRunInputSchema
  },
  async (args) => {
    const summary = await router.createRun(args);
    return {
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
  }
);

async function startServer() {
  await loadModules();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Resume MCP server ready (stdio).');

  const shutdown = async (signal: string) => {
    console.error(`Received ${signal}, shutting down MCP server.`);
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

startServer().catch(console.error);