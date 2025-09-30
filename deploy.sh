#!/bin/bash

# AI Resume Orchestrator - OCI Deployment Script
set -e

echo "🚀 Starting AI Resume Orchestrator deployment on OCI..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Use a regular user with sudo access."
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with your API keys."
    echo "Copy .env.example to .env and add your API keys:"
    echo "cp .env.example .env"
    echo "nano .env"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/runs
mkdir -p ssl
mkdir -p logs

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 data
chmod 755 data/runs
chmod 755 logs

# Build and start services
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Test endpoints
echo "🧪 Testing endpoints..."
if curl -f http://localhost:4000/runs > /dev/null 2>&1; then
    echo "✅ Orchestrator API is running"
else
    echo "❌ Orchestrator API is not responding"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dashboard is running"
else
    echo "❌ Dashboard is not responding"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 Service URLs:"
echo "  Dashboard: http://$(curl -s ifconfig.me):80"
echo "  API: http://$(curl -s ifconfig.me):4000"
echo "  TeX Builder: http://$(curl -s ifconfig.me):5001"
echo ""
echo "📝 Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  Update services: docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "🔧 MCP Server (for ChatGPT/Claude):"
echo "  cd orchestrator && npm install && npm run mcp"
echo ""
