# LaTeX Resume Project - AI Agent Instructions

This repository contains a professional resume built using the "Awesome CV" LaTeX template with modular architecture.

## Project Architecture

### Core Structure
- **Main file**: `awesome-latex-cv/awesome-cv.tex` - Entry point that defines personal info and includes sections
- **Class file**: `awesome-latex-cv/awesome-source-cv.cls` - Custom LaTeX class defining styling, colors, and commands
- **Modular sections**: `section_*.tex` files for different resume components

### Compilation Requirements
- **Engine**: LuaTeX (specified with `% !TEX TS-program = luatex`)
- **Dependencies**: FontAwesome 4.6.3.2+, TeXLive 2013+, Source Sans Pro fonts
- **Fonts directory**: Contains Source Sans Pro font family and FontAwesome.ttf

## Key Development Patterns

### Personal Information Setup
```tex
\name{FirstName}{LastName}
\tagline{Job Title}
\photo{4.5cm}{filename}  % Image in same directory
\socialinfo{
    \github{username}
    \linkedin{profile}
    \smartphone{phone}
    \email{address}
    \address{location}
}
```

### Section Module Pattern
Each `section_*.tex` file is self-contained and uses specific environments:
- `\begin{skills}` with `\skill{Category}{Description}`
- `\begin{experiences}` with `\experience{EndDate}{Position}{Company}{Location}{StartDate}{Details}`
- `\begin{educations}` with `\education{EndDate}{Degree}{Institution}{StartDate}{Details}`

### Color Customization
Class supports color themes via options: `[green]`, `[red]`, `[indigo]`, `[orange]`, or `[localFont]`

## Build Workflow

### Local Compilation
```bash
cd awesome-latex-cv
lualatex awesome-cv.tex
```

### Overleaf Integration
Project is linked to Overleaf for online editing and compilation. Update link in main README.md when sharing.

## File Organization Guidelines

### Adding New Sections
1. Create `section_newsection.tex` following existing patterns
2. Add `\input{section_newsection}` to `awesome-cv.tex`
3. Use appropriate spacing with `\vspace{1\baselineskip}`

### Image Management
- Profile photos go in `awesome-latex-cv/` directory
- Use consistent naming (e.g., `anurag.png`)
- Standard size: 4.5cm in `\photo{}` command

### Content Updates
- **Skills**: Update `section_skills.tex` using `\skill{}{}` commands
- **Experience**: Modify `section_experience_short.tex` or `section_experiences.tex`
- **Education**: Edit `section_education.tex`
- **Personal info**: Update variables in `awesome-cv.tex` header

## Development Notes

### Font Handling
- Uses `fontspec` package for font loading
- Local fonts in `fonts/` directory
- FontAwesome symbols for social icons (`\faGithub`, `\faLinkedin`, etc.)

### Class Customization
The `.cls` file defines:
- Color schemes and accent colors
- Custom environments (`skills`, `experiences`, `educations`)
- Typography and layout settings
- Icon integration with FontAwesome

### Version Control
- Main resume is `awesome-cv.tex` in `awesome-latex-cv/` subdirectory
- Compiled PDF: `anurag-resume-updated.pdf` in root
- Template source: Based on Christophe Roger (Darwiin) awesome-neue-latex-cv

When making changes, always test compilation locally before committing, as LaTeX errors can be cryptic and environment-dependent.