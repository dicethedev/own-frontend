import { useReadContract, useAccount } from "wagmi";
import { Address, formatUnits } from "viem";
import { assetPoolABI, xTokenABI } from "@/config/abis";
import { useEffect, useState } from "react";
import { Pool } from "@/types/pool";
import { fetchBatchMarketData } from "./marketData";
import { usePoolContext } from "@/context/PoolContext";
import { querySubgraph } from "./subgraph";
import { useRefreshContext } from "@/context/RefreshContext";

// Read hooks for fetching user request status
export const useUserRequest = (poolAddress: Address, userAddress: Address) => {
  return useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "userRequests",
    args: [userAddress],
  });
};

export function usePools(
  chainId: number,
  limit: number,
  refreshKey: number = 0
) {
  const { refreshTrigger } = useRefreshContext();
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPoolsFromSubgraph() {
      try {
        setIsLoading(true);

        // GraphQL query to get pool data
        const query = `
          query GetPools {
            pools(first: ${limit}, where: {isVerified: true}, orderBy: cycleIndex, orderDirection: desc) {
              id
              assetSymbol
              assetToken
              assetTokenSymbol
              assetTokenDecimals
              reserveToken
              reserveTokenSymbol
              reserveTokenDecimals
              oracle {
                id
                assetSymbol
                assetPrice
                ohlcOpen
                ohlcHigh
                ohlcLow
                ohlcClose
                ohlcTimestamp
                lastUpdated
                isVerified
                createdAt
                updatedAt
                splitDetected
                preSplitPrice
              }
              poolStrategy {
                id
                isVerified
                baseInterestRate
                interestRate1
                maxInterestRate
                utilizationTier1
                utilizationTier2
                protocolFee
                feeRecipient
                isYieldBearing
                userHealthyCollateralRatio
                userLiquidationThreshold
                lpHealthyCollateralRatio
                lpLiquidationThreshold
                lpBaseCollateralRatio
                lpLiquidationReward
                rebalanceLength
                oracleUpdateThreshold
                haltThreshold
              }
              poolCycleManager
              poolLiquidityManager
              poolInterestRate
              poolUtilizationRatio
              createdAt
              updatedAt
              isVerified
              
              assetSupply
              reserveBackingAsset
              aggregatePoolReserves
              totalUserDeposits
              totalUserCollateral
              cycleTotalDeposits
              cycleTotalRedemptions
              reserveYieldAccrued
              
              totalLPLiquidityCommited
              totalLPCollateral
              lpCount
              cycleTotalAddLiquidityAmount
              cycleTotalReduceLiquidityAmount
              
              cycleState
              cycleIndex
              lastCycleActionDateTime
              cyclePriceHigh
              cyclePriceLow
              cycleInterestAmount
              rebalancedLPs
              prevRebalancePrice
            }
          }
      `;

        const data = await querySubgraph(query);

        if (!data || !data.pools || !Array.isArray(data.pools)) {
          throw new Error("Invalid response from subgraph");
        }

        // Extract all unique pool asset symbols
        const symbols = [
          ...new Set(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.pools.map((pool: any) => convertTokenSymbol(pool.assetSymbol))
          ),
        ] as string[];

        // Fetch market data for all symbols in a single call
        const marketDataMap = await fetchBatchMarketData(symbols);

        // Process the pools data and fetch market data for each
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const poolsWithMarketData = data.pools.map((poolData: any) => {
          // Map the status from number to string
          const statusMap = {
            POOL_ACTIVE: "ACTIVE",
            POOL_REBALANCING_OFFCHAIN: "REBALANCING OFFCHAIN",
            POOL_REBALANCING_ONCHAIN: "REBALANCING ONCHAIN",
            POOL_HALTED: "HALTED",
          };

          const marketData = marketDataMap[
            convertTokenSymbol(poolData.assetSymbol)
          ] || {
            name: poolData.assetTokenName || "",
            price: 0,
            priceChange: 0,
            volume: "0",
          };

          // Convert to your Pool type with all fields
          return {
            address: poolData.id as Address,
            assetTokenSymbol: poolData.assetSymbol,
            assetName: marketData.name,
            assetSymbol: convertTokenSymbol(poolData.assetSymbol),
            assetTokenAddress: poolData.assetToken as Address,
            assetTokenDecimals: poolData.assetTokenDecimals
              ? Number(poolData.assetTokenDecimals)
              : 18,
            assetPrice: marketData.price,
            oraclePrice: Number(
              formatUnits(poolData.oracle.assetPrice || "0", 18)
            ),
            priceChange: marketData.priceChange,
            reserveToken: poolData.reserveTokenSymbol,
            reserveTokenDecimals: poolData.reserveTokenDecimals
              ? Number(poolData.reserveTokenDecimals)
              : 18,
            reserveTokenAddress: poolData.reserveToken as Address,
            liquidityManagerAddress: poolData.poolLiquidityManager as Address,
            cycleManagerAddress: poolData.poolCycleManager as Address,
            poolStrategyAddress: poolData.poolStrategy.id as Address,
            oracleAddress: poolData.oracle.id as Address,
            volume24h: marketData.volume,
            currentCycle: Number(poolData.cycleIndex),
            poolStatus:
              statusMap[poolData.cycleState as keyof typeof statusMap],

            // Additional fields from subgraph
            poolInterestRate: poolData.poolInterestRate
              ? BigInt(poolData.poolInterestRate)
              : undefined,
            poolUtilizationRatio: poolData.poolUtilizationRatio
              ? BigInt(poolData.poolUtilizationRatio)
              : undefined,
            assetSupply: poolData.assetSupply
              ? BigInt(poolData.assetSupply)
              : undefined,
            reserveBackingAsset: poolData.reserveBackingAsset
              ? BigInt(poolData.reserveBackingAsset)
              : undefined,
            aggregatePoolReserves: poolData.aggregatePoolReserves
              ? BigInt(poolData.aggregatePoolReserves)
              : undefined,
            totalUserDeposits: poolData.totalUserDeposits
              ? BigInt(poolData.totalUserDeposits)
              : undefined,
            totalUserCollateral: poolData.totalUserCollateral
              ? BigInt(poolData.totalUserCollateral)
              : undefined,
            cycleTotalDeposits: poolData.cycleTotalDeposits
              ? BigInt(poolData.cycleTotalDeposits)
              : undefined,
            cycleTotalRedemptions: poolData.cycleTotalRedemptions
              ? BigInt(poolData.cycleTotalRedemptions)
              : undefined,
            reserveYieldAccrued: poolData.reserveYieldAccrued
              ? BigInt(poolData.reserveYieldAccrued)
              : undefined,

            // LP Manager data
            totalLPLiquidityCommited: poolData.totalLPLiquidityCommited
              ? BigInt(poolData.totalLPLiquidityCommited)
              : undefined,
            totalLPCollateral: poolData.totalLPCollateral
              ? BigInt(poolData.totalLPCollateral)
              : undefined,
            lpCount: poolData.lpCount ? BigInt(poolData.lpCount) : undefined,
            cycleTotalAddLiquidityAmount: poolData.cycleTotalAddLiquidityAmount
              ? BigInt(poolData.cycleTotalAddLiquidityAmount)
              : undefined,
            cycleTotalReduceLiquidityAmount:
              poolData.cycleTotalReduceLiquidityAmount
                ? BigInt(poolData.cycleTotalReduceLiquidityAmount)
                : undefined,

            // Cycle Manager data
            cycleState: poolData.cycleState,
            lastCycleActionDateTime: poolData.lastCycleActionDateTime
              ? BigInt(poolData.lastCycleActionDateTime)
              : undefined,
            cyclePriceHigh: poolData.cyclePriceHigh
              ? BigInt(poolData.cyclePriceHigh)
              : undefined,
            cyclePriceLow: poolData.cyclePriceLow
              ? BigInt(poolData.cyclePriceLow)
              : undefined,
            cycleInterestAmount: poolData.cycleInterestAmount
              ? BigInt(poolData.cycleInterestAmount)
              : undefined,
            rebalancedLPs: poolData.rebalancedLPs
              ? BigInt(poolData.rebalancedLPs)
              : undefined,
            prevRebalancePrice: poolData.prevRebalancePrice
              ? BigInt(poolData.prevRebalancePrice)
              : undefined,

            // Strategy data
            baseInterestRate: poolData.poolStrategy.baseInterestRate
              ? Number(poolData.poolStrategy.baseInterestRate)
              : undefined,
            interestRate1: poolData.poolStrategy.interestRate1
              ? Number(poolData.poolStrategy.interestRate1)
              : undefined,
            maxInterestRate: poolData.poolStrategy.maxInterestRate
              ? Number(poolData.poolStrategy.maxInterestRate)
              : undefined,
            utilizationTier1: poolData.poolStrategy.utilizationTier1
              ? Number(poolData.poolStrategy.utilizationTier1)
              : undefined,
            utilizationTier2: poolData.poolStrategy.utilizationTier2
              ? Number(poolData.poolStrategy.utilizationTier2)
              : undefined,
            protocolFee: poolData.poolStrategy.protocolFee
              ? Number(poolData.poolStrategy.protocolFee)
              : undefined,
            feeRecipient: poolData.poolStrategy.feeRecipient as Address,
            isYieldBearing: poolData.poolStrategy.isYieldBearing,
            userHealthyCollateralRatio: poolData.poolStrategy
              .userHealthyCollateralRatio
              ? Number(poolData.poolStrategy.userHealthyCollateralRatio)
              : undefined,
            userLiquidationThreshold: poolData.poolStrategy
              .userLiquidationThreshold
              ? Number(poolData.poolStrategy.userLiquidationThreshold)
              : undefined,
            lpHealthyCollateralRatio: poolData.poolStrategy
              .lpHealthyCollateralRatio
              ? Number(poolData.poolStrategy.lpHealthyCollateralRatio)
              : undefined,
            lpLiquidationThreshold: poolData.poolStrategy.lpLiquidationThreshold
              ? Number(poolData.poolStrategy.lpLiquidationThreshold)
              : undefined,
            lpBaseCollateralRatio: poolData.poolStrategy.lpBaseCollateralRatio
              ? Number(poolData.poolStrategy.lpBaseCollateralRatio)
              : undefined,
            lpLiquidationReward: poolData.poolStrategy.lpLiquidationReward
              ? Number(poolData.poolStrategy.lpLiquidationReward)
              : undefined,
            rebalanceLength: poolData.poolStrategy.rebalanceLength
              ? Number(poolData.poolStrategy.rebalanceLength)
              : undefined,
            oracleUpdateThreshold: poolData.poolStrategy.oracleUpdateThreshold
              ? Number(poolData.poolStrategy.oracleUpdateThreshold)
              : undefined,
            haltThreshold: poolData.poolStrategy.haltThreshold
              ? Number(poolData.poolStrategy.haltThreshold)
              : undefined,
          };
        });

        setPools(poolsWithMarketData);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch pools data")
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchPoolsFromSubgraph();
  }, [limit, refreshKey, refreshTrigger]);

  return {
    pools,
    isLoading,
    error,
  };
}

export function useAssetToken(tokenAddress: Address) {
  const { address } = useAccount();

  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: tokenAddress,
    abi: xTokenABI,
    functionName: "balanceOf",
    args: [address!],
  });

  return {
    balance: balance,
    isLoading: isLoadingBalance,
  };
}

export const useSpecificPool = (
  symbol: string
): {
  pool: Pool | undefined;
  isLoading: boolean;
  error: Error | null;
  notFound: boolean;
} => {
  const { getPool, isLoading, error, isInitialized } = usePoolContext();
  const pool = getPool(symbol);

  // Only consider it "not found" if we've finished the initial load
  const notFound = isInitialized && !pool;

  return {
    pool,
    isLoading: isLoading || !isInitialized, // Keep loading until initialized
    error,
    notFound,
  };
};

export const convertTokenSymbol = (symbol: string): string => {
  // If starts with 'x', remove it (xTSLA -> TSLA)
  if (symbol.startsWith("x")) {
    return symbol.slice(1);
  }
  // If doesn't start with 'x', add it (TSLA -> xTSLA)
  return `x${symbol}`;
};
