"use client";

import { useActionState, useEffect, useState } from "react";

import { registerOperation } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function OperationForm() {
  const [state, formAction, pending] = useActionState(registerOperation, {});
  const today = new Date().toISOString().slice(0, 10);
  const [ticker, setTicker] = useState("");
  const [side, setSide] = useState("buy");
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState("");
  const [quote, setQuote] = useState<{ key: string; note: string } | null>(null);
  const treasuryInput = /^(tesouro\b|lft\b|ltn\b|ntn-[bcf]\b|renda\+?\b|educa\+?\b)/i.test(
    ticker.trim(),
  );
  const quoteKey = `${ticker.trim()}|${date}|${side}`;

  useEffect(() => {
    const normalized = ticker.trim();
    if (!treasuryInput || !date) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ ticker: normalized, date, side });
        const response = await fetch(`/api/treasury-price?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("quote unavailable");
        const quote = (await response.json()) as {
          price: number | null;
          referenceDate: string | null;
        };
        if (quote.price == null) {
          setQuote({
            key: `${normalized}|${date}|${side}`,
            note: "Preço não encontrado; informe-o manualmente.",
          });
          return;
        }
        setPrice(String(quote.price));
        setQuote({
          key: `${normalized}|${date}|${side}`,
          note: `Preço oficial preenchido${quote.referenceDate && quote.referenceDate !== date ? ` (referência: ${quote.referenceDate})` : ""}.`,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setQuote({
          key: `${normalized}|${date}|${side}`,
          note: "Não foi possível consultar o preço; informe-o manualmente.",
        });
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [ticker, side, date, treasuryInput]);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ticker">Ticker</Label>
          <Input
            id="ticker"
            name="ticker"
            placeholder="PETR4 ou Tesouro IPCA+ 2035"
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="side">Operação</Label>
          <select
            id="side"
            name="side"
            required
            className={selectClass}
            value={side}
            onChange={(event) => setSide(event.target.value)}
          >
            <option value="buy">Compra</option>
            <option value="sell">Venda</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
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
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        Para Tesouro Direto, informe o título e vencimento (ex.: Tesouro IPCA+ 2035).
        O preço oficial é buscado para a data escolhida; você ainda pode editá-lo.
        {quote?.key === quoteKey ? ` ${quote.note}` : ""}
      </p>

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
