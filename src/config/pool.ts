import { Pool } from "@/types/pool";

export async function getPoolData(symbol: string) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const pool = testPoolData.find(
    (p) => p.assetSymbol.toLowerCase() === symbol.toLowerCase()
  );

  if (!pool) {
    throw new Error(`Pool with symbol ${symbol} not found`);
  }
  return pool;
}

const testPoolData: Pool[] = [];
