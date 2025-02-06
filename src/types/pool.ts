// Define the pool interface
export interface Pool {
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  depositToken: string;
  volume24h: string;
  logoUrl?: string; // Optional logo URL
  currentCycle?: number;
  poolStatus?: "ACTIVE" | "REBALANCING OFFCHAIN" | "REBALANCING ONCHAIN";
  cycleLength?: number;
  rebalanceLength?: number;
  activeLPs?: number;
  totalLiquidity?: number;
  lastCycleActionDateTime?: string;
}
