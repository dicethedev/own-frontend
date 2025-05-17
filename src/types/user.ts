import { Address } from "viem";

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

export interface UserData {
  isUser: boolean;
  userPosition: UserPosition | null;
  userRequest: UserRequest | null;
  isLoading: boolean;
  error: Error | null;
}
