import { formatBRL } from "@/lib/format";
import type { B3Operation } from "@/lib/supabase/b3";

export type InvestmentItem = B3Operation & {
  name: string;
  category: string;
};

export function InvestmentsList({ investments }: { investments: InvestmentItem[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">Investimentos registrados</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Compras registradas no histórico de operações.
      </p>

      {investments.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhuma compra registrada ainda.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {investments.map((investment) => (
            <li key={investment.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{investment.name}</p>
                  <p className="text-sm text-muted-foreground">{investment.ticker}</p>
                </div>
                {investment.category && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {investment.category}
                  </span>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <Field label="Quantidade" value={String(investment.quantity)} />
                <Field label="Preço unitário" value={formatBRL(investment.unitPrice)} />
                <Field label="Valor da compra" value={formatBRL(investment.totalValue)} />
                <Field
                  label="Data"
                  value={new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
                    new Date(`${investment.operationDate}T00:00:00Z`),
                  )}
                />
              </dl>
            </li>
          ))}
        </ul>
      )}
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
