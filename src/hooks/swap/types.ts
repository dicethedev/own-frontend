// src/hooks/swap/types.ts
import { Token } from "@uniswap/sdk-core";
import { PoolKey } from "@uniswap/v4-sdk";

// V3 Pool configuration
export interface V3PoolConfig {
  tokenA: `0x${string}`;
  tokenB: `0x${string}`;
  fee: number; // 500, 3000, 10000
}

// V4 Pool configuration (using PoolKey from SDK)
export type V4PoolConfig = PoolKey;

// Unified pool config that works for both versions
export type UnifiedPoolConfig =
  | { version: "v3"; config: V3PoolConfig }
  | { version: "v4"; config: V4PoolConfig };

// Common quote parameters
export interface BaseQuoteParams {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  enabled?: boolean;
}

// V3-specific quote params
export interface UseQuoteV3Params extends BaseQuoteParams {
  fee?: number; // defaults to 3000 (0.3%)
}

// V4-specific quote params
export interface UseQuoteV4Params extends BaseQuoteParams {
  poolKey: PoolKey;
  zeroForOne: boolean;
}

// Unified quote params
export interface UseQuoteParams extends BaseQuoteParams {
  // V4 specific (optional, used when on V4 chain)
  poolKey?: PoolKey;
  zeroForOne?: boolean;
  // V3 specific (optional, used when on V3 chain)
  fee?: number;
}

// Quote result
export interface QuoteResult {
  quotedAmount: string | null;
  isLoading: boolean;
  quoteErrorMessage: string | null;
  refetchQuote: () => void;
  isRefetching: boolean;
  poolExists: boolean;
  hasLiquidity: boolean;
}

// Common swap parameters
export interface BaseSwapParams {
  fromToken: Token;
  toToken: Token;
  userAddress?: `0x${string}`;
}

// V3-specific swap params
export interface UseSwapV3Params extends BaseSwapParams {
  fee?: number;
}

// V4-specific swap params
export interface UseSwapV4Params extends BaseSwapParams {
  poolKey: PoolKey;
  zeroForOne: boolean;
}

// Unified swap params
export interface UseSwapParams extends BaseSwapParams {
  // V4 specific
  poolKey?: PoolKey;
  zeroForOne?: boolean;
  // V3 specific
  fee?: number;
}

// Swap execution result
export interface SwapResult {
  executeSwap: (
    amountIn: string,
    minAmountOut: string
  ) => Promise<`0x${string}` | undefined>;
  isPending: boolean;
  isApprovalPending: boolean;
  approvalConfirmed: boolean;
  isPermit2ApprovalPending: boolean;
  permit2ApprovalConfirmed: boolean;
  isSwapPending: boolean;
  swapConfirmed: boolean;
  swapIsError: boolean;
  isError: boolean;
  errorMessage: string | null;
  resetSwapState: () => void;
  resetSwapStateWhileProcessing: () => void;
  needsERC20Approval: (amount: string | bigint) => boolean;
  needsPermit2Approval: (amount: string | bigint) => boolean;
  isProcessing: boolean;
}

// Pool liquidity result
export interface PoolLiquidityResult {
  liquidity: bigint | null;
  isLoading: boolean;
  error: Error | null;
  poolExists: boolean;
  poolAddress?: `0x${string}`;
}
