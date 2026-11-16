import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.error("Supabase heartbeat: configuração ausente.");
    return Response.json({ ok: false }, { status: 503 });
  }

  try {
    const { error } = await supabase.from("contributions").select("id").limit(1);
    if (error) {
      console.error("Supabase heartbeat: consulta falhou:", error.code);
      return Response.json({ ok: false }, { status: 503 });
    }

    return Response.json({ ok: true });
  } catch {
    console.error("Supabase heartbeat: falha de conexão.");
    return Response.json({ ok: false }, { status: 503 });
  }
}
