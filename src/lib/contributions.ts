/**
 * Uma contribuição (linha) — alinhada à tabela `contributions` do Supabase.
 * `date` está no formato yyyy-mm-dd.
 */
export type Contribution = {
  personName: string;
  amount: number;
  date: string;
};

/** Todos os contribuintes (sem duplicatas), em ordem alfabética. */
export function getContributors(rows: Contribution[]): string[] {
  return Array.from(new Set(rows.map((r) => r.personName))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

/** Anos presentes, em ordem crescente. */
export function getYears(rows: Contribution[]): string[] {
  return Array.from(new Set(rows.map((r) => r.date.slice(0, 4)))).sort(
    (a, b) => Number(a) - Number(b),
  );
}

/** Total contribuído por uma pessoa. */
export function getTotalByPerson(rows: Contribution[], name: string): number {
  return rows
    .filter((r) => r.personName === name)
    .reduce((sum, r) => sum + r.amount, 0);
}

/** Total contribuído em um ano específico. */
export function getTotalByYear(rows: Contribution[], year: string): number {
  return rows
    .filter((r) => r.date.slice(0, 4) === year)
    .reduce((sum, r) => sum + r.amount, 0);
}

/** Total geral contribuído (todas as pessoas, todos os anos). */
export function getTotalOverall(rows: Contribution[]): number {
  return rows.reduce((sum, r) => sum + r.amount, 0);
}

/** Participação (%) de uma pessoa: totalDaPessoa / totalGeral * 100. */
export function getParticipationPercent(
  rows: Contribution[],
  name: string,
): number {
  const total = getTotalOverall(rows);
  if (total === 0) return 0;
  return (getTotalByPerson(rows, name) / total) * 100;
}

export type ContributorSummary = {
  name: string;
  total: number;
  percent: number;
};

/** Lista de contribuintes com total e participação, do maior para o menor. */
export function getContributorsSummary(
  rows: Contribution[],
): ContributorSummary[] {
  const total = getTotalOverall(rows);

  return getContributors(rows)
    .map((name) => {
      const personTotal = getTotalByPerson(rows, name);
      return {
        name,
        total: personTotal,
        percent: total === 0 ? 0 : (personTotal / total) * 100,
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

/** Período coberto pelos dados (ex.: "2022 — 2023"). */
export function getPeriod(rows: Contribution[]): string {
  const years = getYears(rows);
  if (years.length === 0) return "—";
  if (years.length === 1) return years[0];
  return `${years[0]} — ${years[years.length - 1]}`;
}

