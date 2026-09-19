import { InvestDialog } from "@/components/dashboard/invest-dialog";
import { formatBRL, formatPercent } from "@/lib/format";
import type { ContributorSummary } from "@/lib/contributions";

export function Participants({ summary }: { summary: ContributorSummary[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">
        Participação no Fundo
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Contribuições acumuladas de cada participante.
      </p>

      <ul className="mt-4 space-y-1.5">
        {summary.map((person) => (
          <li
            key={person.name}
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border px-3 py-2"
          >
            <span className="font-medium">{person.name}</span>
            <span className="font-semibold text-primary">
              {formatBRL(person.total)}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatPercent(person.percent)}
            </span>

            <div className="h-1.5 min-w-28 flex-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(person.percent, 100)}%` }}
              />
            </div>

            <div className="ml-auto">
              <InvestDialog />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

