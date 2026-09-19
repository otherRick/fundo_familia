import type { Operation, OperationSide } from "./types";

type CanonicalField = "date" | "side" | "ticker" | "quantity" | "price" | "value";

/** Sinônimos de cabeçalhos comuns no extrato de negociações da B3/CEI. */
const HEADER_SYNONYMS: Record<CanonicalField, string[]> = {
  date: ["data do negocio", "data negociacao", "data"],
  side: [
    "compra/venda",
    "compra venda",
    "tipo de movimentacao",
    "movimentacao",
    "operacao",
    "c/v",
  ],
  ticker: [
    "codigo de negociacao",
    "codigo negociacao",
    "codigo do ativo",
    "ticker",
    "ativo",
    "papel",
    "codigo",
  ],
  quantity: ["quantidade", "qtd", "qtde"],
  price: ["preco", "preco unitario", "cotacao"],
  value: [
    "valor da operacao",
    "valor operacao",
    "valor total",
    "valor liquido",
    "valor",
  ],
};

/** Normaliza um texto para comparação (minúsculo, sem acento, sem espaços extras). */
function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Converte o valor de uma célula para número (aceita formatos pt-BR). */
function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    let s = value.trim();
    if (s.includes(",")) {
      s = s.replace(/\./g, "").replace(",", ".");
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Converte data (Date, serial do Excel ou string dd/mm/aaaa) para ISO. */
function parseDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  if (typeof value === "number" && Number.isFinite(value)) {
    // Serial do Excel: dias desde 1970-01-01 = serial - 25569
    const ms = Math.round((value - 25569) * 86400000);
    return new Date(ms).toISOString().slice(0, 10);
  }

  if (typeof value === "string" && value.trim()) {
    const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      let year = match[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }

    const iso = value.trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  }

  return null;
}

function parseSide(value: unknown): OperationSide | null {
  const s = normalizeText(value);
  if (!s) return null;
  if (s === "c" || s === "compra" || s === "credito" || s === "credit") return "buy";
  if (s === "v" || s === "venda" || s === "debito" || s === "debit") return "sell";
  return null;
}

/** Remove o "F" de tickers fracionários (ex.: PETR4F -> PETR4). */
function normalizeTicker(value: unknown): string {
  let ticker = normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]{4,6}\d{1,3}F$/.test(ticker)) {
    ticker = ticker.slice(0, -1);
  }
  return ticker;
}

/** Verifica se o ticker tem formato de ativo da B3 (letras + números). */
function isTicker(value: string): boolean {
  return /^[A-Z]{4,6}\d{1,3}$/.test(value);
}

function findHeader(rows: unknown[][]): {
  rowIndex: number;
  columns: Partial<Record<CanonicalField, number>>;
} | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const columns: Partial<Record<CanonicalField, number>> = {};

    row.forEach((cell, colIndex) => {
      const header = normalizeText(cell);
      if (!header) return;
      for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS) as [
        CanonicalField,
        string[],
      ][]) {
        if (columns[field] === undefined && synonyms.includes(header)) {
          columns[field] = colIndex;
          break;
        }
      }
    });

    if (Object.keys(columns).length >= 3) {
      return { rowIndex: i, columns };
    }
  }
  return null;
}

/** Normaliza as linhas brutas do XLSX em operações tipadas. */
export function normalizeOperations(rows: unknown[][]): Operation[] {
  const header = findHeader(rows);
  if (!header) return [];

  const { rowIndex, columns } = header;
  const operations: Operation[] = [];

  for (let i = rowIndex + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];

    const ticker = normalizeTicker(row[columns.ticker ?? -1]);
    const side = parseSide(row[columns.side ?? -1]);
    const date = parseDate(row[columns.date ?? -1]);

    if (!isTicker(ticker) || !side || !date) continue;

    const quantity = parseNumber(row[columns.quantity ?? -1]);
    const price = parseNumber(row[columns.price ?? -1]);
    const value = parseNumber(row[columns.value ?? -1]);

    if (quantity <= 0) continue;

    operations.push({
      date,
      ticker,
      side,
      quantity,
      price,
      value: value > 0 ? value : quantity * price,
    });
  }

  return operations;
}
