import { getSupabaseServerClient } from "./server";
import type { Position } from "../b3/types";
import type { PositionSnapshot } from "../b3/position-xlsx";
import positionsData from "../../data/positions.json";

export async function listPositions(): Promise<Position[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return positionsData as Position[];

  const { data, error } = await supabase
    .from("positions")
    .select(
      "ticker, type, quantity, b3_closing_price, b3_value, average_price, invested_value",
    )
    .order("ticker", { ascending: true });

  if (error) throw new Error(`Falha ao ler posições: ${error.message}`);

  return (data ?? []).map((row) => ({
    ticker: row.ticker,
    type: row.type ?? "",
    quantity: Number(row.quantity),
    b3ClosingPrice:
      row.b3_closing_price != null ? Number(row.b3_closing_price) : null,
    b3Value: row.b3_value != null ? Number(row.b3_value) : null,
    averagePrice: row.average_price != null ? Number(row.average_price) : null,
    investedValue:
      row.invested_value != null ? Number(row.invested_value) : null,
  }));
}

/**
 * Sincroniza as posições a partir do snapshot da B3 (fotografia da carteira).
 *
 * - Faz upsert por ticker, SEM sobrescrever `average_price`/`invested_value`
 *   (esses campos virão do histórico de negociações, fornecido futuramente).
 * - Remove posições que não aparecem mais no snapshot (zeradas).
 */
export async function syncPositions(
  snapshots: PositionSnapshot[],
): Promise<{ upserted: number; removed: number }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error(
      "Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  // Evita remover tudo por engano caso o snapshot venha vazio.
  if (snapshots.length === 0) {
    return { upserted: 0, removed: 0 };
  }

  const { error: upsertError } = await supabase.from("positions").upsert(
    snapshots.map((s) => ({
      ticker: s.ticker,
      type: s.type,
      quantity: s.quantity,
      b3_closing_price: s.b3ClosingPrice,
      b3_value: s.b3Value,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "ticker" },
  );
  if (upsertError) throw new Error(`Falha ao gravar posições: ${upsertError.message}`);

  const currentTickers = new Set(snapshots.map((s) => s.ticker));
  const { data: existing, error: readError } = await supabase
    .from("positions")
    .select("ticker");
  if (readError) throw new Error(`Falha ao ler posições: ${readError.message}`);

  const stale = (existing ?? [])
    .filter((r) => !currentTickers.has(r.ticker))
    .map((r) => r.ticker);

  if (stale.length > 0) {
    const { error: deleteError } = await supabase
      .from("positions")
      .delete()
      .in("ticker", stale);
    if (deleteError) throw new Error(`Falha ao remover posições: ${deleteError.message}`);
  }

  return { upserted: snapshots.length, removed: stale.length };
}

