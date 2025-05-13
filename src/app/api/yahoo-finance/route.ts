import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json(
      { error: "Symbols parameter is required" },
      { status: 400 }
    );
  }

  const symbolsArray = symbols.split(",");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Record<string, any> = {};

  try {
    // Create promises for all symbols
    const promises = symbolsArray.map(async (symbol) => {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${symbol}`);
      }

      const data = await response.json();
      const quote = data.chart.result[0];
      const latestPrice = quote.meta.regularMarketPrice;
      const previousClose =
        quote.meta.previousClose || quote.meta.chartPreviousClose;
      const priceChange = ((latestPrice - previousClose) / previousClose) * 100;
      const volume =
        quote.indicators.quote[0].volume[
          quote.indicators.quote[0].volume.length - 1
        ];

      results[symbol] = {
        name: quote.meta.shortName,
        price: latestPrice,
        priceChange: parseFloat(priceChange.toFixed(2)),
        volume: new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(volume),
      };
    });

    // Wait for all requests to complete
    await Promise.all(promises);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Yahoo Finance API batch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
