# LaTeX Resume

This repository contains the LaTeX source code for my professional resume.

## Getting Started

To compile the resume to a PDF, you will need a LaTeX environment set up on your system, or you can use an online LaTeX editor like Overleaf.

## Overleaf

This resume is also available on Overleaf. You can view and compile it using the following link:

[Edit on Overleaf](https://www.overleaf.com/project/6587f19b9efb569d96bfd0be)

Replace `https://www.overleaf.com/latex/templates/template-link` with the actual shared link to your Overleaf project.

## How to Use

1. Clone the repository or download the source code.
2. If using a local LaTeX environment:
   - Navigate to the directory containing the `.tex` file.
   - Run `pdflatex your_resume.tex` to compile the `.tex` file to a PDF.
3. If using Overleaf, simply click on the Overleaf link and start editing.

## Customization

You can customize the resume by editing the `.tex` file in your preferred LaTeX editor. Be sure to update the personal information, education, work experience, and any other relevant sections.

## Contact

If you have any questions or suggestions, feel free to contact me at your-email@example.com.

Thank you for checking out my resume!

## Local Preview Server

You can run a minimal Overleaf-style preview locally:

1. Ensure LuaLaTeX is installed and available as `lualatex`.
2. From the repo root, run `python preview_resume.py` (use `--skip-initial` if you do not want an automatic compile on start).
3. Visit `http://127.0.0.1:8000/` to view the PDF, trigger recompiles, and download the latest build.
4. The "Recompile" button re-runs `lualatex` for `awesome-cv.tex`; the compiler log appears inline to help debug errors.

Use `CTRL+C` in the terminal to stop the server.
