#!/usr/bin/env python3
"""
Bridge between FastMCP and Node.js orchestrator
This allows FastMCP to call the existing Node.js router functions
"""

import asyncio
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, Any, Optional

class NodeJSRouter:
    """Bridge to call Node.js router functions from Python"""
    
    def __init__(self, orchestrator_path: str):
        self.orchestrator_path = Path(orchestrator_path)
        self.node_script = self.orchestrator_path / "src" / "router-bridge.js"
        
    async def list_runs(self) -> List[Dict[str, Any]]:
        """Call the Node.js listRuns function"""
        try:
            result = await self._call_node_function("listRuns", {})
            return result.get("runs", [])
        except Exception as e:
            print(f"Error calling listRuns: {e}")
            return []
    
    async def get_run(self, run_id: str) -> Dict[str, Any]:
        """Call the Node.js getRun function"""
        try:
            result = await self._call_node_function("getRun", {"runId": run_id})
            return result.get("run", {})
        except Exception as e:
            print(f"Error calling getRun: {e}")
            return {}
    
    async def create_run(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Call the Node.js createRun function"""
        try:
            result = await self._call_node_function("createRun", config)
            return result.get("summary", {})
        except Exception as e:
            print(f"Error calling createRun: {e}")
            return {}
    
    async def _call_node_function(self, function_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Call a Node.js function via subprocess"""
        # Create a temporary script to call the function
        script_content = f"""
const {{ ResumeRunRouter }} = require('./agents/index.js');

async function callFunction() {{
    const router = new ResumeRunRouter();
    const result = await router.{function_name}({json.dumps(args)});
    console.log(JSON.stringify({{ result }}));
}}

callFunction().catch(console.error);
"""
        
        script_path = self.orchestrator_path / "temp_call.js"
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        try:
            # Run the Node.js script
            process = await asyncio.create_subprocess_exec(
                'node', str(script_path),
                cwd=str(self.orchestrator_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"Node.js error: {stderr.decode()}")
            
            result = json.loads(stdout.decode())
            return result.get("result", {})
            
        finally:
            # Clean up temporary script
            if script_path.exists():
                script_path.unlink()

# Global router instance
router = None

async def initialize_router():
    """Initialize the Node.js router bridge"""
    global router
    if not router:
        orchestrator_path = Path(__file__).parent.parent / "orchestrator"
        router = NodeJSRouter(str(orchestrator_path))
        print("✅ Node.js Router bridge initialized")

# Export for use in server.py
__all__ = ['NodeJSRouter', 'initialize_router']
