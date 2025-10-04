import { useSimulateContract, useReadContract } from "wagmi";
import { parseUnits, formatUnits, Abi } from "viem";
import { useMemo } from "react";
import { QuoteABIBase } from "@/config/abis/QuoteABIBase";
import { useUniswapContract } from "@/hooks/useUniswapContract";
import { Token } from "@uniswap/sdk-core";
import { PoolKey } from "@uniswap/v4-sdk";
import { StateViewABIBase } from "@/config/abis/StateViewABIBase";
import { getPoolId } from "@/app/(dapp)/createpool/utils";

interface UseQuoteParams {
  fromToken: Token; // Token user wants to swap from
  toToken: Token; // Token user wants to receive
  fromAmount: string; // Input amount as string (from user input)
  poolKey: PoolKey; // Pool identification
  zeroForOne: boolean; // Swap direction flag: true if fromToken is token0
  enabled?: boolean; // Whether to enable the hook (for conditional fetching)
}

/**
 * useQuote
 *
 * Custom React hook to fetch the expected output amount for a swap using
 * Uniswap V4 Quoter contract. This uses wagmi's useSimulateContract to
 * simulate the swap off-chain (callStatic), without executing a real transaction.
 *
 * Handles:
 * - Parsing user input safely
 * - Constructing poolKey and quote parameters
 * - Calling Quoter contract and formatting the result
 * - Error handling and providing a user-friendly message
 */
export function useQuote({
  fromToken,
  toToken,
  fromAmount,
  poolKey,
  zeroForOne,
  enabled = true,
}: UseQuoteParams) {
  // Get the deployed Quoter contract address for the current chain
  const quoterAddress = useUniswapContract("quoter");
  const stateViewContractAddress = useUniswapContract("stateView");

  console.log("poolKey", poolKey);

  const poolId = useMemo(() => {
    return getPoolId(poolKey);
  }, [poolKey]);

  // Check if pool exists by reading slot0
  const {
    data: slot0Data,
    isLoading: isCheckingPool,
    refetch: refetchSlot0,
  } = useReadContract({
    address: stateViewContractAddress as `0x${string}`,
    abi: StateViewABIBase as Abi,
    functionName: "getSlot0",
    args: poolId ? [poolId as `0x${string}`] : undefined,
    query: {
      enabled: enabled && !!poolId && !!stateViewContractAddress,
      retry: 1,
    },
  });

  // Also get liquidity data to understand pool state
  const { data: liquidityData } = useReadContract({
    address: stateViewContractAddress as `0x${string}`,
    abi: StateViewABIBase as Abi,
    functionName: "getLiquidity",
    args: poolId ? [poolId as `0x${string}`] : undefined,
    query: {
      enabled: enabled && !!poolId && !!stateViewContractAddress,
      retry: 1,
    },
  });

  const poolExists = useMemo(() => {
    console.log("slot0Data", slot0Data);
    console.log("liquidityData", liquidityData);
    if (!slot0Data) return false;
    // If slot0 returns data, the pool exists
    return Array.isArray(slot0Data) && slot0Data.length > 0;
  }, [slot0Data, liquidityData]);

  const hasLiquidity = useMemo(() => {
    if (!liquidityData) return false;
    // Check if liquidity is greater than 0
    return BigInt(liquidityData as string) > 0n;
  }, [liquidityData]);

  // Safely parse the user's input amount into BigInt
  const amountIn = useMemo(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return 0n;
    try {
      return parseUnits(fromAmount, fromToken.decimals); // converts to smallest unit
    } catch (err) {
      console.error("Failed to parse fromAmount:", err);
      return 0n;
    }
  }, [fromAmount, fromToken.decimals]);

  // Check if the swap amount is reasonable compared to pool liquidity
  const isAmountReasonable = useMemo(() => {
    if (!liquidityData || !amountIn) return true; // Allow if we can't check

    const liquidity = BigInt(liquidityData as string);
    // Don't allow swaps larger than 10% of pool liquidity
    const maxSwapAmount = liquidity / 10n;

    console.log("Liquidity check:", {
      liquidity: liquidity.toString(),
      amountIn: amountIn.toString(),
      maxSwapAmount: maxSwapAmount.toString(),
      isReasonable: amountIn <= maxSwapAmount,
    });

    return amountIn <= maxSwapAmount;
  }, [liquidityData, amountIn]);

  // Construct parameters for quoteExactInputSingle
  const quoteParams = useMemo(() => {
    if (!poolKey.currency0 || !poolKey.currency1) return null;

    console.log("Quote params:", {
      poolKey: {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
      },
      zeroForOne,
      exactAmount: amountIn.toString(),
      hookData: "0x",
    });

    return {
      poolKey: {
        currency0: poolKey.currency0 as `0x${string}`,
        currency1: poolKey.currency1 as `0x${string}`,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks as `0x${string}`,
      },
      zeroForOne,
      exactAmount: amountIn,
      hookData: "0x" as `0x${string}`, // Empty hookData
    };
  }, [poolKey, zeroForOne, amountIn]);

  // Call the Quoter contract using wagmi's simulateContract
  const {
    data: simulationData,
    isError,
    isLoading,
    error,
    refetch: refetchQuote,
    isRefetching,
  } = useSimulateContract({
    address: quoterAddress as `0x${string}`,
    abi: quoterAddress && quoteParams ? QuoteABIBase : [],
    functionName: "quoteExactInputSingle",
    args: quoteParams ? [quoteParams] : [],
    query: {
      enabled:
        enabled &&
        amountIn > 0n &&
        !!quoterAddress &&
        !!quoteParams &&
        poolExists &&
        hasLiquidity &&
        isAmountReasonable,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  });

  // Format the quote result into human-readable token units
  const quotedAmount = useMemo(() => {
    if (isError) {
      console.error("Quote Error:", error);
      console.error("Error details:", {
        error,
        poolExists,
        slot0Data,
        liquidityData,
        quoteParams,
      });
      return ""; // blank or fallback
    }

    if (!simulationData?.result) return "";

    try {
      const [amountOut] = simulationData.result as [bigint, bigint];
      return formatUnits(amountOut, toToken.decimals);
    } catch (err) {
      console.error("Error parsing quote result:", err);
      return "";
    }
  }, [
    simulationData,
    isError,
    error,
    toToken.decimals,
    poolExists,
    slot0Data,
    liquidityData,
    quoteParams,
  ]);

  // Provide a user-friendly error message
  const quoteErrorMessage = useMemo(() => {
    if (!poolExists && !isCheckingPool) {
      return "Pool does not exist.";
    }
    if (isCheckingPool) {
      return "Checking if pool exists...";
    }
    if (poolExists && !hasLiquidity) {
      return "Pool has no liquidity.";
    }
    if (poolExists && hasLiquidity && !isAmountReasonable) {
      return "Swap amount is too large for current pool liquidity. Please try a smaller amount.";
    }
    if (!isError) return "";
    if (error && "shortMessage" in error) return error.shortMessage;
    return "Unable to fetch quote for this token pair. Please check the amount or token selection.";
  }, [
    isError,
    error,
    poolExists,
    isCheckingPool,
    hasLiquidity,
    isAmountReasonable,
  ]);

  return {
    quotedAmount, // Formatted output token amount
    isLoading: isLoading || isCheckingPool, // Loading state for UI skeletons
    isError, // Error flag
    error, // Full error object for debugging
    isRefetching, //Loading state for refetching quote
    refetchQuote, // Function to manually refetch the quote
    quoteErrorMessage, // User-friendly error message to display in UI
    poolExists, // Whether the pool exists
    hasLiquidity, // Whether the pool has liquidity
    isAmountReasonable, // Whether the swap amount is reasonable for pool liquidity
    isCheckingPool, // Whether we're checking if pool exists
    refetchSlot0, // Function to manually refetch the slot0 data
  };
}
