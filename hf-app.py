# Hugging Face Spaces App - Resume Orchestrator
import gradio as gr
import requests
import json
import os
from typing import Dict, Any

# Configuration
ORCHESTRATOR_URL = "http://localhost:4000"
DASHBOARD_URL = "http://localhost:7860"

class ResumeOrchestrator:
    def __init__(self):
        self.orchestrator_url = ORCHESTRATOR_URL
        
    def create_run(self, job_description: str, dry_run: bool = True) -> Dict[str, Any]:
        """Create a new resume optimization run"""
        try:
            payload = {
                "jobDescription": job_description,
                "dryRun": dry_run,
                "providers": {
                    "reviewer": "groq",
                    "swot": "claude", 
                    "refiner": "gemini",
                    "judge": "groq",
                    "finalizer": "claude"
                }
            }
            
            response = requests.post(
                f"{self.orchestrator_url}/runs",
                json=payload,
                timeout=300  # 5 minutes timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API Error: {response.status_code} - {response.text}"}
                
        except requests.exceptions.RequestException as e:
            return {"error": f"Connection Error: {str(e)}"}
    
    def get_run_status(self, run_id: str) -> Dict[str, Any]:
        """Get the status of a resume optimization run"""
        try:
            response = requests.get(f"{self.orchestrator_url}/runs/{run_id}")
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"API Error: {response.status_code} - {response.text}"}
                
        except requests.exceptions.RequestException as e:
            return {"error": f"Connection Error: {str(e)}"}
    
    def download_pdf(self, run_id: str) -> str:
        """Get download link for generated PDF"""
        try:
            response = requests.get(f"{self.orchestrator_url}/runs/{run_id}/pdf")
            
            if response.status_code == 200:
                return response.json().get("downloadUrl", "PDF not available")
            else:
                return f"Error: {response.status_code}"
                
        except requests.exceptions.RequestException as e:
            return f"Connection Error: {str(e)}"

# Initialize the orchestrator
orchestrator = ResumeOrchestrator()

def process_resume(job_description: str, dry_run: bool) -> str:
    """Process resume optimization request"""
    if not job_description.strip():
        return "Please enter a job description."
    
    # Create run
    result = orchestrator.create_run(job_description, dry_run)
    
    if "error" in result:
        return f"❌ Error: {result['error']}"
    
    run_id = result.get("id", "unknown")
    
    # Get run status
    status = orchestrator.get_run_status(run_id)
    
    if "error" in status:
        return f"❌ Status Error: {status['error']}"
    
    # Format response
    response = f"""
## 🎯 Resume Optimization Complete!

**Run ID:** {run_id}
**Status:** {status.get('status', 'unknown')}
**Dry Run:** {'Yes' if dry_run else 'No'}

### 📊 Results:
"""
    
    if status.get('results'):
        results = status['results']
        
        # Reviewer results
        if 'reviewer' in results:
            reviewer = results['reviewer']
            response += f"""
**🔍 Review Analysis:**
- Match Score: {reviewer.get('matchScore', 'N/A')}%
- Strengths: {reviewer.get('strengths', 'N/A')}
- Weaknesses: {reviewer.get('weaknesses', 'N/A')}
"""
        
        # SWOT Analysis
        if 'swot' in results:
            swot = results['swot']
            response += f"""
**📈 SWOT Analysis:**
- Strengths: {swot.get('strengths', 'N/A')}
- Weaknesses: {swot.get('weaknesses', 'N/A')}
- Opportunities: {swot.get('opportunities', 'N/A')}
- Threats: {swot.get('threats', 'N/A')}
"""
        
        # Refinements
        if 'refinements' in results:
            refinements = results['refinements']
            response += f"""
**✨ Proposed Refinements:**
{refinements.get('summary', 'No refinements suggested')}
"""
    
    # Add PDF download link if available
    if not dry_run:
        pdf_url = orchestrator.download_pdf(run_id)
        if pdf_url and not pdf_url.startswith("Error"):
            response += f"""
**📄 Download PDF:** {pdf_url}
"""
    
    return response

# Create Gradio interface
def create_interface():
    with gr.Blocks(
        title="🤖 AI Resume Orchestrator",
        theme=gr.themes.Soft(),
        css="""
        .gradio-container {
            max-width: 1200px !important;
        }
        .main-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        """
    ) as interface:
        
        gr.HTML("""
        <div class="main-header">
            <h1>🤖 AI Resume Orchestrator</h1>
            <p>State-of-the-art multi-agent system for intelligent resume optimization</p>
        </div>
        """)
        
        with gr.Row():
            with gr.Column(scale=2):
                job_description = gr.Textbox(
                    label="📝 Job Description",
                    placeholder="Paste the job description you want to optimize your resume for...",
                    lines=10,
                    max_lines=20
                )
                
                dry_run = gr.Checkbox(
                    label="🧪 Dry Run (Preview only, no PDF generation)",
                    value=True,
                    info="Enable to test the optimization without generating a final PDF"
                )
                
                submit_btn = gr.Button(
                    "🚀 Run Pipeline",
                    variant="primary",
                    size="lg"
                )
            
            with gr.Column(scale=3):
                output = gr.Markdown(
                    label="📊 Results",
                    value="Enter a job description and click 'Run Pipeline' to start the AI optimization process."
                )
        
        # Event handlers
        submit_btn.click(
            fn=process_resume,
            inputs=[job_description, dry_run],
            outputs=output
        )
        
        # Example section
        gr.Examples(
            examples=[
                ["Software Engineer with 3+ years experience in React, Node.js, and TypeScript. Strong background in full-stack development and cloud technologies."],
                ["Data Scientist with expertise in machine learning, Python, and statistical analysis. Experience with TensorFlow and PyTorch."],
                ["Product Manager with 5+ years experience in agile development, user research, and cross-functional team leadership."]
            ],
            inputs=job_description,
            label="💡 Example Job Descriptions"
        )
        
        # Footer
        gr.HTML("""
        <div style="text-align: center; margin-top: 2rem; padding: 1rem; border-top: 1px solid #e0e0e0;">
            <p>Built with ❤️ using state-of-the-art AI agentic patterns</p>
            <p><small>Powered by multi-agent orchestration with Groq, Claude, and Gemini</small></p>
        </div>
        """)
    
    return interface

# Launch the interface
if __name__ == "__main__":
    interface = create_interface()
    interface.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True
    )
