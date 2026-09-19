import { readFile } from "node:fs/promises";
import path from "node:path";

import { normalizeOperations } from "../src/lib/b3/operations";
import { readXlsxRows } from "../src/lib/b3/xlsx";
import {
  consolidateAndUpsertPositions,
  insertOperations,
} from "../src/lib/supabase/b3";
import { getSupabaseServerClient } from "../src/lib/supabase/server";

async function main() {
  const inputPath =
    process.argv[2] ??
    path.join(process.cwd(), "src/data/b3/negociacoes.xlsx");

  const buffer = await readFile(inputPath);
  const operations = normalizeOperations(readXlsxRows(buffer));

  if (operations.length === 0) {
    throw new Error("Nenhuma negociação encontrada no arquivo.");
  }

  console.log(`✔ ${operations.length} negociações lidas.`);

  if (!getSupabaseServerClient()) {
    throw new Error(
      "Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const inserted = await insertOperations(
    operations.map((op) => ({
      ticker: op.ticker,
      operationType: op.side,
      quantity: op.quantity,
      unitPrice: op.price,
      totalValue: op.value,
      operationDate: op.date,
      source: "xlsx",
    })),
  );
  const { updated, removed } = await consolidateAndUpsertPositions();

  console.log(
    `✔ ${inserted} negociações importadas · ${updated} posições atualizadas${removed > 0 ? ` · ${removed} removidas` : ""}.`,
  );
}

main().catch((error) => {
  console.error("Erro ao importar negociações:", error);
  console.error(
    "Dica: execute `yarn import:operations <caminho/para/negociacoes.xlsx>`.",
  );
  process.exit(1);
});
