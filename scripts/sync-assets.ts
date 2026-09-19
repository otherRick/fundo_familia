import { assetSeed, type Asset } from "../src/config/assets";
import { fetchAssetInfo } from "../src/lib/brapi";
import { upsertAssets } from "../src/lib/supabase/assets";
import { getSupabaseServerClient } from "../src/lib/supabase/server";
import { listPositions } from "../src/lib/supabase/positions";

/**
 * Sincroniza a tabela `assets` a partir das posições atuais.
 *
 * Prioridade de classificação:
 *   1. seed curado (config/assets.ts) — setores em português, revisados;
 *   2. BRAPI (/quote/list) — nome e setor/subsector de tickers desconhecidos;
 *   3. fallback "Outros".
 */
async function main() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.error("❌ Supabase não configurado.");
    console.error(
      "   Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
    process.exit(1);
  }

  const positions = await listPositions();
  const tickers = positions.map((p) => p.ticker);
  if (tickers.length === 0) {
    console.log("Nenhuma posição para sincronizar.");
    return;
  }

  const seedByTicker = new Map(assetSeed.map((a) => [a.ticker, a]));

  // Consulta a BRAPI apenas para tickers ainda não classificados no seed.
  const unknown = tickers.filter((ticker) => !seedByTicker.has(ticker));
  const info = unknown.length > 0 ? await fetchAssetInfo(unknown) : new Map();

  const assets: Asset[] = tickers.map((ticker) => {
    const known = seedByTicker.get(ticker);
    if (known) return known;

    const brapi = info.get(ticker);
    return {
      ticker,
      name: brapi?.name ?? ticker,
      sector: brapi?.sector ?? "Outros",
      type: brapi?.type ?? "",
    };
  });

  await upsertAssets(assets);

  for (const a of assets) {
    const source = seedByTicker.has(a.ticker)
      ? "seed"
      : info.has(a.ticker)
        ? "brapi"
        : "fallback";
    console.log(`  ${a.ticker} — ${a.sector} (${source})`);
  }
  console.log(`✔ ${assets.length} ativos sincronizados no Supabase.`);
}

main().catch((error) => {
  console.error("Erro ao sincronizar ativos:", error);
  process.exit(1);
});
