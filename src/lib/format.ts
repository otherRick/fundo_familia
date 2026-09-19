/** Formata um valor numérico como moeda brasileira (ex.: R$ 1.250,00). */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata um percentual com duas casas decimais (ex.: 18,42%). */
export function formatPercent(value: number): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted}%`;
}

/** Formata um resultado monetário com sinal explícito (ex.: +R$ 1.250,00). */
export function formatSignedBRL(value: number): string {
  const abs = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value));
  if (value > 0) return `+${abs}`;
  if (value < 0) return `-${abs}`;
  return abs;
}

/** Formata um percentual com sinal explícito (ex.: +18,42%). */
export function formatSignedPercent(value: number): string {
  const abs = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  if (value > 0) return `+${abs}%`;
  if (value < 0) return `-${abs}%`;
  return `${abs}%`;
}
