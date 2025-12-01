// src/constants/comingSoonPools.ts
import { Pool } from "@/types/pool";
import { Address } from "viem";

// Placeholder address for coming soon pools
const PLACEHOLDER_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;

export type ComingSoonPool = Omit<
  Pool,
  | "address"
  | "reserveTokenAddress"
  | "assetTokenAddress"
  | "liquidityManagerAddress"
  | "cycleManagerAddress"
  | "poolStrategyAddress"
  | "oracleAddress"
> & {
  address: Address;
  comingSoon: true;
  category: "index" | "stock";
};

export const COMING_SOON_POOLS: ComingSoonPool[] = [
  {
    address: PLACEHOLDER_ADDRESS,
    assetTokenSymbol: "SPY",
    assetName: "S&P 500 Index",
    assetSymbol: "SPY",
    assetPrice: 594.5,
    oraclePrice: 594.5,
    priceChange: 0.42,
    reserveToken: "USDC",
    reserveTokenDecimals: 6,
    assetTokenDecimals: 18,
    volume24h: "0",
    currentCycle: 0,
    poolStatus: "ACTIVE",
    cycleState: "INACTIVE",
    comingSoon: true,
    category: "index",
    aggregatePoolReserves: BigInt(200000000000),
  },
  {
    address: PLACEHOLDER_ADDRESS,
    assetTokenSymbol: "NVDA",
    assetName: "NVIDIA Corporation",
    assetSymbol: "NVDA",
    assetPrice: 131.28,
    oraclePrice: 131.28,
    priceChange: 1.24,
    reserveToken: "USDC",
    reserveTokenDecimals: 6,
    assetTokenDecimals: 18,
    volume24h: "0",
    currentCycle: 0,
    poolStatus: "ACTIVE",
    cycleState: "INACTIVE",
    comingSoon: true,
    category: "stock",
    aggregatePoolReserves: BigInt(75000000000),
  },
  {
    address: PLACEHOLDER_ADDRESS,
    assetTokenSymbol: "TSLA",
    assetName: "Tesla, Inc.",
    assetSymbol: "TSLA",
    assetPrice: 352.56,
    oraclePrice: 352.56,
    priceChange: -0.87,
    reserveToken: "USDC",
    reserveTokenDecimals: 6,
    assetTokenDecimals: 18,
    volume24h: "0",
    currentCycle: 0,
    poolStatus: "ACTIVE",
    cycleState: "INACTIVE",
    comingSoon: true,
    category: "stock",
    aggregatePoolReserves: BigInt(100000000000),
  },
  {
    address: PLACEHOLDER_ADDRESS,
    assetTokenSymbol: "AAPL",
    assetName: "Apple Inc.",
    assetSymbol: "AAPL",
    assetPrice: 237.33,
    oraclePrice: 237.33,
    priceChange: 0.15,
    reserveToken: "USDC",
    reserveTokenDecimals: 6,
    assetTokenDecimals: 18,
    volume24h: "0",
    currentCycle: 0,
    poolStatus: "ACTIVE",
    cycleState: "INACTIVE",
    comingSoon: true,
    category: "stock",
    aggregatePoolReserves: BigInt(50000000000),
  },
];

// Helper to get indices (AI7 is also an index)
export const INDEX_SYMBOLS = ["AI7", "SPY"];
export const STOCK_SYMBOLS = ["NVDA", "TSLA", "AAPL"];

export const isIndexPool = (symbol: string): boolean => {
  return INDEX_SYMBOLS.includes(symbol.toUpperCase());
};
