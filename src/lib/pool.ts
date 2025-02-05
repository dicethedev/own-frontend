import { Pool } from "@/types/pool";

export async function getPoolData(symbol: string) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const pool = pools.find(
    (p) => p.symbol.toLowerCase() === symbol.toLowerCase()
  );

  if (!pool) {
    throw new Error(`Pool with symbol ${symbol} not found`);
  }
  return pool;
}

export const pools: Pool[] = [
  {
    name: "Tesla, Inc.",
    symbol: "TSLA",
    price: 650.75,
    priceChange: 2.5,
    depositToken: "USDC",
    volume24h: "$1.2B",
    // logoUrl: "/logos/tesla.png",
  },
  {
    name: "Apple Inc.",
    symbol: "AAPL",
    price: 145.3,
    priceChange: -0.8,
    depositToken: "USDT",
    volume24h: "$980M",
  },
  {
    name: "Amazon.com, Inc.",
    symbol: "AMZN",
    price: 3380.05,
    priceChange: 1.2,
    depositToken: "DAI",
    volume24h: "$1.5B",
  },
];
