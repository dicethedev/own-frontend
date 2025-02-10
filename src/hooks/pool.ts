// src/hooks/useAssetPool.ts
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { Address, formatUnits, parseUnits } from "viem";
import toast from "react-hot-toast";
import { assetPoolABI, lpRegistryABI } from "@/config/abis";
import { getContractConfig } from "@/config/contracts";
import { useEffect, useState } from "react";
import { CycleState, Pool } from "@/types/pool";
import { useMarketData } from "./marketData";

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

export function usePoolData(poolAddress: Address, symbol: string) {
  const [poolData, setPoolData] = useState<Pool | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const generalInfo = usePoolGeneralInfo(poolAddress);
  const lpInfo = usePoolLPInfo(poolAddress);
  const { marketData, isLoading: isMarketDataLoading } = useMarketData(symbol);

  // Effect to update pool data when either contract or market data changes
  useEffect(() => {
    try {
      if (generalInfo.data && lpInfo.data) {
        const [
          xTokenSupply,
          cycleState,
          cycleIndex,
          assetPrice,
          lastCycleActionDateTime,
        ] = generalInfo.data;

        const [
          totalDepositRequests,
          totalRedemptionRequests,
          netReserveDelta,
          rebalanceAmount,
        ] = lpInfo.data;

        const poolStatus =
          cycleState === CycleState.ACTIVE
            ? "ACTIVE"
            : cycleState === CycleState.REBALANCING_OFFCHAIN
            ? "REBALANCING OFFCHAIN"
            : "REBALANCING ONCHAIN";

        setPoolData({
          address: poolAddress,
          tokenSymbol: convertTokenSymbol(symbol),
          name: marketData.name,
          symbol,
          price: marketData.price,
          oraclePrice: Number(formatUnits(assetPrice, 18)),
          priceChange: marketData.priceChange,
          depositToken: "USDC",
          volume24h: marketData.volume,
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
          totalRedemptionRequests: Number(
            formatUnits(totalRedemptionRequests, 18)
          ),
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch pool data")
      );
    }
  }, [poolAddress, symbol, generalInfo.data, lpInfo.data, marketData]);

  return {
    poolData,
    isLoading: generalInfo.isLoading || lpInfo.isLoading || isMarketDataLoading,
    error: error || generalInfo.error || lpInfo.error,
  };
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

export const convertTokenSymbol = (symbol: string): string => {
  // If starts with 'x', remove it (xTSLA -> TSLA)
  if (symbol.startsWith("x")) {
    return symbol.slice(1);
  }
  // If doesn't start with 'x', add it (TSLA -> xTSLA)
  return `x${symbol}`;
};
