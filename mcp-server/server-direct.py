#!/usr/bin/env python3
"""
AI Resume Orchestrator - FastMCP Server (Direct Integration)
This version directly implements the MCP tools without Node.js dependency
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime

from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("AI Resume Orchestrator")

# Global state for runs (in production, use a database)
runs_storage = []

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
    try:
        runs = runs_storage.copy()
        
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
    try:
        run = next((r for r in runs_storage if r.get('id') == run_id), None)
        
        if not run:
            return {"error": f"Run {run_id} not found"}
        
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
    try:
        # Default providers if not provided
        if not providers:
            providers = {
                "reviewer": "claude",
                "swot": "claude", 
                "refiner": "claude",
                "judge": "claude",
                "finalizer": "claude"
            }
        
        # Create new run
        run_id = str(uuid.uuid4())
        run = {
            "id": run_id,
            "status": "pending",
            "jobDescription": job_description,
            "dryRun": dry_run,
            "providers": providers,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "artifacts": [],
            "message": "Run created successfully. In a full implementation, this would trigger the multi-agent pipeline."
        }
        
        # Add to storage
        runs_storage.append(run)
        
        return {
            "run_id": run_id,
            "summary": run,
            "message": f"Created new resume run: {run_id}",
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

@mcp.tool
async def simulate_resume_optimization(
    job_description: str,
    dry_run: bool = True
) -> Dict[str, Any]:
    """
    Simulate the multi-agent resume optimization process.
    
    Args:
        job_description: The job description to optimize for
        dry_run: Whether to run in simulation mode
    
    Returns:
        Dictionary containing the simulation results
    """
    try:
        # Simulate the multi-agent pipeline
        steps = [
            {"agent": "Reviewer", "action": "Analyzing resume against job description", "status": "completed"},
            {"agent": "SWOT", "action": "Performing SWOT analysis", "status": "completed"},
            {"agent": "Refiner", "action": "Generating optimization suggestions", "status": "completed"},
            {"agent": "Judge", "action": "Evaluating suggestions quality", "status": "completed"},
            {"agent": "Finalizer", "action": "Applying final changes", "status": "completed"}
        ]
        
        # Simulate processing time
        await asyncio.sleep(1)
        
        return {
            "simulation": True,
            "dry_run": dry_run,
            "job_description": job_description,
            "steps": steps,
            "result": "Resume optimization simulation completed successfully",
            "message": "This is a simulation. In production, this would call the actual multi-agent pipeline."
        }
    except Exception as e:
        return {"error": f"Simulation failed: {str(e)}"}

if __name__ == "__main__":
    print("🚀 Starting AI Resume Orchestrator FastMCP Server...")
    print("📊 Available tools:")
    print("  - list_runs: List all resume optimization runs")
    print("  - get_run: Get detailed run information")
    print("  - create_run: Start new optimization pipeline")
    print("  - get_resume_info: Get current resume structure")
    print("  - check_health: Check system health")
    print("  - get_available_providers: List configured LLM providers")
    print("  - simulate_resume_optimization: Simulate the optimization process")
    print()
    
    # Run the MCP server
    mcp.run()
