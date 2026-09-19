/** Lado da operação (compra ou venda). */
export type OperationSide = "buy" | "sell";

/** Operação normalizada a partir de uma linha do XLSX de negociações da B3. */
export type Operation = {
  /** Data da operação no formato ISO (yyyy-mm-dd). */
  date: string;
  /** Ticker normalizado (ex.: PETR4). */
  ticker: string;
  side: OperationSide;
  quantity: number;
  price: number;
  value: number;
};

/**
 * Posição atual de um ativo.
 *
 * `quantity` e os campos B3 vêm do snapshot de posição (XLSX da B3).
 * `averagePrice` e `investedValue` vêm do histórico de negociações (custo médio),
 * que ainda não é fornecido — por isso são nullable.
 */
export type Position = {
  ticker: string;
  type: string;
  quantity: number;
  b3ClosingPrice: number | null;
  b3Value: number | null;
  averagePrice: number | null;
  investedValue: number | null;
};

