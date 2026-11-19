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
          <li
            key={person.name}
            className='grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-lg border px-3 py-2 sm:flex sm:gap-x-3'
          >
            <span className='col-span-2 min-w-0 truncate font-medium sm:w-40 sm:shrink-0' title={person.name}>
              {person.name}
            </span>

            <span className='whitespace-nowrap text-right font-semibold text-primary tabular-nums sm:w-36 sm:shrink-0'>
              {formatBRL(person.total)}
            </span>

            <span className='whitespace-nowrap text-sm text-muted-foreground tabular-nums sm:w-14 sm:shrink-0 sm:text-right'>
              {formatPercent(person.percent)}
            </span>

            <div className='h-1.5 min-w-0 rounded-full bg-muted sm:min-w-16 sm:flex-1'>
              <div
                className='h-full rounded-full bg-primary'
                style={{ width: `${Math.min(person.percent, 100)}%` }}
              />
            </div>

            <div className='justify-self-end sm:shrink-0'>
              <InvestDialog />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
