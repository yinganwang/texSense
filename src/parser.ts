export interface WordCountBreakdown {
  bodyWords: number;
  rawWords: number;
  removedWords: number;
  plainText: string;
}

const COMMANDS_WITH_ARG = [
  "title",
  "author",
  "date",
  "section",
  "subsection",
  "subsubsection",
  "caption"
];

const SINGLE_COMMANDS = [/\\maketitle\b/g, /\\tableofcontents\b/g];

const ENVIRONMENTS = [
  "figure",
  "figure*",
  "table",
  "table*",
  "bibliography",
  "thebibliography",
  "equation",
  "equation*",
  "align",
  "align*",
  "math",
  "displaymath"
];

const COMMAND_WITH_OPTIONAL_ARG = /\\([a-zA-Z@]+)\*?/g;

function countWords(text: string): number {
  const words = text.match(/\S+/g);
  return words ? words.length : 0;
}

function stripComments(text: string): string {
  return text.replace(/(^|[^\\])%.*$/gm, "$1");
}

function sliceDocumentBody(text: string): string {
  const begin = text.search(/\\begin\{document\}/);
  const end = text.search(/\\end\{document\}/);

  if (begin === -1) {
    return text;
  }

  const bodyStart = begin + "\\begin{document}".length;
  if (end === -1 || end <= bodyStart) {
    return text.slice(bodyStart);
  }

  return text.slice(bodyStart, end);
}

function stripEnvironment(text: string, envName: string): string {
  const escaped = envName.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `\\\\begin\\{${escaped}\\}[\\s\\S]*?\\\\end\\{${escaped}\\}`,
    "g"
  );
  return text.replace(pattern, " ");
}

function stripMathBlocks(text: string): string {
  let output = text;
  output = output.replace(/\$\$[\s\S]*?\$\$/g, " ");
  output = output.replace(/\\\[[\s\S]*?\\\]/g, " ");
  output = output.replace(/\\\([\s\S]*?\\\)/g, " ");
  output = output.replace(/(^|[^\\])\$(?:[^$\\]|\\.)+\$/g, "$1 ");
  return output;
}

function skipBracketContent(source: string, start: number, open: string, close: string): number {
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (char === "\\") {
      i += 1;
      continue;
    }
    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return i + 1;
      }
    }
  }
  return source.length;
}

function stripCommandsWithArgument(source: string, commandNames: string[]): string {
  const nameSet = new Set(commandNames);
  let output = "";
  let cursor = 0;

  while (cursor < source.length) {
    const slash = source.indexOf("\\", cursor);
    if (slash === -1) {
      output += source.slice(cursor);
      break;
    }

    output += source.slice(cursor, slash);

    let nameCursor = slash + 1;
    while (nameCursor < source.length && /[a-zA-Z@]/.test(source[nameCursor])) {
      nameCursor += 1;
    }

    const command = source.slice(slash + 1, nameCursor);
    let nameEnd = nameCursor;
    if (source[nameEnd] === "*") {
      nameEnd += 1;
    }
    if (!command || !nameSet.has(command)) {
      output += source.slice(slash, nameEnd);
      cursor = nameEnd;
      continue;
    }

    let i = nameEnd;
    while (i < source.length && /\s/.test(source[i])) {
      i += 1;
    }

    if (source[i] === "[") {
      i = skipBracketContent(source, i, "[", "]");
      while (i < source.length && /\s/.test(source[i])) {
        i += 1;
      }
    }

    if (source[i] !== "{") {
      output += source.slice(slash, nameEnd);
      cursor = nameEnd;
      continue;
    }

    cursor = skipBracketContent(source, i, "{", "}");
    output += " ";
  }

  return output;
}

function stripLatexCommands(text: string): string {
  let output = text.replace(COMMAND_WITH_OPTIONAL_ARG, " ");
  output = output.replace(/\\./g, " ");
  return output;
}

function normalizeText(text: string): string {
  return text
    .replace(/[{}_^~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countBodyWords(source: string): WordCountBreakdown {
  const noComments = stripComments(source);
  const bodySlice = sliceDocumentBody(noComments);

  const rawWords = countWords(bodySlice);

  let cleaned = bodySlice;
  cleaned = stripCommandsWithArgument(cleaned, COMMANDS_WITH_ARG);

  for (const pattern of SINGLE_COMMANDS) {
    cleaned = cleaned.replace(pattern, " ");
  }

  for (const env of ENVIRONMENTS) {
    cleaned = stripEnvironment(cleaned, env);
  }

  cleaned = stripMathBlocks(cleaned);
  cleaned = stripLatexCommands(cleaned);
  cleaned = normalizeText(cleaned);

  const bodyWords = countWords(cleaned);

  return {
    bodyWords,
    rawWords,
    removedWords: Math.max(0, rawWords - bodyWords),
    plainText: cleaned
  };
}
