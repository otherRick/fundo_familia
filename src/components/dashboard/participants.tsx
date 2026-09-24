import { InvestDialog } from '@/components/dashboard/invest-dialog';
import { formatBRL, formatPercent } from '@/lib/format';
import type { ContributorSummary } from '@/lib/contributions';

export function Participants({ summary }: { summary: ContributorSummary[] }) {
  return (
    <section>
      <h2 className='text-lg font-semibold tracking-tight'>Participação no Fundo</h2>
      <p className='mt-1 text-sm text-muted-foreground'>
        Contribuições acumuladas de cada participante.
      </p>

      <ul className='mt-4 space-y-1.5'>
        {summary.map((person) => (
          <li key={person.name} className='flex items-center gap-x-3 rounded-lg border px-3 py-2'>
            <span className='w-28 shrink-0 truncate font-medium sm:w-40' title={person.name}>
              {person.name}
            </span>

            <span className='w-36 shrink-0 whitespace-nowrap text-right font-semibold text-primary tabular-nums'>
              {formatBRL(person.total)}
            </span>

            <span className='w-14 shrink-0 whitespace-nowrap text-right text-sm text-muted-foreground tabular-nums'>
              {formatPercent(person.percent)}
            </span>

            <div className='h-1.5 min-w-16 flex-1 rounded-full bg-muted'>
              <div
                className='h-full rounded-full bg-primary'
                style={{ width: `${Math.min(person.percent, 100)}%` }}
              />
            </div>

            <div className='shrink-0'>
              <InvestDialog />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
