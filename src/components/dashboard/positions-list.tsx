import { cn } from "@/lib/utils";
import {
  formatBRL,
  formatSignedBRL,
  formatSignedPercent,
} from "@/lib/format";
import type { PositionValuation } from "@/lib/portfolio";

export function PositionsList({
  positions,
}: {
  positions: PositionValuation[];
}) {
  if (positions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma posição importada.</p>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Posições</h2>

      <ul className="space-y-3">
        {positions.map((position) => (
          <li key={position.ticker} className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{position.ticker}</span>
                {position.type && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {position.type}
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {position.quantity} cotas
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Field
                label="Cotação"
                value={
                  position.currentPrice != null
                    ? formatBRL(position.currentPrice)
                    : "—"
                }
              />
              <Field
                label="Hoje"
                value={
                  position.currentValue != null
                    ? formatBRL(position.currentValue)
                    : "—"
                }
              />
              <Field
                label="Preço médio"
                value={
                  position.averagePrice != null
                    ? formatBRL(position.averagePrice)
                    : "—"
                }
              />
              <Field
                label="Investido"
                value={
                  position.investedValue != null
                    ? formatBRL(position.investedValue)
                    : "—"
                }
              />
            </dl>

            <div className="mt-3 border-t pt-2 text-sm">
              <span className="text-muted-foreground">Resultado: </span>
              {position.result != null ? (
                <span className={cn("font-medium", resultTone(position.result))}>
                  {formatSignedBRL(position.result)}
                  {position.rentability != null &&
                    ` (${formatSignedPercent(position.rentability)})`}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>

            {position.b3ClosingPrice != null && position.b3Value != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                B3: fechamento {formatBRL(position.b3ClosingPrice)} · valor{" "}
                {formatBRL(position.b3Value)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function resultTone(result: number | null): string {
  if (result == null) return "text-muted-foreground";
  if (result > 0) return "text-primary";
  if (result < 0) return "text-destructive";
  return "";
}


