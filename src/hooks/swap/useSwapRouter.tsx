// src/hooks/swap/useSwapRouter.ts
import { useChainId } from "wagmi";
import { useMemo } from "react";
import { Token } from "@uniswap/sdk-core";
import { PoolKey } from "@uniswap/v4-sdk";
import { getPoolVersion } from "@/config/contracts";
import { useSwapV3 } from "./useSwapV3";
import { useSwapV4 } from "./useSwapV4";
import { SwapResult } from "./types";

interface UseSwapRouterParams {
  fromToken: Token;
  toToken: Token;
  userAddress?: `0x${string}`;
  // V4 specific params (used on testnet)
  poolKey?: PoolKey;
  zeroForOne?: boolean;
  // V3 specific params (used on mainnet)
  fee?: number;
}

/**
 * useSwapRouter
 *
 * Unified swap hook that automatically selects V3 or V4 based on the connected chain.
 * - Base Mainnet (8453) → Uses V3
 * - Base Sepolia (84532) → Uses V4
 */
export function useSwapRouter({
  fromToken,
  toToken,
  userAddress,
  poolKey,
  zeroForOne = false,
  fee = 3000,
}: UseSwapRouterParams): SwapResult & { poolVersion: "v3" | "v4" } {
  const chainId = useChainId();
  const poolVersion = getPoolVersion(chainId);

  // V3 swap hook (active on mainnet)
  const v3Swap = useSwapV3({
    fromToken,
    toToken,
    fee,
    userAddress,
  });

  // V4 swap hook (active on testnet)
  // Provide default poolKey if not specified
  const defaultPoolKey: PoolKey = useMemo(() => {
    if (poolKey) return poolKey;

    const token0 =
      fromToken.address.toLowerCase() < toToken.address.toLowerCase()
        ? fromToken.address
        : toToken.address;
    const token1 =
      fromToken.address.toLowerCase() < toToken.address.toLowerCase()
        ? toToken.address
        : fromToken.address;

    return {
      currency0: token0,
      currency1: token1,
      fee: 3000,
      tickSpacing: 60,
      hooks: "0x0000000000000000000000000000000000000000",
    };
  }, [poolKey, fromToken.address, toToken.address]);

  const computedZeroForOne = useMemo(() => {
    if (zeroForOne !== undefined) return zeroForOne;
    return fromToken.address.toLowerCase() < toToken.address.toLowerCase();
  }, [zeroForOne, fromToken.address, toToken.address]);

  const v4Swap = useSwapV4({
    fromToken,
    toToken,
    poolKey: defaultPoolKey,
    zeroForOne: computedZeroForOne,
    userAddress,
  });

  // Return the appropriate swap implementation based on chain
  if (poolVersion === "v3") {
    return {
      ...v3Swap,
      poolVersion: "v3",
    };
  }

  return {
    ...v4Swap,
    poolVersion: "v4",
  };
}

// Re-export types
export type { SwapResult } from "./types";
