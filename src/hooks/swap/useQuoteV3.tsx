// src/hooks/swap/useQuoteV3.ts
import { useReadContract, useSimulateContract } from "wagmi";
import { parseUnits, formatUnits, getAddress } from "viem";
import { useMemo } from "react";
import { QuoterV3ABI } from "@/config/abis/QuoterV3ABI";
import {
  UniswapV3PoolABI,
  UniswapV3FactoryABI,
} from "@/config/abis/UniswapV3PoolABI";
import { UseQuoteV3Params, QuoteResult } from "./types";
import { useUniswapContract } from "./useUniswapContract";

const V3_FEE = 3000; // 0.3%

/**
 * useQuoteV3
 *
 * Custom React hook to fetch the expected output amount for a swap using
 * Uniswap V3 QuoterV2 contract. Also checks pool existence and liquidity.
 */
export function useQuoteV3({
  fromToken,
  toToken,
  fromAmount,
  fee = V3_FEE,
  enabled = true,
}: UseQuoteV3Params): QuoteResult {
  const quoterAddress = useUniswapContract("quoter") as `0x${string}`;
  const factoryAddress = useUniswapContract("factory") as `0x${string}`;

  // Sort tokens to get correct order for factory lookup
  const [token0, token1] = useMemo(() => {
    const addr0 = getAddress(fromToken.address);
    const addr1 = getAddress(toToken.address);
    return addr0.toLowerCase() < addr1.toLowerCase()
      ? [addr0, addr1]
      : [addr1, addr0];
  }, [fromToken.address, toToken.address]);

  // Step 1: Get pool address from factory
  const {
    data: poolAddress,
    isLoading: isLoadingPool,
    refetch: refetchPool,
  } = useReadContract({
    address: factoryAddress,
    abi: UniswapV3FactoryABI,
    functionName: "getPool",
    args: [token0, token1, fee],
    query: {
      enabled: enabled && !!factoryAddress && !!token0 && !!token1,
    },
  });

  const poolExists = useMemo(() => {
    return (
      !!poolAddress &&
      poolAddress !== "0x0000000000000000000000000000000000000000"
    );
  }, [poolAddress]);

  // Step 2: Check pool slot0 (to verify it's initialized)
  const { data: slot0Data, isLoading: isLoadingSlot0 } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: UniswapV3PoolABI,
    functionName: "slot0",
    query: {
      enabled: enabled && poolExists,
    },
  });

  // Step 3: Check pool liquidity
  const { data: liquidityData, isLoading: isLoadingLiquidity } =
    useReadContract({
      address: poolAddress as `0x${string}`,
      abi: UniswapV3PoolABI,
      functionName: "liquidity",
      query: {
        enabled: enabled && poolExists,
      },
    });

  const hasLiquidity = useMemo(() => {
    if (!liquidityData) return false;
    return BigInt(liquidityData.toString()) > 0n;
  }, [liquidityData]);

  const isPoolInitialized = useMemo(() => {
    if (!slot0Data) return false;
    // slot0[0] is sqrtPriceX96 - if it's 0, pool is not initialized
    const sqrtPriceX96 = slot0Data[0] as bigint;
    return sqrtPriceX96 > 0n;
  }, [slot0Data]);

  // Parse input amount
  const parsedAmount = useMemo(() => {
    if (
      !fromAmount ||
      isNaN(parseFloat(fromAmount)) ||
      parseFloat(fromAmount) <= 0
    ) {
      return null;
    }
    try {
      return parseUnits(fromAmount, fromToken.decimals);
    } catch {
      return null;
    }
  }, [fromAmount, fromToken.decimals]);

  // Step 4: Get quote from QuoterV2
  const {
    data: quoteData,
    isLoading: isLoadingQuote,
    error: quoteError,
    refetch: refetchQuote,
    isRefetching,
  } = useSimulateContract({
    address: quoterAddress,
    abi: QuoterV3ABI,
    functionName: "quoteExactInputSingle",
    args: [
      {
        tokenIn: getAddress(fromToken.address),
        tokenOut: getAddress(toToken.address),
        amountIn: parsedAmount ?? 0n,
        fee: fee,
        sqrtPriceLimitX96: 0n, // No price limit
      },
    ],
    query: {
      enabled:
        enabled &&
        poolExists &&
        isPoolInitialized &&
        hasLiquidity &&
        !!parsedAmount &&
        parsedAmount > 0n,
    },
  });

  // Format the quoted amount
  const quotedAmount = useMemo(() => {
    if (!quoteData?.result) return null;
    // quoteExactInputSingle returns [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate]
    const amountOut = quoteData.result[0] as bigint;
    return formatUnits(amountOut, toToken.decimals);
  }, [quoteData, toToken.decimals]);

  // Determine error message
  const quoteErrorMessage = useMemo(() => {
    if (!enabled) return null;
    if (!fromAmount || parseFloat(fromAmount) <= 0) return null;

    if (isLoadingPool || isLoadingSlot0 || isLoadingLiquidity) {
      return null; // Still loading
    }

    if (!poolExists) {
      return "Pool does not exist for this token pair";
    }

    if (!isPoolInitialized) {
      return "Pool is not initialized";
    }

    if (!hasLiquidity) {
      return "Pool has no liquidity";
    }

    if (quoteError) {
      const errorMessage = (quoteError as Error)?.message || "";
      if (errorMessage.includes("insufficient")) {
        return "Insufficient liquidity for this trade";
      }
      return "Unable to get quote. Try a smaller amount.";
    }

    return null;
  }, [
    enabled,
    fromAmount,
    isLoadingPool,
    isLoadingSlot0,
    isLoadingLiquidity,
    poolExists,
    isPoolInitialized,
    hasLiquidity,
    quoteError,
  ]);

  const isLoading =
    isLoadingPool || isLoadingSlot0 || isLoadingLiquidity || isLoadingQuote;

  return {
    quotedAmount,
    isLoading,
    quoteErrorMessage,
    refetchQuote: () => {
      refetchPool();
      refetchQuote();
    },
    isRefetching,
    poolExists,
    hasLiquidity,
  };
}
