#!/usr/bin/env python3
"""
AI Resume Orchestrator - FastMCP Server
Multi-agent resume optimization system with Reviewer, SWOT, Refiner, Judge, and Finalizer agents.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any
import subprocess

from fastmcp import FastMCP

# Add the parent directory to the path to import our agents
sys.path.append(str(Path(__file__).parent.parent))

# Import our existing router and schemas
try:
    from agents.router import ResumeRunRouter
    from agents.schemas import runConfigSchema
except ImportError as e:
    print(f"Warning: Could not import agents: {e}")
    print("Make sure to run: cd orchestrator && npm install")
    ResumeRunRouter = None
    runConfigSchema = None

# Initialize FastMCP server
mcp = FastMCP("AI Resume Orchestrator")

# Global router instance
router = None

async def initialize_router():
    """Initialize the ResumeRunRouter"""
    global router
    if ResumeRunRouter and not router:
        try:
            router = ResumeRunRouter()
            print("✅ ResumeRunRouter initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize ResumeRunRouter: {e}")
            router = None

@mcp.tool
async def list_runs(status: Optional[str] = None, limit: Optional[int] = None) -> Dict[str, Any]:
    """
    List stored resume automation runs. Optionally filter by status or limit the number returned.
    
    Args:
        status: Filter runs by status (pending, running, needs_review, failed, completed)
        limit: Limit the number of runs returned (1-100)
    
    Returns:
        Dictionary containing the list of runs
    """
    await initialize_router()
    
    if not router:
        return {"error": "ResumeRunRouter not available. Please check the setup."}
    
    try:
        runs = await router.listRuns()
        
        # Apply filters
        if status:
            runs = [run for run in runs if run.get('status') == status]
        
        if limit:
            runs = runs[:limit]
        
        return {
            "runs": runs,
            "count": len(runs),
            "message": f"Found {len(runs)} resume runs"
        }
    except Exception as e:
        return {"error": f"Failed to list runs: {str(e)}"}

@mcp.tool
async def get_run(run_id: str) -> Dict[str, Any]:
    """
    Retrieve a specific run summary by its identifier.
    
    Args:
        run_id: The unique identifier of the run
    
    Returns:
        Dictionary containing the run details
    """
    await initialize_router()
    
    if not router:
        return {"error": "ResumeRunRouter not available. Please check the setup."}
    
    try:
        run = await router.getRun(run_id)
        return {
            "run": run,
            "message": f"Retrieved run {run_id}"
        }
    except Exception as e:
        return {"error": f"Failed to get run {run_id}: {str(e)}"}

@mcp.tool
async def create_run(
    job_description: str,
    dry_run: bool = False,
    providers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Kick off a new resume automation run using the supplied configuration.
    
    Args:
        job_description: The job description to optimize the resume for
        dry_run: Whether to run in dry-run mode (no actual changes)
        providers: Dictionary mapping roles to LLM providers (groq, claude, gemini)
    
    Returns:
        Dictionary containing the run ID and summary
    """
    await initialize_router()
    
    if not router:
        return {"error": "ResumeRunRouter not available. Please check the setup."}
    
    # Default providers if not provided
    if not providers:
        providers = {
            "reviewer": "claude",
            "swot": "claude", 
            "refiner": "claude",
            "judge": "claude",
            "finalizer": "claude"
        }
    
    try:
        config = {
            "jobDescription": job_description,
            "dryRun": dry_run,
            "providers": providers
        }
        
        summary = await router.createRun(config)
        
        return {
            "run_id": summary.id,
            "summary": summary,
            "message": f"Created new resume run: {summary.id}",
            "status": "success"
        }
    except Exception as e:
        return {"error": f"Failed to create run: {str(e)}"}

@mcp.tool
async def get_resume_info() -> Dict[str, Any]:
    """
    Get information about the current resume structure and available sections.
    
    Returns:
        Dictionary containing resume information
    """
    try:
        resume_path = Path(__file__).parent.parent / "resume"
        
        if not resume_path.exists():
            return {"error": "Resume directory not found"}
        
        # Get main resume file
        main_file = resume_path / "cv.tex"
        if main_file.exists():
            with open(main_file, 'r', encoding='utf-8') as f:
                main_content = f.read()
        else:
            main_content = None
        
        # Get includes directory
        includes_path = resume_path / "includes"
        sections = {}
        if includes_path.exists():
            for section_file in includes_path.glob("*.tex"):
                with open(section_file, 'r', encoding='utf-8') as f:
                    sections[section_file.name] = f.read()
        
        return {
            "resume_path": str(resume_path),
            "main_file": str(main_file) if main_file.exists() else None,
            "sections": list(sections.keys()),
            "sections_content": sections,
            "main_content": main_content,
            "message": "Resume information retrieved successfully"
        }
    except Exception as e:
        return {"error": f"Failed to get resume info: {str(e)}"}

@mcp.tool
async def check_health() -> Dict[str, Any]:
    """
    Check the health status of the AI Resume Orchestrator system.
    
    Returns:
        Dictionary containing health status information
    """
    health_status = {
        "status": "healthy",
        "components": {},
        "timestamp": asyncio.get_event_loop().time()
    }
    
    # Check if router is available
    await initialize_router()
    health_status["components"]["router"] = "available" if router else "unavailable"
    
    # Check resume directory
    resume_path = Path(__file__).parent.parent / "resume"
    health_status["components"]["resume_directory"] = "available" if resume_path.exists() else "unavailable"
    
    # Check includes directory
    includes_path = resume_path / "includes"
    health_status["components"]["includes_directory"] = "available" if includes_path.exists() else "unavailable"
    
    # Check if any components are unavailable
    if any(status == "unavailable" for status in health_status["components"].values()):
        health_status["status"] = "degraded"
    
    return health_status

@mcp.tool
async def get_available_providers() -> Dict[str, Any]:
    """
    Get information about available LLM providers and their configuration.
    
    Returns:
        Dictionary containing provider information
    """
    providers = {
        "groq": {
            "name": "Groq",
            "description": "Fast inference with Groq API",
            "required_env": "GROQ_API_KEY",
            "available": bool(os.getenv("GROQ_API_KEY"))
        },
        "claude": {
            "name": "Anthropic Claude",
            "description": "High-quality reasoning with Claude API",
            "required_env": "ANTHROPIC_API_KEY", 
            "available": bool(os.getenv("ANTHROPIC_API_KEY"))
        },
        "gemini": {
            "name": "Google Gemini",
            "description": "Multimodal capabilities with Gemini API",
            "required_env": "GOOGLE_API_KEY",
            "available": bool(os.getenv("GOOGLE_API_KEY"))
        }
    }
    
    available_count = sum(1 for p in providers.values() if p["available"])
    
    return {
        "providers": providers,
        "available_count": available_count,
        "total_count": len(providers),
        "message": f"{available_count}/{len(providers)} providers are configured and available"
    }

if __name__ == "__main__":
    print("🚀 Starting AI Resume Orchestrator MCP Server...")
    print("📊 Available tools:")
    print("  - list_runs: List all resume optimization runs")
    print("  - get_run: Get detailed run information")
    print("  - create_run: Start new optimization pipeline")
    print("  - get_resume_info: Get current resume structure")
    print("  - check_health: Check system health")
    print("  - get_available_providers: List configured LLM providers")
    print()
    
    # Run the MCP server
    mcp.run()
