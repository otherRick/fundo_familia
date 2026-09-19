import { getSupabaseServerClient } from "./server";
import type { Contribution } from "../contributions";
import contributionsData from "../../data/contributions.json";

export async function listContributions(): Promise<Contribution[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return contributionsFromJson();

  const { data, error } = await supabase
    .from("contributions")
    .select("person_name, amount, contribution_date")
    .order("contribution_date", { ascending: true });

  if (error) throw new Error(`Falha ao ler contribuições: ${error.message}`);

  return (data ?? []).map((row) => ({
    personName: row.person_name,
    amount: Number(row.amount),
    date: row.contribution_date,
  }));
}

/** Converte o JSON local (ano -> pessoa -> valor) em linhas, ignorando zeros. */
export function contributionsFromJson(): Contribution[] {
  const rows: Contribution[] = [];

  for (const [year, people] of Object.entries(contributionsData)) {
    for (const [personName, amount] of Object.entries(
      people as Record<string, number>,
    )) {
      if (amount > 0) {
        rows.push({ personName, amount, date: `${year}-01-01` });
      }
    }
  }

  return rows;
}

/** Insere contribuições evitando duplicatas (dedup por chave natural). */
export async function insertContributions(
  rows: Contribution[],
): Promise<number> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error(
      "Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const { data: existing, error: readError } = await supabase
    .from("contributions")
    .select("person_name, amount, contribution_date");
  if (readError) throw new Error(`Falha ao ler contribuições: ${readError.message}`);

  const keys = new Set(
    (existing ?? []).map(
      (r) => `${r.person_name}|${Number(r.amount)}|${r.contribution_date}`,
    ),
  );

  const toInsert = rows.filter(
    (r) => !keys.has(`${r.personName}|${r.amount}|${r.date}`),
  );
  if (toInsert.length === 0) return 0;

  const { error } = await supabase.from("contributions").insert(
    toInsert.map((r) => ({
      person_name: r.personName,
      amount: r.amount,
      contribution_date: r.date,
    })),
  );
  if (error) throw new Error(`Falha ao inserir contribuições: ${error.message}`);

  return toInsert.length;
}

/** Insere uma contribuição avulsa (sem deduplicação — usado no formulário admin). */
export async function insertContribution(row: Contribution): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error(
      "Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const { error } = await supabase.from("contributions").insert({
    person_name: row.personName,
    amount: row.amount,
    contribution_date: row.date,
  });
  if (error) throw new Error(`Falha ao inserir contribuição: ${error.message}`);
}
