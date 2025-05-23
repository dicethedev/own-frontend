import { Address } from "viem";

// Define the pool interface
export interface Pool {
  address: Address;
  assetTokenSymbol: string; //eg: xTSLA
  assetName: string; // eg: Tesla Inc
  assetSymbol: string; // eg: TSLA
  assetTokenAddress: Address; // Address of the xToken
  assetTokenDecimals: number; // Decimals of the xToken
  assetPrice: number;
  oraclePrice: number;
  priceChange: number;
  reserveToken: string;
  reserveTokenAddress: Address;
  reserveTokenDecimals: number;
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
  activeLPs?: number;
  totalLiquidity?: number;
  poolInterestRate?: bigint;
  poolUtilizationRatio?: bigint;

  // From subgraph
  assetSupply?: bigint;
  reserveBackingAsset?: bigint;
  aggregatePoolReserves?: bigint;
  totalUserDeposits?: bigint;
  totalUserCollateral?: bigint;
  cycleTotalDeposits?: bigint;
  cycleTotalRedemptions?: bigint;
  reserveYieldAccrued?: bigint;

  // LP Manager data
  totalLPLiquidityCommited?: bigint;
  totalLPCollateral?: bigint;
  lpCount?: bigint;
  cycleTotalAddLiquidityAmount?: bigint;
  cycleTotalReduceLiquidityAmount?: bigint;

  // Cycle Manager data
  cycleState: string;
  lastCycleActionDateTime?: bigint;
  cyclePriceHigh?: bigint;
  cyclePriceLow?: bigint;
  cycleInterestAmount?: bigint;
  rebalancedLPs?: bigint;
  prevRebalancePrice?: bigint;

  // Strategy data
  baseInterestRate?: number;
  interestRate1?: number;
  maxInterestRate?: number;
  utilizationTier1?: number;
  utilizationTier2?: number;
  protocolFee?: number;
  FeeRecepient?: Address;
  isYieldBearing?: boolean;

  userHealthyCollateralRatio?: number;
  userLiquidationThreshold?: number;
  lpHealthyCollateralRatio?: number;
  lpLiquidationThreshold?: number;
  lpBaseCollateralRatio?: number;
  lpLiquidationReward?: number;

  rebalanceLength?: number;
  oracleUpdateThreshold?: number;
  haltThreshold?: number;
}

// Fee event
export interface FeeEvent {
  id: string; // tx hash + log index
  pool: Address;
  user: Address;
  amount: bigint;
  timestamp: bigint;
  transactionHash: Address;
  blockNumber: bigint;
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

export enum RebalanceState {
  READY_FOR_OFFCHAIN_REBALANCE = "READY_FOR_OFFCHAIN_REBALANCE",
  OFFCHAIN_REBALANCE_IN_PROGRESS = "OFFCHAIN_REBALANCE_IN_PROGRESS",
  READY_FOR_ONCHAIN_REBALANCE = "READY_FOR_ONCHAIN_REBALANCE",
  ONCHAIN_REBALANCE_IN_PROGRESS = "ONCHAIN_REBALANCE_IN_PROGRESS",
  NOT_READY = "NOT_READY",
}

export interface RebalanceStatusData {
  state: RebalanceState;
  timeUntilNextAction: number;
  nextActionTime: Date | null;
  cycleLength?: bigint;
  rebalanceLength?: bigint;
  cycleState?: string;
  cycleIndex?: bigint;
  assetPrice?: bigint;
  lastCycleActionDateTime?: bigint;
  isLoading?: boolean;
  error?: Error | null;
}

export interface MarketData {
  price: number;
  priceChange: number;
  volume: string;
}

export enum CycleState {
  ACTIVE,
  REBALANCING_OFFCHAIN,
  REBALANCING_ONCHAIN,
  HALTED,
}
