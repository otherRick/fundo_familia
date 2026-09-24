import { formatBRL, formatSignedBRL, formatSignedPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PortfolioSummary } from '@/lib/portfolio';

export type MetricKey = 'contributed' | 'invested' | 'current' | 'result';

type Props = {
  totalContributed: number;
  summary: PortfolioSummary;
  activeMetric: MetricKey;
  onMetricChange: (metric: MetricKey) => void;
};

export function SummaryCards({ totalContributed, summary, activeMetric, onMetricChange }: Props) {
  const { totalInvested, totalCurrent, result, rentability, missingTickers } = summary;

  return (
    <section>
      <div
        className='grid grid-cols-2 gap-3 lg:grid-cols-4'
        role='group'
        aria-label='Indicadores do fundo'
      >
        <SummaryCard
          metric='contributed'
          label='Total contribuído'
          value={formatBRL(totalContributed)}
          selected={activeMetric === 'contributed'}
          onSelect={onMetricChange}
        />
        <SummaryCard
          metric='invested'
          label='Total investido'
          value={totalInvested != null ? formatBRL(totalInvested) : '—'}
          selected={activeMetric === 'invested'}
          onSelect={onMetricChange}
        />
        <SummaryCard
          metric='current'
          label='Patrimônio atual'
          value={totalCurrent != null ? formatBRL(totalCurrent) : '—'}
          selected={activeMetric === 'current'}
          onSelect={onMetricChange}
        />
        <ResultCard
          result={result}
          rentability={rentability}
          selected={activeMetric === 'result'}
          onSelect={onMetricChange}
        />
      </div>

      {missingTickers.length > 0 && (
        <p className='mt-3 text-xs text-muted-foreground'>
          Sem cotação atual para: {missingTickers.join(', ')}.
        </p>
      )}
    </section>
  );
}

function SummaryCard({
  metric,
  label,
  value,
  selected,
  onSelect
}: {
  metric: MetricKey;
  label: string;
  value: string;
  selected: boolean;
  onSelect: (metric: MetricKey) => void;
}) {
  return (
    <button
      type='button'
      aria-pressed={selected}
      onClick={() => onSelect(metric)}
      className={cardClass(selected)}
    >
      <div className='p-4 text-left sm:p-5 '>
        <p className='text-xs text-muted-foreground sm:text-sm font-bold'>{label}</p>
        <p className=''>{value}</p>
      </div>
    </button>
  );
}

function ResultCard({
  result,
  rentability,
  selected,
  onSelect
}: {
  result: number | null;
  rentability: number | null;
  selected: boolean;
  onSelect: (metric: MetricKey) => void;
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
    <button
      type='button'
      aria-pressed={selected}
      onClick={() => onSelect('result')}
      className={cardClass(selected)}
    >
      <div className='p-4 text-left sm:p-5'>
        <p className='text-xs text-muted-foreground sm:text-sm'>Resultado</p>
        <p className={`mt-1 font-semibold ${tone}`}>
          {result != null ? formatSignedBRL(result) : '—'}
        </p>
        {rentability != null && (
          <p className={`text-xs sm:text-sm ${tone}`}>{formatSignedPercent(rentability)}</p>
        )}
      </div>
    </button>
  );
}

function cardClass(selected: boolean): string {
  return cn(
    'rounded-xl border bg-card text-card-foreground shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-primary/50',
    selected && 'border-primary bg-primary/5 ring-1 ring-primary'
  );
}
