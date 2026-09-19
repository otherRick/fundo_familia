import type { Position } from "./b3/types";

export type { Position } from "./b3/types";

/** Posição enriquecida com a cotação atual e o resultado calculado. */
export type PositionValuation = Position & {
  currentPrice: number | null;
  currentValue: number | null;
  result: number | null;
  rentability: number | null;
};

export type PortfolioSummary = {
  totalInvested: number | null;
  totalCurrent: number | null;
  result: number | null;
  rentability: number | null;
  /** Tickers sem cotação resolvida. */
  missingTickers: string[];
};

export type ChartDatum = {
  name: string;
  value: number;
  percent: number;
};

/**
 * Combina posições + cotações atuais:
 * valorAtual = quantidade * cotação;
 * resultado = valorAtual - valorInvestido (somente quando há custo);
 * rentabilidade = resultado / valorInvestido * 100.
 */
export function valuatePositions(
  positions: Position[],
  quotes: Record<string, number | null>,
): PositionValuation[] {
  return positions.map((p) => {
    const currentPrice = quotes[p.ticker] ?? null;
    const currentValue =
      currentPrice != null ? p.quantity * currentPrice : null;
    const result =
      currentValue != null && p.investedValue != null
        ? currentValue - p.investedValue
        : null;
    const rentability =
      result != null && p.investedValue != null && p.investedValue !== 0
        ? (result / p.investedValue) * 100
        : null;

    return { ...p, currentPrice, currentValue, result, rentability };
  });
}

/** Consolida os totais do portfólio a partir das posições valorizadas. */
export function summarizePortfolio(
  valuations: PositionValuation[],
): PortfolioSummary {
  const withInvested = valuations.filter((p) => p.investedValue != null);
  const totalInvested =
    withInvested.length > 0
      ? withInvested.reduce((sum, p) => sum + (p.investedValue ?? 0), 0)
      : null;

  const missingTickers = valuations
    .filter((p) => p.currentValue == null)
    .map((p) => p.ticker);

  const withQuote = valuations.filter((p) => p.currentValue != null);
  const totalCurrent =
    withQuote.length > 0
      ? withQuote.reduce((sum, p) => sum + (p.currentValue ?? 0), 0)
      : null;

  const result =
    totalCurrent != null && totalInvested != null
      ? totalCurrent - totalInvested
      : null;
  const rentability =
    result != null && totalInvested != null && totalInvested !== 0
      ? (result / totalInvested) * 100
      : null;

  return { totalInvested, totalCurrent, result, rentability, missingTickers };
}

