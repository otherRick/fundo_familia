import type { Operation, Position } from "./types";
import { isTreasuryTicker } from "../treasury";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Consolida as operações (compras e vendas) na posição atual de cada ativo.
 *
 * Usa o método de custo médio: vendas reduzem a quantidade e o custo de forma
 * proporcional, mantendo o preço médio das posições restantes.
 */
export function consolidatePositions(operations: Operation[]): Position[] {
  const state = new Map<string, { quantity: number; cost: number }>();

  const sorted = [...operations].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.ticker.localeCompare(b.ticker),
  );

  for (const op of sorted) {
    const current = state.get(op.ticker) ?? { quantity: 0, cost: 0 };

    if (op.side === "buy") {
      current.quantity += op.quantity;
      current.cost += op.value;
    } else {
      if (current.quantity > 0) {
        const average = current.cost / current.quantity;
        const sold = Math.min(op.quantity, current.quantity);
        current.cost -= average * sold;
        current.quantity -= sold;

        if (current.quantity <= 0) {
          current.quantity = 0;
          current.cost = 0;
        }
      }
    }

    state.set(op.ticker, current);
  }

  const positions: Position[] = [];
  for (const [ticker, s] of state) {
    if (s.quantity <= 0) continue;
    positions.push({
      ticker,
      type: isTreasuryTicker(ticker) ? "Tesouro Direto" : "",
      quantity: round2(s.quantity),
      b3ClosingPrice: null,
      b3Value: null,
      averagePrice: round2(s.cost / s.quantity),
      investedValue: round2(s.cost),
    });
  }

  return positions.sort((a, b) => a.ticker.localeCompare(b.ticker));
}
