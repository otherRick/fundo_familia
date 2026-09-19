import { Card, CardContent } from '@/components/ui/card';
import { formatBRL, formatSignedBRL, formatSignedPercent } from '@/lib/format';
import type { PortfolioSummary } from '@/lib/portfolio';

type Props = {
  totalContributed: number;
  summary: PortfolioSummary;
};

export function SummaryCards({ totalContributed, summary }: Props) {
  const { totalInvested, totalCurrent, result, rentability, missingTickers } = summary;

  return (
    <section>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <SummaryCard label='Total contribuído' value={formatBRL(totalContributed)} />
        <SummaryCard
          label='Total investido'
          value={totalInvested != null ? formatBRL(totalInvested) : '—'}
        />
        <SummaryCard
          label='Patrimônio atual'
          value={totalCurrent != null ? formatBRL(totalCurrent) : '—'}
        />
        <ResultCard result={result} rentability={rentability} />
      </div>

      {missingTickers.length > 0 && (
        <p className='mt-3 text-xs text-muted-foreground'>
          Sem cotação atual para: {missingTickers.join(', ')}.
        </p>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className='pt-5'>
        <p className='text-xs text-muted-foreground sm:text-sm'>{label}</p>
        <p className='mt-1 text-xl font-semibold text-primary sm:text-2xl'>{value}</p>
      </CardContent>
    </Card>
  );
}

function ResultCard({
  result,
  rentability
}: {
  result: number | null;
  rentability: number | null;
}) {
  const tone =
    result == null
      ? 'text-muted-foreground'
      : result > 0
        ? 'text-primary'
        : result < 0
          ? 'text-destructive'
          : 'text-foreground';

  return (
    <Card>
      <CardContent className='pt-5'>
        <p className='text-xs text-muted-foreground sm:text-sm'>Resultado</p>
        <p className={`mt-1 text-xl font-semibold sm:text-2xl ${tone}`}>
          {result != null ? formatSignedBRL(result) : '—'}
        </p>
        {rentability != null && (
          <p className={`text-xs sm:text-sm ${tone}`}>{formatSignedPercent(rentability)}</p>
        )}
      </CardContent>
    </Card>
  );
}
