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

export const testPoolData: Pool[] = [
  {
    address: "0xf6AF07a6d2Fd6551c2eb0f2DA7644F4d5dd0FB65",
    assetTokenSymbol: "xTSLA",
    assetName: "Tesla, Inc.",
    assetSymbol: "TSLA",
    assetPrice: 650.75,
    oraclePrice: 650.75,
    priceChange: 2.5,
    depositToken: "USDC",
    depositTokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    assetTokenAddress: "0x21b1A0B2fC0fE2A91fCf7f2f6f4fEe7fFfDc0fFf",
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
    assetTokenSymbol: "xAAPL",
    assetName: "Apple Inc.",
    assetSymbol: "AAPL",
    assetPrice: 145.3,
    oraclePrice: 145.3,
    priceChange: -0.8,
    depositToken: "USDT",
    depositTokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    assetTokenAddress: "0x21b1A0B2fC0fE2A91fCf7f2f6f4fEe7fFfDc0fFf",
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
    assetTokenSymbol: "xAMZN",
    assetName: "Amazon.com, Inc.",
    assetSymbol: "AMZN",
    assetPrice: 3380.05,
    oraclePrice: 3380.05,
    priceChange: 1.2,
    depositToken: "DAI",
    depositTokenAddress: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    assetTokenAddress: "0x21b1A0B2fC0fE2A91fCf7f2f6f4fEe7fFfDc0fFf",
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
