import { useState, useEffect } from "react";

interface MarketData {
  name: string;
  price: number;
  priceChange: number;
  volume: string;
  error?: string;
}

export function useMarketData(symbol: string) {
  const [marketData, setMarketData] = useState<MarketData>({
    name: "",
    price: 0,
    priceChange: 0,
    volume: "0",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(`/api/yahoo-finance?symbol=${symbol}`);
        if (!response.ok) throw new Error("Failed to fetch market data");

        const data = await response.json();
        const quote = data.chart.result[0];
        const latestPrice = quote.meta.regularMarketPrice;
        const previousClose =
          quote.meta.previousClose || quote.meta.chartPreviousClose;
        const priceChange =
          ((latestPrice - previousClose) / previousClose) * 100;
        const volume =
          quote.indicators.quote[0].volume[
            quote.indicators.quote[0].volume.length - 1
          ];

        setMarketData({
          name: quote.meta.shortName,
          price: latestPrice,
          priceChange: parseFloat(priceChange.toFixed(2)),
          volume: new Intl.NumberFormat("en-US", {
            notation: "compact",
            maximumFractionDigits: 1,
          }).format(volume),
        });
      } catch (error) {
        console.error("Error fetching market data:", error);
        setMarketData((prev) => ({
          ...prev,
          error: "Failed to fetch market data",
        }));
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchMarketData();

    // Then fetch every 15 seconds
    const intervalId = setInterval(fetchMarketData, 15000);

    return () => clearInterval(intervalId);
  }, [symbol]);

  return {
    marketData,
    isLoading,
  };
}
