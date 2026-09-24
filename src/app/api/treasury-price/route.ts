import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/session";
import { findTreasuryPrice, isTreasuryTicker } from "@/lib/treasury";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const ticker = request.nextUrl.searchParams.get("ticker")?.trim() ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";
  const side = request.nextUrl.searchParams.get("side");

  if (!isTreasuryTicker(ticker) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ price: null });
  }

  try {
    const quote = await findTreasuryPrice(ticker, date);
    const price = side === "sell" ? quote?.sellPrice : quote?.buyPrice;
    return NextResponse.json({
      price: price ?? null,
      referenceDate: quote?.referenceDate ?? null,
      title: quote?.title ?? null,
    });
  } catch {
    return NextResponse.json({ price: null });
  }
}
