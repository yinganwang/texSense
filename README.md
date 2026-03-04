# Overleaf Latex Word Count (Chrome Extension)

A Manifest v3 extension that adds a floating real-time body word-count panel on `overleaf.com`.

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

## Setup

```bash
npm install
npm run build
```

## Development build (watch)

```bash
npm run dev
```

This keeps rebuilding `dist/` when files change.

## Load unpacked extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select this project's `dist/` folder
5. Open [https://www.overleaf.com](https://www.overleaf.com)

## Files

- `manifest.json`: extension manifest (copied to `dist/`)
- `src/contentScript.tsx`: entrypoint, Overleaf integration, update loop
- `src/injected.tsx`: page-context bridge to Overleaf CodeMirror state
- `src/floatingPanel.tsx`: draggable React UI panel
- `src/parser.ts`: LaTeX-to-body-text parser + word counting
- `src/styles.css`: floating panel styles
- `vite.config.ts`: build config
