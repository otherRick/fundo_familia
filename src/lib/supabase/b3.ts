import { getSupabaseServerClient } from "./server";
import { consolidatePositions } from "../b3/positions";
import type { Position } from "../b3/types";

/** Operação da B3 persistida (formato da tabela `b3_operations`). */
export type B3Operation = {
  ticker: string;
  operationType: "buy" | "sell";
  quantity: number;
  unitPrice: number;
  totalValue: number;
  operationDate: string;
  source: string;
};

export async function listOperations(): Promise<B3Operation[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("b3_operations")
    .select(
      "ticker, operation_type, quantity, unit_price, total_value, operation_date, source",
    )
    .order("operation_date", { ascending: true });

  if (error) throw new Error(`Falha ao ler operações: ${error.message}`);

  return (data ?? []).map((row) => ({
    ticker: row.ticker,
    operationType: row.operation_type,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    totalValue: Number(row.total_value),
    operationDate: row.operation_date,
    source: row.source,
  }));
}

/**
 * Chave natural de uma operação. Serve para deduplicação: reprocessar o mesmo
 * XLSX (ou arquivos com as mesmas operações) não gera registros repetidos.
 */
function operationKey(op: B3Operation): string {
  return [
    op.ticker,
    op.operationType,
    op.quantity,
    op.unitPrice,
    op.totalValue,
    op.operationDate,
  ].join("|");
}

/** Insere operações evitando duplicatas. Retorna a quantidade inserida. */
export async function insertOperations(ops: B3Operation[]): Promise<number> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error(
      "Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const { data: existing, error: readError } = await supabase
    .from("b3_operations")
    .select(
      "ticker, operation_type, quantity, unit_price, total_value, operation_date, source",
    );
  if (readError) throw new Error(`Falha ao ler operações: ${readError.message}`);

  const keys = new Set(
    (existing ?? []).map((r) =>
      operationKey({
        ticker: r.ticker,
        operationType: r.operation_type,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unit_price),
        totalValue: Number(r.total_value),
        operationDate: r.operation_date,
        source: r.source,
      }),
    ),
  );

  const toInsert = ops.filter((op) => !keys.has(operationKey(op)));
  if (toInsert.length === 0) return 0;

  const { error } = await supabase.from("b3_operations").insert(
    toInsert.map((op) => ({
      ticker: op.ticker,
      operation_type: op.operationType,
      quantity: op.quantity,
      unit_price: op.unitPrice,
      total_value: op.totalValue,
      operation_date: op.operationDate,
      source: op.source,
    })),
  );
  if (error) throw new Error(`Falha ao inserir operações: ${error.message}`);

  return toInsert.length;
}

/**
 * Reconsolida as posições a partir das operações salvas e grava em `positions`.
 * Mantém a lógica de consolidação (custo médio) separada da camada de banco.
 */
export async function consolidateAndUpsertPositions(): Promise<{
  positions: Position[];
  updated: number;
  removed: number;
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error(
      "Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const operations = await listOperations();
  const positions = consolidatePositions(
    operations.map((op) => ({
      date: op.operationDate,
      ticker: op.ticker,
      side: op.operationType,
      quantity: op.quantity,
      price: op.unitPrice,
      value: op.totalValue,
    })),
  );

  if (positions.length > 0) {
    const { error } = await supabase.from("positions").upsert(
      positions.map((p) => ({
        ticker: p.ticker,
        quantity: p.quantity,
        average_price: p.averagePrice,
        invested_value: p.investedValue,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "ticker" },
    );
    if (error) throw new Error(`Falha ao gravar posições: ${error.message}`);
  }

  // Remove apenas posições que têm operações e ficaram totalmente vendidas.
  // Posições vindas somente do snapshot (sem operações) são preservadas.
  const consolidatedTickers = new Set(positions.map((p) => p.ticker));
  const operationTickers = new Set(operations.map((op) => op.ticker));
  const soldOut = [...operationTickers].filter(
    (ticker) => !consolidatedTickers.has(ticker),
  );

  if (soldOut.length > 0) {
    const { error: deleteError } = await supabase
      .from("positions")
      .delete()
      .in("ticker", soldOut);
    if (deleteError) throw new Error(`Falha ao remover posições: ${deleteError.message}`);
  }

  return { positions, updated: positions.length, removed: soldOut.length };
}
