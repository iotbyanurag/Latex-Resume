# AI Resume Orchestrator - FastMCP Server

This directory contains the FastMCP implementation of the AI Resume Orchestrator MCP server.

## 🚀 **What is FastMCP?**

[FastMCP](https://github.com/jlowin/fastmcp) is a Python framework for building MCP (Model Context Protocol) servers and clients. It provides:

- **Enterprise-grade features**: Authentication, deployment, monitoring
- **Multiple transports**: STDIO, HTTP, SSE
- **Pythonic API**: Easy to use and extend
- **Production ready**: Built for scale and reliability

## 📁 **Files**

- `server-direct.py` - Standalone FastMCP server (recommended)
- `server.py` - FastMCP server with Node.js integration
- `bridge.py` - Python bridge to Node.js router
- `requirements.txt` - Python dependencies
- `setup.sh` - Setup script
- `Dockerfile` - Docker configuration

## 🛠️ **Setup**

### **Option 1: Local Development**

```bash
# Navigate to mcp-server directory
cd mcp-server

# Run setup script
chmod +x setup.sh
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Start the server
python server-direct.py
```

### **Option 2: Docker**

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.fastmcp.yml up --build
```

## 🔌 **MCP Server Details**

### **For ChatGPT/Claude Connector Dialog:**

| Field | Value |
|-------|-------|
| **Name** | `AI Resume Orchestrator` |
| **Description** | `Multi-agent resume optimization system with Reviewer, SWOT, Refiner, Judge, and Finalizer agents` |
| **MCP Server URL** | `http://your-server:8000/mcp` |
| **Authentication** | `No authentication` |

### **Available Tools:**

1. **`list_runs`** - List all resume optimization runs
2. **`get_run <run_id>`** - Get detailed run information
3. **`create_run`** - Start new optimization pipeline
4. **`get_resume_info`** - Get current resume structure
5. **`check_health`** - Check system health
6. **`get_available_providers`** - List configured LLM providers
7. **`simulate_resume_optimization`** - Simulate the optimization process

## 🌐 **Transports**

### **STDIO (Default)**
```bash
python server-direct.py
```
- Best for local development
- Direct process communication
- No network configuration needed

### **HTTP**
```bash
python server-direct.py --transport http --port 8000
```
- Best for web deployments
- RESTful API endpoints
- CORS support included

### **SSE (Server-Sent Events)**
```bash
python server-direct.py --transport sse --port 8000
```
- Real-time communication
- Compatible with existing SSE clients

## 🔧 **Configuration**

### **Environment Variables**
```bash
# LLM Provider API Keys
GROQ_API_KEY=your_groq_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key

# Server Configuration
MCP_PORT=8000
MCP_HOST=0.0.0.0
```

### **Custom Configuration**
```python
from fastmcp import FastMCP

# Create server with custom settings
mcp = FastMCP(
    "My Server",
    version="1.0.0",
    description="Custom MCP server"
)

# Add custom tools
@mcp.tool
def my_tool(param: str) -> str:
    return f"Hello {param}!"

# Run with custom transport
mcp.run(transport="http", host="0.0.0.0", port=8000)
```

## 🚀 **Deployment**

### **Local Development**
```bash
# Start with auto-reload
python server-direct.py --reload
```

### **Production with Docker**
```bash
# Build and run
docker-compose -f docker-compose.fastmcp.yml up -d

# Check logs
docker-compose -f docker-compose.fastmcp.yml logs -f
```

### **OCI Deployment**
```bash
# SSH into your OCI instance
ssh -i "your-key.pem" ubuntu@your-server-ip

# Clone repository
git clone https://github.com/your-username/Latex-Resume.git
cd Latex-Resume

# Create .env file
cp .env.example .env
nano .env  # Add your API keys

# Deploy with FastMCP
docker-compose -f docker-compose.fastmcp.yml up -d
```

## 📊 **Testing**

### **Health Check**
```bash
curl http://localhost:8000/health
```

### **List Tools**
```bash
curl http://localhost:8000/mcp/tools
```

### **Call Tool**
```bash
curl -X POST http://localhost:8000/mcp/tools/list_runs \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "limit": 10}'
```

## 🔒 **Security**

### **Authentication (Optional)**
```python
from fastmcp.server.auth import GoogleProvider

# Add OAuth authentication
auth = GoogleProvider(
    client_id="your-client-id",
    client_secret="your-client-secret"
)

mcp = FastMCP("Protected Server", auth=auth)
```

### **HTTPS (Production)**
```bash
# Use reverse proxy with SSL
# See nginx-fastmcp.conf for configuration
```

## 🎯 **Advantages of FastMCP**

1. **Mature Framework**: 18.4k+ stars, actively maintained
2. **Enterprise Features**: Authentication, monitoring, deployment
3. **Multiple Transports**: STDIO, HTTP, SSE
4. **Python Ecosystem**: Rich libraries and tools
5. **Production Ready**: Built for scale and reliability
6. **Easy Integration**: Simple API, good documentation

## 📚 **Resources**

- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
- [FastMCP Documentation](https://gofastmcp.com)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [ChatGPT MCP Integration](https://docs.anthropic.com/claude/docs/mcp)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

MIT License - See LICENSE file for details
