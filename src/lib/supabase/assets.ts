import { getSupabaseServerClient } from "./server";
import { assetSeed, type Asset } from "../../config/assets";

export async function listAssets(): Promise<Asset[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return assetSeed;

  const { data, error } = await supabase
    .from("assets")
    .select("ticker, name, sector, type")
    .order("ticker", { ascending: true });

  if (error) throw new Error(`Falha ao ler ativos: ${error.message}`);

  return (data ?? []).map((row) => ({
    ticker: row.ticker,
    name: row.name ?? "",
    sector: row.sector ?? "Outros",
    type: row.type ?? "",
  }));
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
