"use client";

import { useActionState } from "react";

import { registerOperation } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function OperationForm() {
  const [state, formAction, pending] = useActionState(registerOperation, {});
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ticker">Ticker</Label>
          <Input id="ticker" name="ticker" placeholder="PETR4" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="side">Operação</Label>
          <select id="side" name="side" required className={selectClass}>
            <option value="buy">Compra</option>
            <option value="sell">Venda</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="any"
            min="0.000001"
            required
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0,00"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-primary" role="status">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Registrar negociação"}
      </Button>
    </form>
  );
}
