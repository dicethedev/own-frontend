import { Address } from "viem";

// Define the pool interface
export interface Pool {
  address: Address;
  tokenSymbol: string;
  name: string;
  symbol: string;
  price: number;
  oraclePrice: number;
  priceChange: number;
  depositToken: string;
  volume24h: string;
  logoUrl?: string; // Optional logo URL
  currentCycle: number;
  poolStatus: "ACTIVE" | "REBALANCING OFFCHAIN" | "REBALANCING ONCHAIN";
  cycleLength?: number;
  rebalanceLength?: number;
  activeLPs?: number;
  totalLiquidity?: number;
  lastCycleActionDateTime: string;
  xTokenSupply: number;
  netReserveDelta: number;
  rebalanceAmount: number;
  totalDepositRequests: number;
  totalRedemptionRequests: number;
}

export enum CycleState {
  ACTIVE,
  REBALANCING_OFFCHAIN,
  REBALANCING_ONCHAIN,
}

export interface MarketData {
  price: number;
  priceChange: number;
  volume: string;
}
