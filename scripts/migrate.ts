import { getSupabaseServerClient } from "../src/lib/supabase/server";
import {
  contributionsFromJson,
  insertContributions,
  listContributions,
} from "../src/lib/supabase/contributions";
import { upsertAssets } from "../src/lib/supabase/assets";
import { assetSeed } from "../src/config/assets";
import { getTotalOverall } from "../src/lib/contributions";

async function main() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.error("❌ Supabase não configurado.");
    console.error(
      "   Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
    process.exit(1);
  }

  // 1) Contribuições do JSON (ignora valores 0/vazios).
  const rows = contributionsFromJson();
  const totalAntes = getTotalOverall(rows);
  console.log(
    `📄 Contribuições no JSON: ${rows.length} registros válidos (total R$ ${totalAntes.toFixed(2)})`,
  );

  const inserted = await insertContributions(rows);
  console.log(
    `➕ Inseridas: ${inserted} (duplicadas ignoradas: ${rows.length - inserted})`,
  );

  // 2) Assets de referência (seed).
  await upsertAssets(assetSeed);
  console.log(`🏷 Assets sincronizados: ${assetSeed.length}`);

  // 3) Validação: total antes === total depois.
  const after = await listContributions();
  const keySet = new Set(rows.map((r) => `${r.personName}|${r.amount}|${r.date}`));
  const migrated = after.filter((r) =>
    keySet.has(`${r.personName}|${r.amount}|${r.date}`),
  );
  const totalDepois = getTotalOverall(migrated);

  console.log(`\nTotal antes:  R$ ${totalAntes.toFixed(2)}`);
  console.log(`Total depois: R$ ${totalDepois.toFixed(2)}`);

  if (Math.abs(totalAntes - totalDepois) < 0.01) {
    console.log("✔ Totais iguais — migração concluída com sucesso.");
  } else {
    console.error(
      `✘ DIVERGÊNCIA: antes R$ ${totalAntes.toFixed(2)} vs depois R$ ${totalDepois.toFixed(2)}`,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Erro na migração:", error);
  process.exit(1);
});
