/** Mapa ticker -> cotação atual (null quando indisponível). */
export type QuoteMap = Record<string, number | null>;

const BRAPI_BASE_URL = "https://brapi.dev/api/quote";

/**
 * Faz uma chamada à BRAPI para um ou mais tickers.
 * O token (opcional) vem de `BRAPI_TOKEN` e é enviado via header Authorization.
 * Falhas/timeout devolvem `null` para os tickers não resolvidos.
 */
async function request(tickers: string[]): Promise<QuoteMap> {
  const map: QuoteMap = {};
  for (const ticker of tickers) map[ticker] = null;
  if (tickers.length === 0) return map;

  const token = process.env.BRAPI_TOKEN;
  const url = `${BRAPI_BASE_URL}/${tickers.join(",")}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) return map;

    const data = (await res.json()) as {
      error?: boolean;
      results?: Array<{ symbol?: string; regularMarketPrice?: number }>;
    };

    if (data.error) return map;

    for (const result of data.results ?? []) {
      const symbol = result.symbol;
      const price = result.regularMarketPrice;
      if (symbol && typeof price === "number") {
        map[symbol] = price;
      }
    }
  } catch {
    // Mantém cotações como null.
  } finally {
    clearTimeout(timeout);
  }

  return map;
}

/**
 * Consulta cotações atuais no servidor.
 *
 * O plano gratuito da BRAPI permite apenas 1 ativo por requisição e 1 requisição
 * simultânea. Por isso cada ticker é consultado individualmente e em sequência.
 */
export async function fetchQuotes(tickers: string[]): Promise<QuoteMap> {
  const unique = [...new Set(tickers)].filter(Boolean);
  const map: QuoteMap = {};
  for (const ticker of unique) map[ticker] = null;
  if (unique.length === 0) return map;

  for (const ticker of unique) {
    const result = await request([ticker]);
    if (result[ticker] != null) map[ticker] = result[ticker];
  }

  return map;
}


