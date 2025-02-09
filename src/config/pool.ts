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
    address: "0xf6AF07a6d2Fd6551c2eb0f2DA7644F4d5dd0FB65",
    name: "Tesla, Inc.",
    symbol: "TSLA",
    price: 650.75,
    oraclePrice: 650.75,
    priceChange: 2.5,
    depositToken: "USDC",
    volume24h: "$1.2B",
    // logoUrl: "/logos/tesla.png",
    currentCycle: 1,
    poolStatus: "ACTIVE",
    cycleLength: 30,
    rebalanceLength: 5,
    activeLPs: 100,
    totalLiquidity: 1000000,
    lastCycleActionDateTime: new Date().toISOString(),
    xTokenSupply: 1000000,
    netReserveDelta: 100000,
    rebalanceAmount: 1000,
    totalDepositRequests: 100000,
    totalRedemptionRequests: 100000,
  },
  {
    address: "0xf6AF07a6d2Fd6551c2eb0f2DA7644F4d5dd0FB65",
    name: "Apple Inc.",
    symbol: "AAPL",
    price: 145.3,
    oraclePrice: 145.3,
    priceChange: -0.8,
    depositToken: "USDT",
    volume24h: "$980M",
    currentCycle: 2,
    poolStatus: "REBALANCING OFFCHAIN",
    cycleLength: 30,
    rebalanceLength: 5,
    activeLPs: 100,
    totalLiquidity: 1000000,
    lastCycleActionDateTime: new Date().toISOString(),
    xTokenSupply: 1000000,
    netReserveDelta: 100000,
    rebalanceAmount: 1000,
    totalDepositRequests: 100000,
    totalRedemptionRequests: 100000,
  },
  {
    address: "0xf6AF07a6d2Fd6551c2eb0f2DA7644F4d5dd0FB65",
    name: "Amazon.com, Inc.",
    symbol: "AMZN",
    price: 3380.05,
    oraclePrice: 3380.05,
    priceChange: 1.2,
    depositToken: "DAI",
    volume24h: "$1.5B",
    currentCycle: 3,
    poolStatus: "REBALANCING ONCHAIN",
    cycleLength: 30,
    rebalanceLength: 5,
    activeLPs: 100,
    totalLiquidity: 1000000,
    lastCycleActionDateTime: new Date().toISOString(),
    xTokenSupply: 1000000,
    netReserveDelta: 100000,
    rebalanceAmount: 1000,
    totalDepositRequests: 100000,
    totalRedemptionRequests: 100000,
  },
];
