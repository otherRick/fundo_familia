import { readFile } from "node:fs/promises";
import path from "node:path";

import { parsePositionXlsx } from "../src/lib/b3/position-xlsx";
import { syncAssets } from "../src/lib/supabase/assets";
import { getSupabaseServerClient } from "../src/lib/supabase/server";
import { syncPositions } from "../src/lib/supabase/positions";

async function main() {
  const cwd = process.cwd();
  const inputPath =
    process.argv[2] ?? path.join(cwd, "src/data/b3/posicao.xlsx");

  const buffer = await readFile(inputPath);
  const result = parsePositionXlsx(buffer);

  if (result.sheetsFound.length < 2) {
    throw new Error(
      `Arquivo inválido: esperado as abas "Acoes" e "Fundo de Investimento". Encontradas: ${result.sheetsFound.join(", ") || "nenhuma"}.`,
    );
  }

  console.log(
    `✔ ${result.positions.length} ativos lidos (abas: ${result.sheetsFound.join(", ")}).`,
  );
  for (const p of result.positions) {
    console.log(`  ${p.ticker} (${p.type}): ${p.quantity} un`);
  }

  if (!getSupabaseServerClient()) {
    throw new Error(
      "Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const { removed } = await syncPositions(result.positions);
  await syncAssets(result.positions.map((p) => p.ticker));
  console.log(`✔ Posições sincronizadas no Supabase (${removed} removidas).`);
}

main().catch((error) => {
  console.error("Erro ao importar a posição B3:", error);
  console.error(
    "Dica: execute `yarn import:b3 <caminho/para/posicao.xlsx>` ou coloque o arquivo em src/data/b3/posicao.xlsx.",
  );
  process.exit(1);
});


