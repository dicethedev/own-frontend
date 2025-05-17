import { Address } from "viem";

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

export interface LPData {
  isLP: boolean;
  lpPosition: LPPosition | null;
  lpRequest: LPRequest | null;
  isLoading: boolean;
  error: Error | null;
}
