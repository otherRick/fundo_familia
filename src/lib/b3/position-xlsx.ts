import * as XLSX from "xlsx";

/**
 * Snapshot de posição lido do XLSX de posição da B3 (abas "Acoes" e
 * "Fundo de Investimento"). Representa a fotografia atual da carteira.
 */
export type PositionSnapshot = {
  ticker: string;
  type: string;
  quantity: number;
  b3ClosingPrice: number | null;
  b3Value: number | null;
};

export type PositionParseResult = {
  positions: PositionSnapshot[];
  /** Nomes das abas encontradas/processadas. */
  sheetsFound: string[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    let s = value.trim();
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeTicker(value: unknown): string {
  let ticker = normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]{4,6}\d{1,3}F$/.test(ticker)) ticker = ticker.slice(0, -1);
  return ticker;
}

function isTicker(value: string): boolean {
  return /^[A-Z]{4,6}\d{1,3}$/.test(value);
}

const HEADER_SYNONYMS: Record<string, string[]> = {
  ticker: [
    "codigo de negociacao",
    "codigo negociacao",
    "ticker",
    "codigo",
    "ativo",
    "papel",
  ],
  quantity: ["quantidade"],
  closingPrice: ["preco de fechamento", "fechamento"],
  value: ["valor atualizado", "valor atual", "valor"],
};

function findColumns(
  rows: unknown[][],
): Partial<Record<keyof typeof HEADER_SYNONYMS, number>> | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const columns: Partial<Record<keyof typeof HEADER_SYNONYMS, number>> = {};

    row.forEach((cell, colIndex) => {
      const header = normalizeText(cell);
      if (!header) return;
      for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS)) {
        if (columns[field] === undefined && synonyms.includes(header)) {
          columns[field] = colIndex;
        }
      }
    });

    if (columns.ticker !== undefined && columns.quantity !== undefined) {
      return columns;
    }
  }
  return null;
}

function extractFromSheet(rows: unknown[][], type: string): PositionSnapshot[] {
  const columns = findColumns(rows);
  if (!columns) return [];

  const positions: PositionSnapshot[] = [];

  for (const row of rows) {
    const ticker = normalizeTicker(row[columns.ticker ?? -1]);
    const quantity = parseNumber(row[columns.quantity ?? -1]);

    // Ignora linhas vazias e de totalização (sem ticker válido ou sem quantidade).
    if (!isTicker(ticker) || quantity == null || quantity <= 0) continue;

    positions.push({
      ticker,
      type,
      quantity,
      b3ClosingPrice: parseNumber(row[columns.closingPrice ?? -1]),
      b3Value: parseNumber(row[columns.value ?? -1]),
    });
  }

  return positions;
}

function isAcoesSheet(name: string): boolean {
  return name === "acoes" || name === "acao" || name.includes("acoes");
}

function isFiiSheet(name: string): boolean {
  return name.includes("fundo");
}

/**
 * Lê as abas "Acoes" e "Fundo de Investimento" e consolida os ativos em uma
 * única estrutura. Identifica a origem: Ações -> "Ação", Fundos -> "FII".
 */
export function parsePositionXlsx(buffer: Buffer): PositionParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const positions: PositionSnapshot[] = [];
  const sheetsFound: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const normalized = normalizeText(sheetName);

    let type: string | null = null;
    if (isAcoesSheet(normalized)) type = "Ação";
    else if (isFiiSheet(normalized)) type = "FII";
    if (!type) continue;

    sheetsFound.push(sheetName);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as unknown[][];

    positions.push(...extractFromSheet(rows, type));
  }

  return { positions, sheetsFound };
}
