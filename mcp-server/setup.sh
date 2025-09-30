#!/bin/bash

# FastMCP Setup Script for AI Resume Orchestrator

echo "🚀 Setting up FastMCP for AI Resume Orchestrator..."

# Check if Python 3.10+ is available
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.10"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.10+ is required. Found: $python_version"
    echo "Please install Python 3.10 or later"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing FastMCP and dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Make scripts executable
echo "🔐 Making scripts executable..."
chmod +x server.py
chmod +x server-direct.py

echo "✅ FastMCP setup complete!"
echo ""
echo "🚀 To start the MCP server:"
echo "  source venv/bin/activate"
echo "  python server-direct.py"
echo ""
echo "🔧 For development with Node.js integration:"
echo "  source venv/bin/activate"
echo "  python server.py"
echo ""
echo "📊 Available transports:"
echo "  - STDIO (default): python server-direct.py"
echo "  - HTTP: python server-direct.py --transport http --port 8000"
echo "  - SSE: python server-direct.py --transport sse --port 8000"
