import { useState, useEffect } from "react";

interface MarketData {
  name: string;
  price: number;
  priceChange: number;
  volume: string;
  error?: string;
}

export async function fetchMarketData(symbol: string): Promise<MarketData> {
  try {
    const response = await fetch(`/api/yahoo-finance?symbols=${symbol}`);
    if (!response.ok) throw new Error("Failed to fetch market data");

    const data = await response.json();

    // API returns { [symbol]: { name, price, priceChange, volume } }
    const quote = data[symbol];

    if (!quote) {
      throw new Error(`No data found for symbol: ${symbol}`);
    }

    return {
      name: quote.name,
      price: quote.price,
      priceChange: quote.priceChange,
      volume: quote.volume,
    };
  } catch (error) {
    console.error("Error fetching market data:", error);
    return {
      name: "",
      price: 0,
      priceChange: 0,
      volume: "0",
      error: "Failed to fetch market data",
    };
  }
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
    if (!symbol) return; // If no symbol is provided, skip fetching data

    const updateMarketData = async () => {
      setIsLoading(true);
      const data = await fetchMarketData(symbol);
      setMarketData(data);
      setIsLoading(false);
    };

    // Fetch immediately
    updateMarketData();

    // Then fetch every 60 seconds
    const intervalId = setInterval(updateMarketData, 60000);

    return () => clearInterval(intervalId);
  }, [symbol]);

  return {
    marketData,
    isLoading,
  };
}

export async function fetchBatchMarketData(
  symbols: string[]
): Promise<Record<string, MarketData>> {
  try {
    // Create a comma-separated list of symbols
    const symbolsString = symbols.join(",");

    // Make a single API call for all symbols
    const response = await fetch(`/api/yahoo-finance?symbols=${symbolsString}`);
    if (!response.ok) throw new Error("Failed to fetch batch market data");

    const data = await response.json();
    return data; // This would return a map of symbol to market data
  } catch (error) {
    console.error("Error fetching batch market data:", error);
    throw error;
  }
}
