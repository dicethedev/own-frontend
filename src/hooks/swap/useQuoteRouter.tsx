// src/hooks/swap/useQuoteRouter.ts
import { useChainId } from "wagmi";
import { useMemo } from "react";
import { Token } from "@uniswap/sdk-core";
import { PoolKey } from "@uniswap/v4-sdk";
import { getPoolVersion } from "@/config/contracts";
import { useQuoteV3 } from "./useQuoteV3";
import { useQuoteV4 } from "./useQuoteV4";
import { QuoteResult } from "./types";

interface UseQuoteRouterParams {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  enabled?: boolean;
  // V4 specific params (used on testnet)
  poolKey?: PoolKey;
  zeroForOne?: boolean;
  // V3 specific params (used on mainnet)
  fee?: number;
}

/**
 * useQuoteRouter
 *
 * Unified quote hook that automatically selects V3 or V4 based on the connected chain.
 * - Base Mainnet (8453) → Uses V3 QuoterV2
 * - Base Sepolia (84532) → Uses V4 Quoter
 */
export function useQuoteRouter({
  fromToken,
  toToken,
  fromAmount,
  enabled = true,
  poolKey,
  zeroForOne,
  fee = 3000,
}: UseQuoteRouterParams): QuoteResult & { poolVersion: "v3" | "v4" } {
  const chainId = useChainId();
  const poolVersion = getPoolVersion(chainId);

  // Compute default poolKey for V4 if not provided
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

  // Compute zeroForOne for V4 if not provided
  const computedZeroForOne = useMemo(() => {
    if (zeroForOne !== undefined) return zeroForOne;
    return fromToken.address.toLowerCase() < toToken.address.toLowerCase();
  }, [zeroForOne, fromToken.address, toToken.address]);

  // V3 quote hook (active on mainnet)
  const v3Quote = useQuoteV3({
    fromToken,
    toToken,
    fromAmount,
    fee,
    enabled: enabled && poolVersion === "v3",
  });

  // V4 quote hook (active on testnet)
  const v4Quote = useQuoteV4({
    fromToken,
    toToken,
    fromAmount,
    poolKey: defaultPoolKey,
    zeroForOne: computedZeroForOne,
    enabled: enabled && poolVersion === "v4",
  });

  // Return the appropriate quote implementation based on chain
  if (poolVersion === "v3") {
    return {
      ...v3Quote,
      poolVersion: "v3",
    };
  }

  return {
    ...v4Quote,
    poolVersion: "v4",
  };
}

// Re-export types
export type { QuoteResult } from "./types";
