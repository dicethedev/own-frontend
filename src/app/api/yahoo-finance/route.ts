// app/api/yahoo-finance/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data from Yahoo Finance");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Yahoo Finance API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
