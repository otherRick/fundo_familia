import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Cliente Supabase do servidor (Service Role Key).
 *
 * Retorna `null` quando as variáveis de ambiente não estão definidas, para que
 * o app continue funcionando com os dados locais (JSON) durante a transição.
 *
 * ⚠️ Este cliente usa a Service Role Key e NUNCA deve ser importado/usado no
 * navegador. As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não têm o
 * prefixo NEXT_PUBLIC_, portanto não são expostas ao client.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    client = null;
    return null;
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
