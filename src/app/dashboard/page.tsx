import { logout } from "@/app/actions/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { fetchQuotes } from "@/lib/brapi";
import { fetchTreasurySellQuotes, isTreasuryTicker } from "@/lib/treasury";
import {
  getContributorsSummary,
  getTotalOverall,
} from "@/lib/contributions";
import {
  summarizePortfolio,
  valuatePositions,
  type ChartDatum,
} from "@/lib/portfolio";
import { listAssets } from "@/lib/supabase/assets";
import { listOperations } from "@/lib/supabase/b3";
import { listContributions } from "@/lib/supabase/contributions";
import { listPositions } from "@/lib/supabase/positions";

export default async function DashboardPage() {
  const [positions, contributions, assets, operations] = await Promise.all([
    listPositions(),
    listContributions(),
    listAssets(),
    listOperations(),
  ]);

  const stockTickers = positions
    .map((p) => p.ticker)
    .filter((ticker) => !isTreasuryTicker(ticker));
  const treasuryTickers = positions
    .map((p) => p.ticker)
    .filter(isTreasuryTicker);
  const [stockQuotes, treasuryQuotes] = await Promise.all([
    fetchQuotes(stockTickers),
    fetchTreasurySellQuotes(treasuryTickers),
  ]);
  const quotes = { ...stockQuotes, ...treasuryQuotes };
  const valuations = valuatePositions(positions, quotes);
  const summary = summarizePortfolio(valuations);

  const totalContributed = getTotalOverall(contributions);
  const contributors = getContributorsSummary(contributions);

  // Classificação por setor a partir da tabela `assets` (fallback: Outros).
  const sectorByTicker = new Map(assets.map((a) => [a.ticker, a.sector]));
  const assetByTicker = new Map(assets.map((asset) => [asset.ticker, asset]));
  const investments = operations
    .filter((operation) => operation.operationType === "buy")
    .map((operation) => {
      const asset = assetByTicker.get(operation.ticker);
      return {
        ...operation,
        name: asset?.name || operation.ticker,
        category: asset?.type ?? "",
      };
    })
    .sort((a, b) => b.operationDate.localeCompare(a.operationDate) || b.id - a.id);

  // Distribuição do patrimônio atual por ativo.
  const allocation = buildChartData(
    valuations
      .filter((p) => p.currentValue != null)
      .map((p) => ({ name: p.ticker, value: p.currentValue as number })),
  );

  // Distribuição do patrimônio atual por setor.
  const sectorTotals = new Map<string, number>();
  for (const p of valuations) {
    if (p.currentValue == null) continue;
    const sector = sectorByTicker.get(p.ticker) ?? "Outros";
    sectorTotals.set(sector, (sectorTotals.get(sector) ?? 0) + p.currentValue);
  }
  const sectors = buildChartData(
    [...sectorTotals.entries()].map(([name, value]) => ({ name, value })),
  );

  return (
    <main className="mx-auto my-4 w-full max-w-3xl rounded-2xl border bg-white/85 px-4 py-8 backdrop-blur-md sm:my-8 sm:px-8 sm:py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Fundo Família
          </h1>
          <p className="mt-1 text-muted-foreground">
            Transparência das contribuições e investimentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Administração
          </Link>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <DashboardTabs
        totalContributed={totalContributed}
        summary={summary}
        positions={valuations}
        allocation={allocation}
        sectors={sectors}
        contributors={contributors}
        investments={investments}
      />
    </main>
  );
}

function buildChartData(items: { name: string; value: number }[]): ChartDatum[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return items
    .map((item) => ({
      name: item.name,
      value: item.value,
      percent: total > 0 ? (item.value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

