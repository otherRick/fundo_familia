import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ContributionForm } from "@/components/admin/contribution-form";
import { ImportForm } from "@/components/admin/import-form";
import { OperationForm } from "@/components/admin/operation-form";
import { OperationsManager } from "@/components/admin/operations-manager";
import { OperationsImportForm } from "@/components/admin/operations-import-form";
import { getContributors } from "@/lib/contributions";
import { listContributions } from "@/lib/supabase/contributions";
import { listOperations } from "@/lib/supabase/b3";
import { listAssets } from "@/lib/supabase/assets";

export default async function AdminPage() {
  const [contributions, operations, assets] = await Promise.all([
    listContributions(),
    listOperations(),
    listAssets(),
  ]);
  const names = getContributors(contributions);
  const assetByTicker = new Map(assets.map((asset) => [asset.ticker, asset]));
  const operationsWithAssets = operations.map((operation) => {
    const asset = assetByTicker.get(operation.ticker);
    return {
      ...operation,
      name: asset?.name || operation.ticker,
      category: asset?.type ?? "",
    };
  });

  return (
    <main className="mx-auto my-4 w-full max-w-2xl rounded-2xl border bg-white/85 px-4 py-8 backdrop-blur-md sm:my-8 sm:px-8 sm:py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Administração
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerenciar contribuições e investimentos.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">Voltar</Link>
        </Button>
      </header>

      <section className="mt-8 rounded-lg border p-5">
        <h2 className="text-lg font-semibold tracking-tight">Contribuições</h2>

        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-medium">Registrar manualmente</h3>
          <ContributionForm names={names} />
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium">Importar extrato Rico</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Em breve — a importação identificará entradas PIX/TED, fará o match
            com o contribuinte e registrará em contribuições.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="mt-3"
          >
            Importar extrato Rico
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-lg border p-5">
        <h2 className="text-lg font-semibold tracking-tight">Investimentos</h2>

        <div className="mt-4 border-t pt-4">
          <h3 className="text-sm font-medium">Importar posição B3</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Importar a posição atual da carteira (XLSX da B3).
          </p>
          <ImportForm />
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium">Importar negociações B3</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Importar o histórico de compras/vendas (XLSX da B3) para calcular o
            custo médio e preencher &quot;Total investido&quot; e &quot;resultado&quot;.
          </p>
          <OperationsImportForm />
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium">Adicionar negociação manualmente</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Registrar uma compra ou venda avulsa — de ações ou Tesouro Direto —
            vale igual à importação pelo Excel.
          </p>
          <OperationForm />
        </div>

        <OperationsManager operations={operationsWithAssets} />
      </section>
    </main>
  );
}
