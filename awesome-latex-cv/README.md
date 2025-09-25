# Embedded Systems LaTeX Resume

This directory contains two versions of Anurag Tiwari's LaTeX resume, both optimized for embedded systems, low-level programming, and RAN development roles.

## Files

### Primary Resume (Recommended)
- **`resume.tex`** - Clean, standalone LaTeX file optimized for embedded systems focus
- **`resume.pdf`** - Compiled PDF output
- Fully compatible with pdflatex
- ATS-friendly with dense keyword coverage
- Quantified achievements and metrics throughout

### Classic Template (Advanced)
- **`awesome-cv.tex`** - Based on awesome-cv template with embedded systems modifications
- **`section_*.tex`** - Modular sections (headline, skills, experience, education)
- **`awesome-source-cv.cls`** - Modified class file
- Requires advanced LaTeX setup (may need font packages)

## Key Features

### Content Highlights
- **Summary**: Principle-level embedded engineer with Yocto, Xilinx Zynq, drivers focus
- **Skills**: 6 focused buckets (Low-Level & Drivers, Kernel & BSP/Yocto, Board Bring-Up, RAN & Cloud-Native, Tooling, Languages)
- **Experience**: Quantified achievements at CommScope, Capgemini, BuffaloGrid, Eigen
- **Projects**: 5 selected low-level systems projects
- **ATS Optimization**: Hidden keyword comments for Applicant Tracking Systems

### Technical Achievements Highlighted
- 22% reduction in Yocto image build time
- 30% reduction in bring-up defects  
- 80% regression test coverage improvement
- 0 dropped frames in MIPI camera streaming
- 40% reduction in manual QA effort

## Compilation

### Simple Method (Recommended)
```bash
pdflatex resume.tex
```

### Advanced Template Method
```bash
# May require additional font packages
pdflatex awesome-cv.tex
# or
xelatex awesome-cv.tex
```

## Customization

The `resume.tex` file is self-contained and easy to modify:
- Update contact information in the header
- Modify the Summary section to match your background
- Adjust Skills buckets based on your expertise
- Update Experience with your quantified achievements
- Customize Selected Projects based on your work

## ATS Compatibility

Both versions include:
- Clean, professional formatting
- Keyword-rich content for embedded systems roles
- Quantified metrics and achievements
- Hidden ATS keyword comments
- Standard fonts and formatting

## Dependencies

### For resume.tex
- Standard LaTeX distribution (texlive)
- pdflatex compiler

### For awesome-cv.tex
- Full LaTeX distribution with font packages
- May require fontawesome fonts
- XeLaTeX or LuaLaTeX recommended

## Size

Both versions are optimized for:
- ≤ 2 pages
- A4/Letter paper compatibility
- 0.6 inch margins
- Professional typography and spacing

---

# Original Huajh Awesome Latex CV  

+ This is CV in English.

+ 中文用户可以到 [zh-cn](https://github.com/huajh/awesome-latex-cv/tree/zh-cn) branch， 包括所有所需文件。


+ zh-cn分支仓库比较大，主要是中文字体比较大，国内用户下载速度慢的可以移步到 [zh-cn-nofonts](https://github.com/huajh/awesome-latex-cv/tree/zh-cn-nofonts) branch，该分支不含中文字体，提供国内下载链接。



## Example

An output example can be found [here](https://huajh.github.io/cv/awesome-cv.pdf)

![Example](http://huajh.github.io/img/cv/awesome-cv-1.png)


## clone
Since the Simplified Chinese fonts files in `zh-cn` branch are very large,  if you only need a CV in Enlish, it is better to clone only the master branch. 

The command is 

```
 git clone --branch master --depth 1 --single-branch https://github.com/huajh/awesome-latex-cv.git 
```


## Setup 

This latex CV template uses `luatex` engine and needs [fontawesome Package version 4.6.3.2.](http://www.ctan.org/tex-archive/fonts/fontawesome) or higher version.

TeXLive 2013 or higher version is recommendered.

## About

Huajh awesome Latex CV was originally based on a CV template created by Christophe Roger (Darwiin). This template use `luatex` engine and `Source Sans Pro Font` from Adobe.

More informations about the original Christophe Roger (Darwiin) template can be found here :

   -  [ Github ](https://github.com/darwiin/awesome-neue-latex-cv)
   -  [ Overleaf ](https://www.overleaf.com/latex/templates/awesome-source-cv/wrdjtkkytqcw)   


## The Latex file structure

```matlab
% cls file
awesome-source-cv.cls   

% main file
huajh-awesome-cv.tex

%subsection
  - section_headline.tex
  - section_education.tex
  - section_publications.tex
  - section_skills.tex
  - section_experience_short.tex
  - section_languages.tex
  - section_awards.tex
  - section_interests.tex
```


## License

The LaTeX Project Public License
