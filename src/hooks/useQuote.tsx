import { useSimulateContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useMemo } from "react";
import { QuoteABIBase } from "@/config/abis/QuoteABIBase";
import { useUniswapContract } from "@/hooks/useUniswapContract";
import { Token } from "@uniswap/sdk-core";
import { PoolKey } from "@uniswap/v4-sdk";

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

  // Construct parameters for quoteExactInputSingle
  const quoteParams = useMemo(() => {
    if (!poolKey.currency0 || !poolKey.currency1) return null;

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
    isRefetching
  } = useSimulateContract({
    address: quoterAddress as `0x${string}`,
    abi: quoterAddress && quoteParams ? QuoteABIBase : [],
    functionName: "quoteExactInputSingle",
    args: quoteParams ? [quoteParams] : [],
    query: {
      enabled: enabled && amountIn > 0n && !!quoterAddress && !!quoteParams,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  });

  // Format the quote result into human-readable token units
  const quotedAmount = useMemo(() => {
    if (isError) {
      console.error("Quote Error:", error);
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
  }, [simulationData, isError, error, toToken.decimals]);

  // Provide a user-friendly error message
  const quoteErrorMessage = useMemo(() => {
    if (!isError) return "";
    if (error && "shortMessage" in error) return error.shortMessage;
    return "Unable to fetch quote for this token pair. Please check the amount or token selection.";
  }, [isError, error]);

  return {
    quotedAmount, // Formatted output token amount
    isLoading, // Loading state for UI skeletons
    isError, // Error flag
    error, // Full error object for debugging
    isRefetching, //Loading state for refetching quote
    refetchQuote, // Function to manually refetch the quote
    quoteErrorMessage, // User-friendly error message to display in UI
  };
}
