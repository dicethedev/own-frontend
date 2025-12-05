// src/hooks/swap/index.ts

// Unified hooks (recommended for use in components)
export { useSwapRouter } from "./useSwapRouter";
export { useQuoteRouter } from "./useQuoteRouter";

// V3 specific hooks
export { useQuoteV3 } from "./useQuoteV3";
export { useSwapV3 } from "./useSwapV3";

// V4 specific hooks
export { useQuoteV4 } from "./useQuoteV4";
export { useSwapV4 } from "./useSwapV4";
export { usePoolLiquidityV4 } from "./usePoolLiquidityV4";

// Types
export type {
  QuoteResult,
  SwapResult,
  PoolLiquidityResult,
  UseQuoteParams,
  UseSwapParams,
  UseQuoteV3Params,
  UseQuoteV4Params,
  UseSwapV3Params,
  UseSwapV4Params,
  V3PoolConfig,
  V4PoolConfig,
  UnifiedPoolConfig,
} from "./types";
