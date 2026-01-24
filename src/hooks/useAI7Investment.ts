// src/hooks/useAI7Investment.ts
import { useState, useCallback, useEffect, useRef } from "react";
import { createPublicClient, http, formatUnits, getAddress } from "viem";
import { base } from "viem/chains";
import { tokensByChain } from "@/config/token";
import { erc20ABI } from "@/config/abis";
import { UNISWAP_CONTRACTS } from "@/config/contracts";
import {
  UniswapV3PoolABI,
  UniswapV3FactoryABI,
} from "@/config/abis/UniswapV3PoolABI";

// Get token addresses from config
const baseTokens = tokensByChain[base.id];
const AI7_TOKEN = baseTokens.find((t) => t.symbol === "AI7")!;
const USDC_TOKEN = baseTokens.find((t) => t.symbol === "USDC")!;

// Uniswap V3 config
const UNISWAP_V3_FACTORY = UNISWAP_CONTRACTS[base.id].factory as `0x${string}`;
const V3_FEE = 3000; // 0.3%

export interface AI7InvestmentResult {
  balance: string | null; // AI7 balance in human-readable format
  balanceRaw: bigint | null; // Raw balance
  usdValue: number | null; // USD value of the balance
  ai7Price: number | null; // Current AI7 price in USD
  isLoading: boolean;
  error: string | null;
  checkInvestment: (
    walletAddress: string,
  ) => Promise<{ balance: string; usdValue: number } | null>;
  reset: () => void;
}

// Create a public client for Base mainnet
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * Calculate price from sqrtPriceX96
 * sqrtPriceX96 = sqrt(price) * 2^96
 * price = (sqrtPriceX96 / 2^96)^2
 */
function calculatePriceFromSqrtPriceX96(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number,
  isToken0Base: boolean,
): number {
  const Q96 = BigInt(2) ** BigInt(96);

  // Convert to number for calculation (safe for price calculations)
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
  const price = sqrtPrice * sqrtPrice;

  // Adjust for decimals
  const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
  const adjustedPrice = price * decimalAdjustment;

  // If token0 is the base token (AI7), price is token1/token0
  // If token1 is the base token (AI7), we need to invert
  return isToken0Base ? adjustedPrice : 1 / adjustedPrice;
}

export function useAI7Investment(): AI7InvestmentResult {
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceRaw, setBalanceRaw] = useState<bigint | null>(null);
  const [usdValue, setUsdValue] = useState<number | null>(null);
  const [ai7Price, setAi7Price] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkInvestment = useCallback(
    async (
      walletAddress: string,
    ): Promise<{ balance: string; usdValue: number } | null> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        // Validate address
        const validatedAddress = getAddress(walletAddress.trim());

        // Step 1: Get AI7 balance
        const balanceResult = await publicClient.readContract({
          address: AI7_TOKEN.address as `0x${string}`,
          abi: erc20ABI,
          functionName: "balanceOf",
          args: [validatedAddress],
        });

        const rawBalance = balanceResult as bigint;
        const formattedBalance = formatUnits(rawBalance, AI7_TOKEN.decimals);

        setBalanceRaw(rawBalance);
        setBalance(formattedBalance);

        // If balance is 0, no need to fetch price
        if (rawBalance === 0n) {
          setUsdValue(0);
          setAi7Price(0);
          return { balance: formattedBalance, usdValue: 0 };
        }

        // Step 2: Get Uniswap V3 pool address
        const poolAddress = (await publicClient.readContract({
          address: UNISWAP_V3_FACTORY,
          abi: UniswapV3FactoryABI,
          functionName: "getPool",
          args: [
            AI7_TOKEN.address as `0x${string}`,
            USDC_TOKEN.address as `0x${string}`,
            V3_FEE,
          ],
        })) as `0x${string}`;

        if (poolAddress === "0x0000000000000000000000000000000000000000") {
          throw new Error("AI7/USDC pool not found");
        }

        // Step 3: Get pool slot0 for price and token order
        const [slot0Result, token0Result] = await Promise.all([
          publicClient.readContract({
            address: poolAddress,
            abi: UniswapV3PoolABI,
            functionName: "slot0",
          }),
          publicClient.readContract({
            address: poolAddress,
            abi: UniswapV3PoolABI,
            functionName: "token0",
          }),
        ]);

        const sqrtPriceX96 = slot0Result[0] as bigint;
        const token0 = token0Result as `0x${string}`;

        // Determine if AI7 is token0 or token1
        const isAI7Token0 =
          token0.toLowerCase() === AI7_TOKEN.address.toLowerCase();

        // AI7 decimals and USDC decimals from config
        const price = calculatePriceFromSqrtPriceX96(
          sqrtPriceX96,
          isAI7Token0 ? AI7_TOKEN.decimals : USDC_TOKEN.decimals, // token0 decimals
          isAI7Token0 ? USDC_TOKEN.decimals : AI7_TOKEN.decimals, // token1 decimals
          isAI7Token0,
        );

        setAi7Price(price);

        // Calculate USD value
        const calculatedUsdValue = parseFloat(formattedBalance) * price;
        setUsdValue(calculatedUsdValue);

        return { balance: formattedBalance, usdValue: calculatedUsdValue };
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Failed to check investment";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setBalance(null);
    setBalanceRaw(null);
    setUsdValue(null);
    setAi7Price(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    balance,
    balanceRaw,
    usdValue,
    ai7Price,
    isLoading,
    error,
    checkInvestment,
    reset,
  };
}
