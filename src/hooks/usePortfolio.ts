"use client";

import { useEffect, useState, useMemo } from "react";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { tokensByChain } from "@/config/token";
import { erc20Abi } from "viem";
import { useRefreshContext } from "@/context/RefreshContext";

export interface PortfolioPosition {
  symbol: string;
  name: string;
  logo: string;
  balance: string;
  balanceRaw: bigint;
  decimals: number;
  address: `0x${string}`;
  usdPrice: number;
  usdValue: number;
  priceChange24h: number;
  unrealizedGainPercent: number;
  apy: number;
}

export interface PortfolioData {
  positions: PortfolioPosition[];
  totalValue: number;
  totalGainPercent: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Mock APY data for different tokens
const MOCK_APY: Record<string, number> = {
  AI7: 24,
};

// Mock unrealized gains (percentage)
const MOCK_GAINS: Record<string, number> = {
  AI7: 12.4,
};

export function usePortfolio(): PortfolioData {
  const { address } = useAccount();
  const chainId = useChainId();
  const { refreshTrigger } = useRefreshContext();
  const [marketPrices, setMarketPrices] = useState<
    Record<string, { price: number; priceChange: number }>
  >({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  // Get RWA tokens for current chain (excluding stablecoins)
  const tokens = useMemo(() => {
    const allTokens = tokensByChain[chainId] || [];
    return allTokens.filter((t) => t.type === "RWA");
  }, [chainId]);

  // Prepare contract calls for all token balances
  const balanceContracts = useMemo(() => {
    if (!address || !tokens.length) return [];
    return tokens.map((token) => ({
      address: token.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }));
  }, [address, tokens]);

  // Fetch all balances in a single multicall
  const {
    data: balancesData,
    isLoading: isLoadingBalances,
    refetch: refetchBalances,
  } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!address && balanceContracts.length > 0,
      refetchInterval: 300_000, // Refresh every 5 minutes
    },
  });

  // Refetch balances when refresh is triggered (e.g., after swap)
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchBalances();
    }
  }, [refreshTrigger, refetchBalances]);

  // Fetch market prices from Yahoo Finance API
  useEffect(() => {
    const fetchPrices = async () => {
      if (!tokens.length) return;

      setIsLoadingPrices(true);
      try {
        const symbols = tokens.map((t) => t.symbol).join(",");
        const response = await fetch(`/api/yahoo-finance?symbols=${symbols}`);

        if (response.ok) {
          const data = await response.json();
          const prices: Record<string, { price: number; priceChange: number }> =
            {};

          for (const symbol of Object.keys(data)) {
            prices[symbol] = {
              price: data[symbol].price || 0,
              priceChange: data[symbol].priceChange || 0,
            };
          }

          setMarketPrices(prices);
        }
      } catch (error) {
        console.error("Error fetching market prices:", error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchPrices();
    const intervalId = setInterval(fetchPrices, 600_000); // Refresh every 10 minutes
    return () => clearInterval(intervalId);
  }, [tokens]);

  // Process balances and create positions
  const positions: PortfolioPosition[] = useMemo(() => {
    if (!balancesData || !tokens.length) return [];

    return tokens
      .map((token, index) => {
        const balanceResult = balancesData[index];
        const balanceRaw =
          balanceResult?.status === "success"
            ? (balanceResult.result as bigint)
            : BigInt(0);

        const balance = formatUnits(balanceRaw, token.decimals);
        const balanceNum = parseFloat(balance);

        // Get price from market data
        const priceData = marketPrices[token.symbol] || {
          price: 0,
          priceChange: 0,
        };
        const usdValue = balanceNum * priceData.price;

        return {
          symbol: token.symbol,
          name: token.name,
          logo: token.logo,
          balance,
          balanceRaw,
          decimals: token.decimals,
          address: token.address as `0x${string}`,
          usdPrice: priceData.price,
          usdValue,
          priceChange24h: priceData.priceChange,
          unrealizedGainPercent: MOCK_GAINS[token.symbol] || 0,
          apy: MOCK_APY[token.symbol] || 0,
        };
      })
      .filter((position) => position.balanceRaw > BigInt(0)); // Only show positions with balance
  }, [balancesData, tokens, marketPrices]);

  // Calculate totals
  const totalValue = positions.reduce((sum, pos) => sum + pos.usdValue, 0);
  const totalGainPercent =
    positions.length > 0
      ? positions.reduce(
          (sum, pos) => sum + pos.unrealizedGainPercent * pos.usdValue,
          0
        ) / totalValue
      : 0;

  return {
    positions,
    totalValue,
    totalGainPercent: isNaN(totalGainPercent) ? 0 : totalGainPercent,
    isLoading: isLoadingBalances || isLoadingPrices,
    error: null,
    refetch: refetchBalances,
  };
}
