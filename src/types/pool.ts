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
    | "REBALANCING_OFFCHAIN"
    | "REBALANCING_ONCHAIN"
    | "HALTED";
  cycleLength?: number;
  rebalanceLength?: number;
  activeLPs?: number;
  totalLiquidity?: number;
  xTokenSupply?: number;

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
  cycleState?: string;
  lastCycleActionDateTime?: bigint;
  cyclePriceHigh?: bigint;
  cyclePriceLow?: bigint;
  cycleInterestAmount?: bigint;
  rebalancedLPs?: bigint;
  prevRebalancePrice?: bigint;
}

// User position in the protocol
export interface UserPosition {
  id: string; // user address + pool address
  user: Address;
  pool: Address;
  assetAmount: bigint;
  depositAmount: bigint;
  collateralAmount: bigint;
  createdAt: bigint;
  updatedAt: bigint;
}

// User request
export interface UserRequest {
  id: string; // user address + pool address + requestCycle
  requestType: string; // NONE, DEPOSIT, REDEEM, LIQUIDATE
  amount: bigint;
  collateralAmount: bigint;
  requestCycle: bigint;
  liquidator?: Address; // only set if requestType is LIQUIDATE
  createdAt: bigint;
  updatedAt: bigint;
}

// LP position
export interface LPPosition {
  id: string; // lp address + pool address
  lp: Address;
  pool: Address;
  liquidityCommitment: bigint;
  collateralAmount: bigint;
  interestAccrued: bigint;
  liquidityHealth: number; // 3 = Healthy, 2 = Warning, 1 = Liquidatable
  assetShare: bigint;
  lastRebalanceCycle: bigint;
  lastRebalancePrice: bigint;
  createdAt: bigint;
  updatedAt: bigint;
}

// LP request
export interface LPRequest {
  id: string; // lp address + pool address + requestCycle
  requestType: string; // NONE, ADD_LIQUIDITY, REDUCE_LIQUIDITY, LIQUIDATE
  requestAmount: bigint;
  requestCycle: bigint;
  liquidator?: Address; // only set if requestType is LIQUIDATE
  createdAt: bigint;
  updatedAt: bigint;
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
