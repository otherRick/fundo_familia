import { getSupabaseServerClient } from "./server";
import { assetSeed, type Asset } from "../../config/assets";
import { isTreasuryTicker } from "../treasury";

export async function listAssets(): Promise<Asset[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return assetSeed;

  const { data, error } = await supabase
    .from("assets")
    .select("ticker, name, sector, type")
    .order("ticker", { ascending: true });

  if (error) throw new Error(`Falha ao ler ativos: ${error.message}`);

  const dbAssets = (data ?? []).map((row) => ({
    ticker: row.ticker,
    name: row.name ?? "",
    sector: row.sector ?? "Outros",
    type: row.type ?? "",
  }));

  // O seed é a classificação curada (baseline). O que estiver no banco
  // sobrescreve o seed, permitindo edição manual sem depender de re-import.
  const byTicker = new Map<string, Asset>();
  for (const a of assetSeed) byTicker.set(a.ticker, a);
  for (const a of dbAssets) byTicker.set(a.ticker, a);

  return [...byTicker.values()].sort((a, b) => a.ticker.localeCompare(b.ticker));
}

/** Insere/atualiza os ativos de referência (upsert por ticker). */
export async function upsertAssets(assets: Asset[]): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error(
      "Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const { error } = await supabase.from("assets").upsert(
    assets.map((a) => ({
      ticker: a.ticker,
      name: a.name,
      sector: a.sector,
      type: a.type,
    })),
    { onConflict: "ticker" },
  );
  if (error) throw new Error(`Falha ao gravar ativos: ${error.message}`);
}

const seedByTicker = new Map(assetSeed.map((a) => [a.ticker, a]));

/**
 * Garante que cada ticker (das posições) tenha um registro em `assets`.
 * Usa a classificação curada do seed; tickers desconhecidos são gravados como
 * "Outros" e podem ser enriquecidos depois via BRAPI (`yarn sync:assets`) ou
 * edição manual no banco.
 */
export async function syncAssets(tickers: string[]): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const unique = [...new Set(tickers)].filter(Boolean);
  if (unique.length === 0) return;

  const assets: Asset[] = unique.map((ticker) => {
    const known = seedByTicker.get(ticker);
    if (known) return known;
    if (isTreasuryTicker(ticker)) {
      return {
        ticker,
        name: ticker,
        sector: "Renda fixa",
        type: "Tesouro Direto",
      };
    }
    return { ticker, name: ticker, sector: "Outros", type: "" };
  });

  await upsertAssets(assets);
}
