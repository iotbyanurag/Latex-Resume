# Railway-optimized Dockerfile for AI Resume Orchestrator
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    texlive-full \
    python3 \
    py3-pip \
    curl \
    bash

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY dashboard/package*.json ./dashboard/
COPY orchestrator/package*.json ./orchestrator/
COPY texlive/package*.json ./texlive/

# Install dependencies
RUN cd dashboard && npm install
RUN cd orchestrator && npm install
RUN cd texlive && npm install

# Copy source code
COPY . .

# Build applications
RUN cd dashboard && npm run build
RUN cd orchestrator && npm run build

# Create data directory
RUN mkdir -p data/runs

# Set permissions
RUN chmod +x scripts/build-resume.sh

# Create startup script
RUN cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting AI Resume Orchestrator..."

# Start TeXLive service in background
echo "📄 Starting TeXLive service..."
cd /app/texlive && npm start &
TEXLIVE_PID=$!

# Wait for TeXLive to start
sleep 10

# Start Orchestrator service in background
echo "⚙️ Starting Orchestrator service..."
cd /app/orchestrator && npm start &
ORCHESTRATOR_PID=$!

# Wait for Orchestrator to start
sleep 10

# Start Dashboard (main service)
echo "🎨 Starting Dashboard service..."
cd /app/dashboard && npm start

# Cleanup function
cleanup() {
    echo "🛑 Shutting down services..."
    kill $TEXLIVE_PID $ORCHESTRATOR_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for any process to exit
wait
EOF

RUN chmod +x start.sh

# Expose port (Railway uses PORT environment variable)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV TEXLIVE_URL=http://localhost:5001/build
ENV NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start all services
CMD ["./start.sh"]
