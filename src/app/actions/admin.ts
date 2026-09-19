"use server";

import { revalidatePath } from "next/cache";

import { normalizeOperations } from "@/lib/b3/operations";
import { parsePositionXlsx } from "@/lib/b3/position-xlsx";
import { readXlsxRows } from "@/lib/b3/xlsx";
import { isAuthenticated } from "@/lib/session";
import { syncAssets } from "@/lib/supabase/assets";
import {
  consolidateAndUpsertPositions,
  insertOperations,
} from "@/lib/supabase/b3";
import { insertContribution } from "@/lib/supabase/contributions";
import { syncPositions } from "@/lib/supabase/positions";

export type AdminState = {
  error?: string;
  success?: string;
};

/** Registra uma nova contribuição em `contributions` (server-only). */
export async function registerContribution(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAuthenticated())) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const rawPerson = formData.get("personName");
  const rawNewPerson = formData.get("newPersonName");
  const rawAmount = formData.get("amount");
  const rawDate = formData.get("date");

  let personName = typeof rawPerson === "string" ? rawPerson.trim() : "";
  if (personName === "__new__") {
    personName = typeof rawNewPerson === "string" ? rawNewPerson.trim() : "";
  }

  const amount =
    typeof rawAmount === "string" ? Number(rawAmount.replace(",", ".")) : NaN;
  const date = typeof rawDate === "string" ? rawDate : "";

  if (!personName) return { error: "Informe a pessoa." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Informe um valor válido (maior que zero)." };
  }
  if (!date) return { error: "Informe a data." };

  try {
    await insertContribution({ personName, amount, date });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao salvar a contribuição.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return { success: `Contribuição de ${personName} registrada.` };
}

/** Importa o XLSX de posição da B3 (abas Acoes e Fundo de Investimento). */
export async function importB3(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAuthenticated())) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { error: "Selecione um arquivo XLSX." };
  }

  let result;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    result = parsePositionXlsx(buffer);
  } catch {
    return {
      error: "Não foi possível ler o arquivo. Verifique se é um XLSX da B3.",
    };
  }

  if (result.sheetsFound.length < 2) {
    return {
      error: `Arquivo inválido: esperado as abas "Acoes" e "Fundo de Investimento". Encontradas: ${result.sheetsFound.join(", ") || "nenhuma"}.`,
    };
  }
  if (result.positions.length === 0) {
    return { error: "Nenhum ativo encontrado nas abas do arquivo." };
  }

  try {
    const { removed } = await syncPositions(result.positions);
    await syncAssets(result.positions.map((p) => p.ticker));

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: `${result.positions.length} ativos importados${removed > 0 ? ` · ${removed} removidos` : ""}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro ao importar o XLSX.",
    };
  }
}

/** Importa o XLSX de negociações da B3 e recalcula o custo médio. */
export async function importOperationsB3(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAuthenticated())) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { error: "Selecione um arquivo XLSX." };
  }

  let operations;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    operations = normalizeOperations(readXlsxRows(buffer));
  } catch {
    return {
      error:
        "Não foi possível ler o arquivo. Verifique se é um XLSX de negociações da B3.",
    };
  }

  if (operations.length === 0) {
    return {
      error:
        "Nenhuma negociação encontrada. Verifique as colunas: Data do Negócio, Tipo de Movimentação, Código de Negociação, Quantidade, Preço e Valor da Operação.",
    };
  }

  try {
    const inserted = await insertOperations(
      operations.map((op) => ({
        ticker: op.ticker,
        operationType: op.side,
        quantity: op.quantity,
        unitPrice: op.price,
        totalValue: op.value,
        operationDate: op.date,
        source: "xlsx",
      })),
    );
    const { updated, removed } = await consolidateAndUpsertPositions();

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: `${inserted} negociações importadas · ${updated} posições atualizadas${removed > 0 ? ` · ${removed} removidas` : ""}`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao importar negociações.",
    };
  }
}

/** Registra manualmente uma negociação (compra/venda) e recalcula o custo médio. */
export async function registerOperation(
  _prevState: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await isAuthenticated())) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const rawTicker = formData.get("ticker");
  const rawSide = formData.get("side");
  const rawDate = formData.get("date");
  const rawQuantity = formData.get("quantity");
  const rawPrice = formData.get("price");

  let ticker =
    typeof rawTicker === "string"
      ? rawTicker.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
      : "";
  // Remove o "F" de tickers fracionários (ex.: PETR4F -> PETR4).
  if (/^[A-Z]{4,6}\d{1,3}F$/.test(ticker)) ticker = ticker.slice(0, -1);

  const side: "buy" | "sell" | null =
    rawSide === "buy" || rawSide === "sell" ? rawSide : null;
  const date = typeof rawDate === "string" ? rawDate : "";
  const quantity =
    typeof rawQuantity === "string" ? Number(rawQuantity.replace(",", ".")) : NaN;
  const price =
    typeof rawPrice === "string" ? Number(rawPrice.replace(",", ".")) : NaN;

  if (!/^[A-Z]{4,6}\d{1,3}$/.test(ticker)) {
    return { error: "Informe um ticker válido (ex.: PETR4)." };
  }
  if (!side) return { error: "Informe o tipo de operação (compra ou venda)." };
  if (!date) return { error: "Informe a data." };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Informe uma quantidade válida." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Informe um preço válido." };
  }

  const totalValue = Math.round((quantity * price + Number.EPSILON) * 100) / 100;

  try {
    const inserted = await insertOperations([
      {
        ticker,
        operationType: side,
        quantity,
        unitPrice: price,
        totalValue,
        operationDate: date,
        source: "manual",
      },
    ]);
    const { updated } = await consolidateAndUpsertPositions();

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    if (inserted === 0) {
      return { success: "Operação já registrada anteriormente." };
    }
    return { success: `Negociação de ${ticker} registrada · ${updated} posições atualizadas.` };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Erro ao registrar a operação.",
    };
  }
}

