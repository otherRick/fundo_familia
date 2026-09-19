"use server";

import { revalidatePath } from "next/cache";

import { parsePositionXlsx } from "@/lib/b3/position-xlsx";
import { isAuthenticated } from "@/lib/session";
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

