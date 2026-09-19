"use client";

import { useState } from "react";

import { DonutChart } from "@/components/dashboard/donut-chart";
import { Participants } from "@/components/dashboard/participants";
import { PositionsList } from "@/components/dashboard/positions-list";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { cn } from "@/lib/utils";
import type { ContributorSummary } from "@/lib/contributions";
import type {
  ChartDatum,
  PortfolioSummary,
  PositionValuation,
} from "@/lib/portfolio";

type TabKey = "resumo" | "alocacao" | "setores" | "posicoes";

const TABS: { key: TabKey; label: string }[] = [
  { key: "resumo", label: "Resumo" },
  { key: "alocacao", label: "Alocação" },
  { key: "setores", label: "Setores" },
  { key: "posicoes", label: "Posições" },
];

type Props = {
  totalContributed: number;
  summary: PortfolioSummary;
  positions: PositionValuation[];
  allocation: ChartDatum[];
  sectors: ChartDatum[];
  contributors: ContributorSummary[];
};

export function DashboardTabs({
  totalContributed,
  summary,
  positions,
  allocation,
  sectors,
  contributors,
}: Props) {
  const [active, setActive] = useState<TabKey>("resumo");

  return (
    <div className="mt-8">
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              active === tab.key
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {active === "resumo" && (
          <div className="space-y-8">
            <SummaryCards
              totalContributed={totalContributed}
              summary={summary}
            />
            <Participants summary={contributors} />
          </div>
        )}

        {active === "alocacao" && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Alocação</h2>
            <p className="text-sm text-muted-foreground">
              Distribuição do patrimônio atual entre os ativos.
            </p>
            <DonutChart
              data={allocation}
              emptyMessage="Em breve"
            />
          </section>
        )}

        {active === "setores" && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Setores</h2>
            <p className="text-sm text-muted-foreground">
              Distribuição do patrimônio atual por setor.
            </p>
            <DonutChart
              data={sectors}
              emptyMessage="Em breve"
            />
          </section>
        )}

        {active === "posicoes" && <PositionsList positions={positions} />}
      </div>
    </div>
  );
}
