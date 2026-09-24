"use client";

import { useActionState } from "react";

import { editOperation, removeOperation } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import type { B3Operation } from "@/lib/supabase/b3";

export type AdminOperation = B3Operation & {
  name: string;
  category: string;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function OperationsManager({ operations }: { operations: AdminOperation[] }) {
  const ordered = [...operations].sort(
    (a, b) => b.operationDate.localeCompare(a.operationDate) || b.id - a.id,
  );

  return (
    <details className="mt-6 rounded-lg border" open={operations.length > 0}>
      <summary className="cursor-pointer px-5 py-4 text-sm font-medium marker:text-muted-foreground">
        Operações registradas ({operations.length})
      </summary>
      <div className="border-t p-5">
        {ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma operação registrada ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {ordered.map((operation) => (
              <li key={operation.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{operation.name}</p>
                    <p className="text-sm text-muted-foreground">{operation.ticker}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {operation.category && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {operation.category}
                      </span>
                    )}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {operation.operationType === "buy" ? "Compra" : "Venda"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {operation.quantity} cotas · {formatBRL(operation.unitPrice)} cada · {formatBRL(operation.totalValue)} · {formatDate(operation.operationDate)}
                </p>
                <div className="mt-3 flex gap-2">
                  <OperationEditDialog operation={operation} />
                  <OperationDeleteDialog operation={operation} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

function OperationEditDialog({ operation }: { operation: AdminOperation }) {
  const [state, formAction, pending] = useActionState(editOperation, {});

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">Editar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar operação</DialogTitle>
          <DialogDescription>
            O custo médio e as posições serão recalculados ao salvar.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={operation.id} />
          <div className="space-y-2">
            <Label htmlFor={`ticker-${operation.id}`}>Ticker</Label>
            <Input id={`ticker-${operation.id}`} name="ticker" defaultValue={operation.ticker} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`side-${operation.id}`}>Operação</Label>
              <select id={`side-${operation.id}`} name="side" defaultValue={operation.operationType} className={selectClass}>
                <option value="buy">Compra</option>
                <option value="sell">Venda</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`date-${operation.id}`}>Data</Label>
              <Input id={`date-${operation.id}`} name="date" type="date" defaultValue={operation.operationDate} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`quantity-${operation.id}`}>Quantidade</Label>
              <Input id={`quantity-${operation.id}`} name="quantity" type="number" step="any" min="0.000001" defaultValue={operation.quantity} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`price-${operation.id}`}>Preço (R$)</Label>
              <Input id={`price-${operation.id}`} name="price" type="number" step="0.01" min="0.01" defaultValue={operation.unitPrice} required />
            </div>
          </div>
          {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          {state.success && <p className="text-sm text-primary" role="status">{state.success}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar alterações"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OperationDeleteDialog({ operation }: { operation: AdminOperation }) {
  const [state, formAction, pending] = useActionState(removeOperation, {});

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">Excluir</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir operação?</DialogTitle>
          <DialogDescription>
            Esta ação remove {operation.ticker} de {formatDate(operation.operationDate)} do histórico e recalcula as posições.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={operation.id} />
          {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
          {state.success && <p className="text-sm text-primary" role="status">{state.success}</p>}
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
