import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
  usePublicClient,
} from "wagmi";
import { Address, formatUnits, parseUnits, PublicClient } from "viem";
import toast from "react-hot-toast";
import { assetPoolABI, lpRegistryABI } from "@/config/abis";
import { getContractConfig } from "@/config/contracts";
import { useEffect, useState } from "react";
import { CycleState, Pool } from "@/types/pool";
import { fetchMarketData } from "./marketData";
import { useRecentPoolEvents } from "./poolFactory";
import { usePoolContext } from "@/context/PoolContext";

export const useRegisterLP = (chainId: number) => {
  const { lpRegistry } = getContractConfig(chainId);
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const registerLP = async (
    pool: Address,
    lp: Address,
    liquidityAmount: string
  ) => {
    try {
      const parsedAmount = parseUnits(liquidityAmount, 18);
      const hash = await writeContract({
        address: lpRegistry.address,
        abi: lpRegistryABI,
        functionName: "registerLP",
        args: [pool, lp, parsedAmount],
      });
      toast.success("LP registration initiated");
      return hash;
    } catch (error) {
      console.error("Error registering LP:", error);
      toast.error("Failed to register LP");
      throw error;
    }
  };

  return {
    registerLP,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error,
    hash,
  };
};

export const useDepositRequest = (poolAddress: Address) => {
  //   const { data: simulateData, error: simulateError } = useSimulateContract({
  //     address: poolAddress,
  //     abi: assetPoolABI,
  //     functionName: "depositRequest",
  //     args: [parseUnits("1", 6)],
  //   });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 6);
      //   if (!simulateData?.request) {
      //     throw new Error("Transaction simulation failed");
      //   }
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "depositRequest",
        args: [parsedAmount],
      });
      toast.success("Deposit request initiated");
      return hash;
    } catch (error) {
      console.error("Error making deposit request:", error);
      toast.error("Failed to make deposit request");
      throw error;
    }
  };

  return {
    deposit,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error,
    hash,
  };
};

export const useRedemptionRequest = (poolAddress: Address) => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const redeem = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "redemptionRequest",
        args: [parsedAmount],
      });
      toast.success("Redemption request initiated");
      return hash;
    } catch (error) {
      console.error("Error making redemption request:", error);
      toast.error("Failed to make redemption request");
      throw error;
    }
  };

  return {
    redeem,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error,
    hash,
  };
};

export const useCancelRequest = (poolAddress: Address) => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancel = async () => {
    try {
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "cancelRequest",
      });
      toast.success("Request cancellation initiated");
      return hash;
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
      throw error;
    }
  };

  return {
    cancel,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error,
    hash,
  };
};

export const useClaimRequest = (poolAddress: Address) => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = async (user: Address) => {
    try {
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "claimRequest",
        args: [user],
      });
      toast.success("Claim request initiated");
      return hash;
    } catch (error) {
      console.error("Error claiming request:", error);
      toast.error("Failed to claim request");
      throw error;
    }
  };

  return {
    claim,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error,
    hash,
  };
};

// Read hooks for fetching user request status
export const useUserRequest = (poolAddress: Address, userAddress: Address) => {
  return useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "pendingRequests",
    args: [userAddress],
  });
};

// Hook for fetching general pool info
export function usePoolGeneralInfo(poolAddress: Address) {
  return useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "getGeneralInfo",
  });
}

// Hook for fetching LP info
export function usePoolLPInfo(poolAddress: Address) {
  return useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "getLPInfo",
  });
}

// Hook for user-specific data
export function useUserPoolData(poolAddress: Address) {
  const { address: userAddress } = useAccount();

  const userRequest = useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "pendingRequests",
    args: userAddress ? [userAddress] : undefined,
  });

  return {
    userRequest: userRequest.data,
    isLoading: userRequest.isLoading,
    error: userRequest.error,
  };
}

interface PoolFetchParams {
  poolAddress: Address;
  symbol: string;
  publicClient: PublicClient;
}

export async function fetchPoolData({
  poolAddress,
  symbol,
  publicClient,
}: PoolFetchParams): Promise<Pool> {
  try {
    // Fetch market data and contract data in parallel
    const [marketInfo, generalInfo, lpInfo] = await Promise.all([
      fetchMarketData(symbol),
      publicClient.readContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "getGeneralInfo",
      }),
      publicClient.readContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "getLPInfo",
      }),
    ]);

    if (marketInfo.error) {
      throw new Error(`Market data error for ${symbol}: ${marketInfo.error}`);
    }

    const [
      xTokenSupply,
      cycleState,
      cycleIndex,
      assetPrice,
      lastCycleActionDateTime,
    ] = generalInfo;

    const [
      totalDepositRequests,
      totalRedemptionRequests,
      netReserveDelta,
      rebalanceAmount,
    ] = lpInfo;

    const poolStatus =
      cycleState === CycleState.ACTIVE
        ? "ACTIVE"
        : cycleState === CycleState.REBALANCING_OFFCHAIN
        ? "REBALANCING OFFCHAIN"
        : "REBALANCING ONCHAIN";

    return {
      address: poolAddress,
      tokenSymbol: convertTokenSymbol(symbol),
      name: marketInfo.name,
      symbol,
      price: marketInfo.price,
      oraclePrice: Number(formatUnits(assetPrice, 18)),
      priceChange: marketInfo.priceChange,
      depositToken: "USDC",
      volume24h: marketInfo.volume,
      currentCycle: Number(cycleIndex),
      poolStatus,
      lastCycleActionDateTime: new Date(
        Number(lastCycleActionDateTime) * 1000
      ).toISOString(),
      totalLiquidity: Number(formatUnits(totalDepositRequests, 18)),
      xTokenSupply: Number(formatUnits(xTokenSupply, 18)),
      netReserveDelta: Number(formatUnits(netReserveDelta, 18)),
      rebalanceAmount: Number(formatUnits(rebalanceAmount, 18)),
      totalDepositRequests: Number(formatUnits(totalDepositRequests, 18)),
      totalRedemptionRequests: Number(formatUnits(totalRedemptionRequests, 18)),
    };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(`Failed to fetch pool data for ${poolAddress}`);
  }
}

export function usePoolData(poolAddress: Address, tokenSymbol: string) {
  const [poolData, setPoolData] = useState<Pool | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const symbol = convertTokenSymbol(tokenSymbol);

  useEffect(() => {
    async function getPoolData() {
      if (!publicClient) return;

      try {
        const data = await fetchPoolData({
          poolAddress,
          symbol,
          publicClient,
        });
        setPoolData(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch pool data")
        );
      } finally {
        setIsLoading(false);
      }
    }

    getPoolData();
  }, [poolAddress, symbol, publicClient]);

  return {
    poolData,
    isLoading,
    error,
  };
}

export function useRecentPools(
  chainId: number,
  limit: number,
  refreshKey: number = 0
) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  const {
    poolEvents,
    isLoading: isEventsLoading,
    error: eventsError,
  } = useRecentPoolEvents(chainId, limit, refreshKey);

  useEffect(() => {
    async function fetchPoolsData() {
      if (!poolEvents.length || !publicClient) return;

      try {
        setIsLoading(true);

        // Fetch all pools data in parallel
        const poolsData = await Promise.all(
          poolEvents.map((event) =>
            fetchPoolData({
              poolAddress: event.pool,
              symbol: convertTokenSymbol(event.assetSymbol),
              publicClient,
            })
          )
        );

        setPools(poolsData);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch pools data")
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchPoolsData();
  }, [poolEvents, publicClient, refreshKey]);

  return {
    pools,
    isLoading: isLoading || isEventsLoading,
    error: error || eventsError,
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
