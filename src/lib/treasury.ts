/**
 * Consulta gratuita ao histórico público do Tesouro Direto. O arquivo é
 * publicado pelo Tesouro Transparente e contém títulos que não são mais
 * ofertados, o que é importante para registrar operações antigas.
 */
const TREASURY_PRICES_URL =
  "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv";

const TREASURY_PREFIX = /^(TESOURO\b|LFT\b|LTN\b|NTN-[BCF]\b|RENDA\+?\b|EDUCA\+?\b)/i;

type TreasuryRow = {
  title: string;
  maturityDate: string;
  date: string;
  buyPrice: number | null;
  sellPrice: number | null;
};

export type TreasuryPrice = {
  /** Preço unitário de compra (PU Compra) na data encontrada. */
  buyPrice: number | null;
  /** Preço unitário de venda (PU Venda) na data encontrada. */
  sellPrice: number | null;
  /** Data de referência do arquivo oficial (pode ser o dia útil anterior). */
  referenceDate: string;
  title: string;
  maturityDate: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Identifica os formatos usuais de símbolos do Tesouro, inclusive NTN/LTN/LFT. */
export function isTreasuryTicker(value: string): boolean {
  return TREASURY_PREFIX.test(value.trim());
}

/** Mantém espaços e sinais do nome do título; ações continuam normalizadas separadamente. */
export function normalizeTreasuryTicker(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase();
}

function parseBrazilianNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function parseRows(csv: string): TreasuryRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/);
  const header = lines.shift()?.split(";") ?? [];
  const indexOf = (name: string) => header.indexOf(name);
  const titleIndex = indexOf("Tipo Titulo");
  const maturityIndex = indexOf("Data Vencimento");
  const dateIndex = indexOf("Data Base");
  const buyIndex = indexOf("PU Compra Manha");
  const sellIndex = indexOf("PU Venda Manha");

  if ([titleIndex, maturityIndex, dateIndex, buyIndex, sellIndex].some((i) => i < 0)) {
    throw new Error("Formato inesperado do arquivo público do Tesouro Direto.");
  }

  return lines.flatMap((line) => {
    const cells = line.split(";");
    const title = cells[titleIndex]?.trim();
    const maturityDate = cells[maturityIndex]?.trim();
    const date = cells[dateIndex]?.trim();
    if (!title || !maturityDate || !date) return [];

    return [{
      title,
      maturityDate,
      date,
      buyPrice: parseBrazilianNumber(cells[buyIndex]),
      sellPrice: parseBrazilianNumber(cells[sellIndex]),
    }];
  });
}

function maturityYear(value: string): string | null {
  return /\/(\d{4})$/.exec(value)?.[1] ?? null;
}

/** Converte os códigos tradicionais para a denominação usada no arquivo oficial. */
function titleAliases(query: string): string[] {
  const normalized = normalize(query);
  if (/^LFT\b/.test(normalized)) return ["TESOURO SELIC"];
  if (/^LTN\b/.test(normalized)) return ["TESOURO PREFIXADO"];
  if (/^NTN-B PRINCIPAL\b/.test(normalized)) return ["TESOURO IPCA+"];
  if (/^NTN-B\b/.test(normalized)) return ["TESOURO IPCA+ COM JUROS SEMESTRAIS"];
  if (/^NTN-C\b/.test(normalized)) return ["TESOURO IGPM+ COM JUROS SEMESTRAIS"];
  if (/^NTN-F\b/.test(normalized)) {
    return ["TESOURO PREFIXADO COM JUROS SEMESTRAIS"];
  }
  return [normalized];
}

function matchesTicker(row: TreasuryRow, ticker: string): boolean {
  const query = normalize(ticker);
  const title = normalize(row.title);
  const year = maturityYear(row.maturityDate);
  const maturity = normalize(row.maturityDate);
  const queryYear = /\b(\d{4})\b/.exec(query)?.[1] ?? null;
  const aliases = titleAliases(ticker);

  return aliases.some((alias) => {
    // Códigos tradicionais (LFT/LTN/NTN) são traduzidos para o título do
    // arquivo. Quando trazem ano, ele também precisa coincidir.
    if (alias === title) return !queryYear || queryYear === year;
    if (year && (alias === `${title} ${year}` || alias === `${title}${year}`)) {
      return true;
    }
    // Permite informar a data de vencimento completa, p.ex. "Tesouro Selic 01/03/2029".
    return query === `${title} ${maturity}`;
  });
}

function hasMaturityInQuery(ticker: string): boolean {
  return /(?:\b\d{4}\b|\b\d{2}\/\d{2}\/\d{4}\b)/.test(ticker);
}

async function loadTreasuryRows(): Promise<TreasuryRow[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    const response = await fetch(TREASURY_PRICES_URL, {
      next: { revalidate: 60 * 60 },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error("Não foi possível consultar o arquivo público do Tesouro Direto.");
    }
    return parseRows(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Busca o PU de um título na data solicitada. Como o arquivo é diário, em fins
 * de semana/feriados usa a última cotação disponível até a data da operação.
 */
function findTreasuryPriceInRows(
  rows: TreasuryRow[],
  ticker: string,
  date: string,
): TreasuryPrice | null {
  if (!isTreasuryTicker(ticker) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const matchingRows = rows
    .filter((row) => matchesTicker(row, ticker))
    .filter((row) => {
      const rowDate = toIsoDate(row.date);
      return rowDate != null && rowDate <= date;
    })
    .sort((a, b) =>
      (toIsoDate(b.date) ?? "").localeCompare(toIsoDate(a.date) ?? ""),
    );

  // Sem vencimento, um nome como "Tesouro Selic" pode identificar vários
  // títulos. Não preenchemos um preço potencialmente errado nesse caso.
  if (!hasMaturityInQuery(ticker)) {
    const maturities = new Set(matchingRows.map((row) => row.maturityDate));
    if (maturities.size > 1) return null;
  }
  const row = matchingRows[0];
  const referenceDate = row ? toIsoDate(row.date) : null;

  if (!row || !referenceDate) return null;
  return {
    buyPrice: row.buyPrice,
    sellPrice: row.sellPrice,
    referenceDate,
    title: row.title,
    maturityDate: row.maturityDate,
  };
}

export async function findTreasuryPrice(
  ticker: string,
  date: string,
): Promise<TreasuryPrice | null> {
  return findTreasuryPriceInRows(await loadTreasuryRows(), ticker, date);
}

/** Cotação atual da carteira: usa o PU de venda do último dia disponível. */
export async function fetchTreasurySellQuotes(
  tickers: string[],
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  const today = new Date().toISOString().slice(0, 10);
  const unique = [...new Set(tickers)].filter(isTreasuryTicker);

  if (unique.length === 0) return result;

  try {
    const rows = await loadTreasuryRows();
    for (const ticker of unique) {
      result[ticker] = findTreasuryPriceInRows(rows, ticker, today)?.sellPrice ?? null;
    }
  } catch {
    // Mantém o comportamento de cotação indisponível já usado para ações.
    for (const ticker of unique) result[ticker] = null;
  }

  return result;
}
