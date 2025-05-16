import { Address } from "viem";

// Define the pool interface
export interface Pool {
  address: Address;
  assetTokenSymbol: string; //eg: xTSLA
  assetName: string; // eg: Tesla Inc
  assetSymbol: string; // eg: TSLA
  assetTokenAddress: Address; // Address of the xToken
  assetPrice: number;
  oraclePrice: number;
  priceChange: number;
  depositToken: string;
  depositTokenAddress: Address;
  liquidityManagerAddress: Address;
  cycleManagerAddress: Address;
  poolStrategyAddress: Address;
  oracleAddress: Address;
  volume24h: string;
  logoUrl?: string; // Optional logo URL
  currentCycle: number;
  poolStatus:
    | "ACTIVE"
    | "REBALANCING OFFCHAIN"
    | "REBALANCING ONCHAIN"
    | "HALTED";
  cycleLength?: number;
  rebalanceLength?: number;
  activeLPs?: number;
  totalLiquidity?: number;
  lastCycleActionDateTime: string;
  xTokenSupply: number;
  rebalanceAmount: number;
  totalDepositRequests: number;
  totalRedemptionRequests: number;
}

export interface PoolEvent {
  pool: Address;
  assetSymbol: string;
  depositToken: Address;
  oracle: Address;
  cycleLength: bigint;
  rebalanceLength: bigint;
  blockNumber: bigint;
}

export enum CycleState {
  ACTIVE,
  REBALANCING_OFFCHAIN,
  REBALANCING_ONCHAIN,
  HALTED,
}

export interface MarketData {
  price: number;
  priceChange: number;
  volume: string;
}

export enum RebalanceState {
  READY_FOR_OFFCHAIN_REBALANCE = "READY_FOR_OFFCHAIN_REBALANCE",
  OFFCHAIN_REBALANCE_IN_PROGRESS = "OFFCHAIN_REBALANCE_IN_PROGRESS",
  READY_FOR_ONCHAIN_REBALANCE = "READY_FOR_ONCHAIN_REBALANCE",
  ONCHAIN_REBALANCE_IN_PROGRESS = "ONCHAIN_REBALANCE_IN_PROGRESS",
  NOT_READY = "NOT_READY",
}
