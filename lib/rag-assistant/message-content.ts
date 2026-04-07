export function normalizeAssistantMessageContent(content: string): string {
  return content
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n(?:[ \t]*\n)+/g, "\n\n")
    .trimEnd();
}

export type AssistantMarkdownBlock =
  | {
      type: "heading";
      level: 1 | 2 | 3 | 4 | 5 | 6;
      text: string;
    }
  | {
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "rule";
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      isPartialLastRow: boolean;
    };

export function parseAssistantMarkdown(content: string): AssistantMarkdownBlock[] {
  const normalized = normalizeAssistantMessageContent(content);

  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const blocks: AssistantMarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (isRule(line)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    const table = collectTable(lines, index);

    if (table) {
      blocks.push(table.block);
      index = table.nextIndex;
      continue;
    }

    const unorderedItem = matchUnorderedListItem(line);

    if (unorderedItem) {
      const items = collectListItems(lines, index, false);
      blocks.push({ type: "list", ordered: false, items: items.values });
      index = items.nextIndex;
      continue;
    }

    const orderedItem = matchOrderedListItem(line);

    if (orderedItem) {
      const items = collectListItems(lines, index, true);
      blocks.push({ type: "list", ordered: true, items: items.values });
      index = items.nextIndex;
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index] ?? "";

      if (
        !nextLine.trim() ||
        nextLine.match(/^(#{1,6})\s+(.+)$/) ||
        isRule(nextLine) ||
        matchUnorderedListItem(nextLine) ||
        matchOrderedListItem(nextLine)
      ) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join("\n").trim(),
    });
  }

  return blocks;
}

function collectTable(
  lines: string[],
  startIndex: number,
): { block: Extract<AssistantMarkdownBlock, { type: "table" }>; nextIndex: number } | null {
  const headerLine = lines[startIndex] ?? "";
  const delimiterLine = lines[startIndex + 1] ?? "";
  const headers = parseTableCells(headerLine);
  const delimiters = parseTableCells(delimiterLine);

  if (
    headers.length < 2 ||
    delimiters.length !== headers.length ||
    !delimiters.every(isTableDelimiterCell)
  ) {
    return null;
  }

  const rows: string[][] = [];
  let isPartialLastRow = false;
  let index = startIndex + 2;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim() || isRule(line)) {
      break;
    }

    const cells = parseTableCells(line);

    if (cells.length < 2 || isTableDelimiterRow(line)) {
      break;
    }

    rows.push(normalizeTableRow(cells, headers.length));
    isPartialLastRow = isPartialTableRow(line, index, lines.length);
    index += 1;
  }

  return {
    block: {
      type: "table",
      headers,
      rows,
      isPartialLastRow,
    },
    nextIndex: index,
  };
}

function collectListItems(
  lines: string[],
  startIndex: number,
  ordered: boolean,
): { values: string[]; nextIndex: number } {
  const items: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const itemMatch = ordered
      ? matchOrderedListItem(line)
      : matchUnorderedListItem(line);

    if (itemMatch) {
      items.push(itemMatch[1].trim());
      index += 1;
      continue;
    }

    if (!line.trim()) {
      index += 1;
      break;
    }

    if (isListContinuation(line) && items.length > 0) {
      items[items.length - 1] = `${items[items.length - 1]}\n${line.trim()}`;
      index += 1;
      continue;
    }

    break;
  }

  return { values: items, nextIndex: index };
}

function matchUnorderedListItem(line: string): RegExpMatchArray | null {
  return line.match(/^[-*]\s+(.+)$/);
}

function matchOrderedListItem(line: string): RegExpMatchArray | null {
  return line.match(/^\d+\.\s+(.+)$/);
}

function isListContinuation(line: string): boolean {
  return /^\s{2,}\S/.test(line);
}

function isRule(line: string): boolean {
  return /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line);
}

function parseTableCells(line: string): string[] {
  const trimmed = line.trim();

  if (!trimmed.includes("|")) {
    return [];
  }

  let content = trimmed;

  if (content.startsWith("|")) {
    content = content.slice(1);
  }

  if (content.endsWith("|")) {
    content = content.slice(0, -1);
  }

  const cells = content.split("|").map((cell) => cell.trim());
  return cells.length >= 2 ? cells : [];
}

function isTableDelimiterCell(cell: string): boolean {
  return /^:?-{3,}:?$/.test(cell);
}

function isTableDelimiterRow(line: string): boolean {
  const cells = parseTableCells(line);
  return cells.length >= 2 && cells.every(isTableDelimiterCell);
}

function normalizeTableRow(cells: string[], columnCount: number): string[] {
  if (cells.length === columnCount) {
    return cells;
  }

  if (cells.length < columnCount) {
    return [...cells, ...Array.from({ length: columnCount - cells.length }, () => "")];
  }

  return [
    ...cells.slice(0, columnCount - 1),
    cells.slice(columnCount - 1).join(" | "),
  ];
}

function isPartialTableRow(
  line: string,
  index: number,
  totalLines: number,
): boolean {
  const trimmed = line.trim();

  return index === totalLines - 1 && trimmed.startsWith("|") && !trimmed.endsWith("|");
}
