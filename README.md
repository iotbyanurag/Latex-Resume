# AI Resume Orchestrator

Local, multi-agent workflow for aligning an existing LaTeX resume with a target Job Description (JD). The system provides a Next.js dashboard, a Node-based orchestrator that coordinates role prompts, and a TeX builder container that compiles the updated PDF. Everything runs locally via Docker Compose.

## Highlights
- Role pipeline: Reviewer ? SWOT ? Refiner ? Judge ? Finalizer (JSON contracts enforced by Zod).
- Provider adapters for Groq, Claude, and Gemini with retry/backoff logic.
- Safe LaTeX edits scoped to `resume/includes/*`; inserts are tagged with `% [agent:finalizer]`.
- Automatic build via `latexmk`; failed builds revert the last patch and surface the error log.
- Artifacts persisted to `data/runs/<run_id>/` for full traceability.

## Prerequisites
- Docker + Docker Compose
- API keys for any providers you plan to use (place them in `.env` � never commit real keys).

## Quick Start
1. Copy the example environment file and add your keys:
   ```bash
   cp .env.example .env
   # edit .env to add GROQ_API_KEY / ANTHROPIC_API_KEY / GOOGLE_API_KEY
   ```
2. Build and launch all services:
   ```bash
   docker compose up --build
   ```
3. Open the dashboard at [http://localhost:3000](http://localhost:3000).
4. Paste a JD, choose providers per role, optionally enable **Dry Run**, then run the pipeline.
5. Inspect live role JSON, diff previews, and the compiled PDF at `/runs/<id>`.

## Services
| Service      | Description                                         | Defaults |
|--------------|-----------------------------------------------------|----------|
| `dashboard`  | Next.js 14 UI (SWR polling, diff/PDF viewers)       | Port 3000 |
| `orchestrator` | Express API (`POST /runs`, `GET /runs`) backed by `agents/router.ts` | Port 4000 |
| `texlive`    | Express microservice that runs `latexmk` on `POST /build` | Port 5001 |

Shared volumes (`resume/`, `data/`, `scripts/`, `agents/`) keep source, artifacts, and build logs visible from every container.

## Key Directories
- `agents/` � Zod schemas, role prompts, provider adapters, router pipeline.
- `dashboard/` � Next.js App Router front-end.
- `orchestrator/` � TypeScript API server using the agents module.
- `texlive/` � TeX builder service (Node + latexmk).
- `resume/` � LaTeX sources (`cv.tex`, `includes/`, fonts, class files).
- `scripts/build-resume.sh` � Talks to `texlive` service and stages the final PDF.
- `data/runs/` � Pipeline outputs (JSON artifacts, logs, PDFs).
- `tests/acceptance.md` � High-level checks to confirm end-to-end behaviour.

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | API key for Groq models |
| `ANTHROPIC_API_KEY` | API key for Claude |
| `GOOGLE_API_KEY` | API key for Gemini |
| `NEXT_PUBLIC_ORCHESTRATOR_URL` | Dashboard ? Orchestrator base URL |
| `TEXLIVE_URL` | Orchestrator ? TeX builder endpoint (defaults to internal Docker URL) |

## API Endpoints (Orchestrator)
- `POST /runs` � body `{ jobDescription, dryRun, providers }`; returns `{ runId }`.
- `GET /runs` � list all runs (latest first).
- `GET /runs/:id` � detailed summary including role artifacts, diff preview, build information.

## ChatGPT / MCP Bridge
- Install dependencies once: `cd orchestrator && npm install`.
- Launch the MCP bridge when you want a model to drive runs: `npm run mcp` (this uses stdio transport, so wire it into your MCP client).
- Exposed tools: `list-runs` (optional `status`, `limit` filters), `get-run` (`runId`), `create-run` (same payload as `POST /runs`).
- Example ChatGPT MCP config snippet:
  ```json
  {
    "servers": [
      {
        "name": "resume-orchestrator",
        "command": ["npm", "run", "mcp"],
        "cwd": "<repo-path>/orchestrator"
      }
    ]
  }
  ```
- The MCP server reads the same `.env` as the orchestrator; export the provider API keys before launching ChatGPT/Claude.

## LaTeX Editing Notes
- Main entry point: `resume/cv.tex`; modular sections live in `resume/includes/` with `% SECTION:...` anchors for safe patching.
- Finalizer inserts always prepend `% [agent:finalizer]` for auditability.
- Manual builds (outside Docker) can still run `scripts/build-resume.sh <run_id>` provided `latexmk` is available.

## Acceptance Criteria
Track end-to-end validation with `tests/acceptance.md`:
- Dashboard reachable on port 3000
- JD run generates per-role JSON artifacts
- Judge enforces revision gate
- Finalizer applies minimal, compilable diffs and produces a PDF
- Dry runs surface diffs without mutating files or compiling

## Legacy Preview Script
The previous `preview_resume.py` live-reload utility is still available for manual TeX work, but the orchestrated workflow above supersedes it for JD-driven updates.

## Portability & Multi-Architecture (Cloud / Raspberry Pi / ARM64)

All containers now build without architecture assumptions and can be published as multi-arch images (e.g. `linux/amd64`, `linux/arm64` for Raspberry Pi 4/5, AWS Graviton, Apple Silicon).

### Build Locally (Native Architecture)
```bash
docker compose up --build
```

### Multi-Arch Build (Requires Docker Buildx)
Create a builder (one time):
```bash
docker buildx create --name multi --use --bootstrap
```
Build & push (example image names - adjust registry/user):
```bash
export IMG_ROOT="your-docker-user/ai-resume"  # or GHCR: ghcr.io/your-org/ai-resume
docker buildx bake \
   --set *.platform=linux/amd64,linux/arm64 \
   --push
```
If not using a `docker-bake.hcl`, you can build each service manually:
```bash
docker buildx build -t "$IMG_ROOT-dashboard:latest" --platform linux/amd64,linux/arm64 dashboard/ --push
docker buildx build -t "$IMG_ROOT-orchestrator:latest" --platform linux/amd64,linux/arm64 -f orchestrator/Dockerfile . --push
docker buildx build -t "$IMG_ROOT-texlive:latest" --platform linux/amd64,linux/arm64 texlive/ --push
```

### Run on Raspberry Pi (ARM64)
```bash
docker compose pull  # if using pushed multi-arch images
docker compose up -d
```
No changes are required; the correct image variant is selected automatically.

### Development Volumes vs Production
The compose file mounts source directories for live editing (`agents/`, `resume/`, etc.). For production builds (immutable containers), remove or comment out those volume mounts to ensure the container uses the baked-in code:
```yaml
   orchestrator:
      volumes: []  # or remove entirely
   texlive:
      volumes: []
```

### Minimizing Image Size (Optional Roadmap)
- Switch TeX toolchain to a minimal subset or TinyTeX for smaller `texlive` image.
- Multi-stage TeX build: compile fonts & cache format files in a builder stage, copy only runtime artifacts.
- Use `npm ci --omit=dev` in orchestrator/dashboard runner stages (already applied in texlive) after a dedicated build stage.

### Health Checks (Suggested)
You may add healthchecks for production readiness:
```yaml
   orchestrator:
      healthcheck:
         test: ["CMD", "node", "-e", "fetch('http://localhost:4000/runs').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
         interval: 30s
         timeout: 5s
         retries: 3
```

### Environment File Support
To avoid leaking secrets in compose, create `.env` and reference variables (compose automatically loads it). See `.env.example`.

### Troubleshooting Cross-Arch Builds
| Symptom | Cause | Fix |
|---------|-------|-----|
| `exec format error` | Ran amd64 image on arm64 host | Build/pull multi-arch or specify `--platform` during build |
| Slow TeX package install | Apt cache on first build | Consider remote cache or pre-built base image |
| High memory during TeX compile | Large LaTeX class/fonts | Use `latexmk -silent` and keep sections lean |

---
For further hardening (CI pipelines, SBOM generation, provenance attestations), a `docker-bake.hcl` and GitHub Actions workflow can be added later.
