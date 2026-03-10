# TexSense: Real-time word count for Overleaf

TexSense is a browser extension that counts words in LaTeX as you type.

No more recompiling or downloads. See your writing progress in real time. 

⭐ If TexSense helps with your writing, consider starring the repo!

### Try it on [Chrome](https://chromewebstore.google.com/detail/texsense-real-time-overle/npggjbabdlnmiamalfkbpdjpgbdlhfkj) or [Firefox](https://addons.mozilla.org/en-US/firefox/addon/texsense/) now!


![Floating Word Counter](assets/demo.gif)

## Why I built this

While writing a paper on Overleaf, I realized counting words in LaTeX is surprisingly inconvenient.  
Most workflows require recompiling the document or running `texcount` locally.

TexSense solves this by counting words directly inside the editor and updating the count as you type. So now, you can track your writing in real time.

## TODO
- [ ] Support multi-file word count

## Word Count Rules

The parser counts body words from LaTeX source and excludes non-body content.

Exclusions:

- Comments (`% ...`)
- Everything outside `\begin{document}...\end{document}` (when present)
- Commands with arguments:
  - `\title{...}`
  - `\author{...}`
  - `\date{...}`
  - `\url{...}`
  - `\label{...}`
  - `\bibliography{...}`
  - `\footnote{...}`
  - `\footnotetext{...}`
  - `\section{...}`
  - `\subsection{...}`
  - `\subsubsection{...}`
  - `\caption{...}`
- Single commands:
  - `\maketitle`
  - `\tableofcontents`
- Full environments:
  - `figure`, `figure*`
  - `table`, `table*`
  - `bibliography`, `thebibliography`
  - `equation`, `equation*`
  - `align`, `align*`
  - `math`, `displaymath`
- Math blocks:
  - `$$...$$`
  - `\[...\]`
  - `\(...\)`
  - inline `$...$`
- All `\begin{...}` / `\end{...}` tags themselves
- Remaining LaTeX commands and escaped control sequences

