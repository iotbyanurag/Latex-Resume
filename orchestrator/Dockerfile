FROM node:20-slim AS base
ARG TARGETPLATFORM
LABEL org.opencontainers.image.source="https://github.com/iotbyanurag/Latex-Resume" \
      org.opencontainers.image.description="Resume orchestrator service (platform=${TARGETPLATFORM})"

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl bash \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/orchestrator

# Install only dependencies first for better layer caching
COPY orchestrator/package.json orchestrator/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --include=dev; fi
RUN ln -s /workspace/orchestrator/node_modules /workspace/node_modules

# Copy source (agents, scripts, resume) relative to workspace root
WORKDIR /workspace
COPY agents ./agents
COPY scripts ./scripts
COPY resume ./resume
COPY orchestrator/tsconfig.json orchestrator/tsconfig.json
COPY orchestrator/src orchestrator/src

RUN chmod +x /workspace/scripts/build-resume.sh

WORKDIR /workspace/orchestrator

EXPOSE 4000

# Run with tsx (on-the-fly TS execution). Precompilation removed for simplicity/portability.
CMD ["npm", "start"]


