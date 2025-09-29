#!/usr/bin/env python3
"""Local resume preview server.

Serves an HTML page that embeds the compiled PDF and exposes a button
that re-runs lualatex on demand.
"""

import argparse
import json
import subprocess
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parent
DEFAULT_BUILD_DIR = REPO_ROOT / "awesome-latex-cv"
DEFAULT_MAIN_TEX = "awesome-cv.tex"
PDF_NAME = "awesome-cv.pdf"


def compile_resume(tex_dir: Path, tex_file: str) -> tuple[bool, str]:
    """Run lualatex in the given directory and return (success, log)."""
    cmd = ["lualatex", "-interaction=nonstopmode", "-halt-on-error", tex_file]
    try:
        proc = subprocess.run(
            cmd,
            cwd=tex_dir,
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as exc:
        return False, f"Failed to run {' '.join(cmd)}: {exc}"

    log = proc.stdout + "\n" + proc.stderr
    return proc.returncode == 0, log


class ResumeHandler(BaseHTTPRequestHandler):
    server_version = "ResumePreview/0.1"

    def do_GET(self) -> None:  # noqa: N802 (BaseHTTPRequestHandler signature)
        parsed = urlparse(self.path)
        if parsed.path in ("/", "/index.html"):
            self._send_index()
        elif parsed.path == "/resume.pdf":
            self._send_pdf()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/compile":
            self._handle_compile()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def _send_index(self) -> None:
        html = f"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Resume Preview</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }}
    header {{ padding: 0.8rem 1.2rem; background: #002b36; color: #fdf6e3; display: flex; gap: 0.75rem; align-items: center; }}
    main {{ flex: 1; display: flex; }}
    iframe {{ flex: 1; border: none; }}
    button {{ background: #268bd2; color: white; border: none; padding: 0.45rem 0.9rem; border-radius: 4px; cursor: pointer; font-size: 0.95rem; }}
    button:disabled {{ opacity: 0.6; cursor: progress; }}
    pre {{ margin: 0; padding: 1rem; background: #f7f7f7; border-top: 1px solid #ccc; height: 12rem; overflow: auto; white-space: pre-wrap; }}
    #status {{ margin-left: auto; font-size: 0.9rem; }}
    a.download {{ color: #fdf6e3; text-decoration: underline; }}
  </style>
</head>
<body>
  <header>
    <strong>Resume Preview</strong>
    <button id="compile">Recompile</button>
    <span id="status">Idle</span>
    <a class="download" href="/resume.pdf" download>Download PDF</a>
  </header>
  <main>
    <iframe id="pdf" src="/resume.pdf#toolbar=0" title="Resume PDF"></iframe>
  </main>
  <pre id="log">Click "Recompile" to build the PDF. Latest compiler log will appear here.</pre>
  <script>
    const btn = document.getElementById('compile');
    const statusEl = document.getElementById('status');
    const logEl = document.getElementById('log');
    const pdfFrame = document.getElementById('pdf');

    async function compile() {{
      btn.disabled = true;
      statusEl.textContent = 'Compiling...';
      try {{
        const response = await fetch('/compile', {{ method: 'POST' }});
        const data = await response.json();
        statusEl.textContent = data.success ? 'Compiled successfully' : 'Compilation failed';
        logEl.textContent = data.log;
        if (data.success) {{
          const url = new URL(pdfFrame.src, window.location.origin);
          url.searchParams.set('t', Date.now());
          pdfFrame.src = url.toString();
        }}
      }} catch (err) {{
        statusEl.textContent = 'Error talking to server';
        logEl.textContent = String(err);
      }} finally {{
        btn.disabled = false;
      }}
    }}

    btn.addEventListener('click', compile);
  </script>
</body>
</html>
"""
        data = html.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_pdf(self) -> None:
        pdf_path = self.server.pdf_path
        if not pdf_path.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "PDF not found")
            return
        data = pdf_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _handle_compile(self) -> None:
        success, log = compile_resume(self.server.tex_dir, self.server.tex_file)
        payload = json.dumps({"success": success, "log": log})
        data = payload.encode("utf-8")
        self.send_response(HTTPStatus.OK if success else HTTPStatus.BAD_REQUEST)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args) -> None:  # noqa: A003 - inherited name
        sys.stderr.write(f"[{self.log_date_time_string()}] {self.address_string()} {format % args}\n")


class ResumeServer(ThreadingHTTPServer):
    def __init__(self, server_address, handler_cls, tex_dir: Path, tex_file: str):
        super().__init__(server_address, handler_cls)
        self.tex_dir = tex_dir
        self.tex_file = tex_file
        self.pdf_path = tex_dir / PDF_NAME


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Serve a local resume preview with compile button")
    parser.add_argument("--host", default="127.0.0.1", help="Interface to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on (default: 8000)")
    parser.add_argument("--tex-dir", type=Path, default=DEFAULT_BUILD_DIR, help="Directory containing the LaTeX project")
    parser.add_argument("--main-tex", default=DEFAULT_MAIN_TEX, help="Main .tex file to compile")
    parser.add_argument("--skip-initial", action="store_true", help="Skip the initial compile")
    args = parser.parse_args(argv)

    tex_dir = args.tex_dir.resolve()
    if not tex_dir.exists():
        print(f"LaTeX directory {tex_dir} does not exist", file=sys.stderr)
        return 1

    success = True
    if not args.skip_initial:
        print("Running initial compile...", flush=True)
        success, log = compile_resume(tex_dir, args.main_tex)
        print(log)
        if not success:
            print("Initial compile failed; fix LaTeX errors and try again.", file=sys.stderr)

    server = ResumeServer((args.host, args.port), ResumeHandler, tex_dir, args.main_tex)
    print(f"Serving resume preview at http://{args.host}:{args.port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        server.server_close()
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())



