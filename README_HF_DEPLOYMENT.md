# 🚀 Hugging Face Spaces Deployment Guide

This guide explains how to deploy the AI Resume Orchestrator to Hugging Face Spaces instead of OCI.

## 🤔 Can Hugging Face Handle This Project?

**Answer: Partially, with architectural changes required.**

### What Hugging Face CAN Handle:
- ✅ Single container applications via Hugging Face Spaces
- ✅ Machine learning models and AI applications  
- ✅ Web applications with Gradio/Streamlit interfaces
- ✅ Node.js and Python applications

### What Hugging Face CANNOT Handle:
- ❌ Multi-container Docker Compose setups (current architecture)
- ❌ Complex microservices with multiple interdependent services
- ❌ Custom LaTeX compilation (TeXLive service)
- ❌ File system volumes and persistent storage
- ❌ Custom networking between services

## 🏗️ Architecture Changes Required

Your current project has **3 separate services**:
1. **Dashboard** (Next.js frontend) - Port 3000
2. **Orchestrator** (Node.js API + MCP server) - Port 4000  
3. **TeXLive** (LaTeX PDF builder) - Port 5001

**Solution:** Convert to a **monolithic container** that runs all services internally.

## 📁 Files Created for Hugging Face Deployment

### 1. `hf-dockerfile`
- Monolithic Docker container running all 3 services
- Optimized for Hugging Face Spaces
- Uses port 7860 (Hugging Face standard)
- Includes health checks and proper signal handling

### 2. `hf-app.py`
- Gradio interface for Hugging Face Spaces
- Replaces the Next.js dashboard
- Communicates with internal services
- User-friendly web interface

### 3. `requirements.txt`
- Python dependencies for the Gradio app
- Minimal requirements for Hugging Face Spaces

## 🚀 Deployment Steps

### Step 1: Create Hugging Face Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Fill in the details:
   - **Space name:** `ai-resume-orchestrator`
   - **License:** MIT
   - **SDK:** Docker
   - **Hardware:** CPU basic (or GPU if needed)

### Step 2: Upload Files

Upload these files to your Space:
- `hf-dockerfile` (rename to `Dockerfile`)
- `hf-app.py` (rename to `app.py`)
- `requirements.txt`
- All your existing project files (agents/, resume/, etc.)

### Step 3: Configure Environment Variables

In your Space settings, add these environment variables:
```
GROQ_API_KEY=your_groq_api_key
ANTHROPIC_API_KEY=your_claude_api_key
GOOGLE_API_KEY=your_gemini_api_key
NODE_ENV=production
```

### Step 4: Deploy

1. Push your changes to the Space
2. Hugging Face will automatically build and deploy
3. Wait for the build to complete (5-10 minutes)
4. Access your app at the provided URL

## 🔧 Alternative: Hybrid Deployment

If you want to keep the microservices architecture:

### Option A: Hugging Face + External Services
- Deploy **dashboard only** on Hugging Face Spaces
- Host **orchestrator** and **texlive** on external services (Railway, Render, etc.)
- Update API endpoints to point to external services

### Option B: Hugging Face + Cloud Functions
- Deploy **dashboard** on Hugging Face Spaces
- Use **AWS Lambda** or **Vercel Functions** for orchestrator
- Use **external LaTeX service** for PDF generation

## 📊 Comparison: OCI vs Hugging Face

| Feature | OCI | Hugging Face Spaces |
|---------|-----|-------------------|
| **Multi-container** | ✅ Full support | ❌ Not supported |
| **Custom networking** | ✅ Full control | ❌ Limited |
| **File system** | ✅ Persistent volumes | ❌ Ephemeral only |
| **LaTeX compilation** | ✅ Full TeXLive | ❌ Limited support |
| **Cost** | 💰 Pay per use | 💰 Free tier available |
| **Ease of deployment** | 🔧 Complex setup | ✅ Simple |
| **Scalability** | 🚀 Auto-scaling | 🔧 Limited |
| **Custom domains** | ✅ Full control | ❌ Hugging Face subdomain |

## 🎯 Recommended Approach

### For Development/Demo:
**Use Hugging Face Spaces** with the monolithic approach:
- ✅ Quick deployment
- ✅ Free tier available
- ✅ Easy to share and demo
- ✅ Good for showcasing AI capabilities

### For Production:
**Stick with OCI** or use **hybrid approach**:
- ✅ Better scalability
- ✅ Full control over infrastructure
- ✅ Better performance
- ✅ More reliable for production workloads

## 🔍 Limitations of Hugging Face Deployment

1. **No persistent storage** - All data is lost on restart
2. **Limited resources** - CPU/memory constraints
3. **No custom networking** - Services must run in same container
4. **LaTeX limitations** - May not support full TeXLive features
5. **Cold starts** - Services may take time to start
6. **No custom domains** - Must use Hugging Face subdomain

## 🚀 Quick Start Commands

```bash
# Test locally with Docker
docker build -f hf-dockerfile -t resume-orchestrator-hf .
docker run -p 7860:7860 -e GROQ_API_KEY=your_key resume-orchestrator-hf

# Deploy to Hugging Face (after creating Space)
git clone https://huggingface.co/spaces/your-username/ai-resume-orchestrator
cd ai-resume-orchestrator
# Copy files and push
git add .
git commit -m "Deploy AI Resume Orchestrator"
git push
```

## 🎉 Conclusion

Hugging Face Spaces can run your project, but requires significant architectural changes. The monolithic approach works well for demos and development, but for production use, OCI or a hybrid approach would be more suitable.

Choose based on your needs:
- **Demo/Development:** Hugging Face Spaces
- **Production:** OCI or hybrid deployment
