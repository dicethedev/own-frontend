// hooks/lp.ts (revised version)
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { Address, parseUnits } from "viem";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { poolLiquidityManagerABI, poolCylceManagerABI } from "@/config/abis";
import { querySubgraph } from "./subgraph";
import { RebalanceState, LPPosition, LPRequest, Pool } from "@/types/pool";

// Single hook to fetch LP-specific data
export const useLPData = (poolAddress: Address) => {
  const { address } = useAccount();
  const [data, setData] = useState<{
    lpPosition: LPPosition | null;
    lpRequest: LPRequest | null;
    isLP: boolean;
  }>({
    lpPosition: null,
    lpRequest: null,
    isLP: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const query = `
          query GetLPData {
            lpPosition(id: "${address.toLowerCase()}-${poolAddress.toLowerCase()}") {
              id
              lp
              liquidityCommitment
              collateralAmount
              interestAccrued
              liquidityHealth
              assetShare
              lastRebalanceCycle
              lastRebalancePrice
              createdAt
              updatedAt
            }
            lpRequests(where: { 
              lp: "${address.toLowerCase()}", 
              pool: "${poolAddress.toLowerCase()}"
            }, orderBy: requestCycle, orderDirection: desc, first: 1) {
              id
              requestType
              requestAmount
              requestCycle
              liquidator
              createdAt
              updatedAt
            }
          }
        `;

        const response = await querySubgraph(query);

        setData({
          lpPosition: response?.lpPosition || null,
          lpRequest: response?.lpRequests?.[0] || null,
          isLP: !!response?.lpPosition,
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching LP data:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch LP data")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address, poolAddress]);

  return {
    ...data,
    isLoading,
    error,
  };
};

// Helper function to determine rebalance state based on pool data
export const calculateRebalanceState = (
  pool: Pool
): {
  rebalanceState: RebalanceState;
  timeUntilNextAction: number;
  nextActionTime: Date | null;
} => {
  // Default values
  let state: RebalanceState = RebalanceState.NOT_READY;
  let nextActionTime: Date | null = null;
  let timeUntilNextAction = 0;

  if (!pool || !pool.lastCycleActionDateTime) {
    return { rebalanceState: state, timeUntilNextAction, nextActionTime };
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const lastActionTime = Number(pool.lastCycleActionDateTime);
  const rebalanceLength = Number(pool.rebalanceLength || 0);

  if (pool.poolStatus === "ACTIVE") {
    nextActionTime = new Date((lastActionTime + rebalanceLength) * 1000);
    timeUntilNextAction = lastActionTime + rebalanceLength - currentTime;

    if (timeUntilNextAction <= 0) {
      state = RebalanceState.READY_FOR_OFFCHAIN_REBALANCE;
    } else {
      state = RebalanceState.NOT_READY;
    }
  } else if (pool.poolStatus === "REBALANCING_OFFCHAIN") {
    nextActionTime = new Date((lastActionTime + rebalanceLength) * 1000);
    timeUntilNextAction = lastActionTime + rebalanceLength - currentTime;

    if (timeUntilNextAction <= 0) {
      state = RebalanceState.READY_FOR_ONCHAIN_REBALANCE;
    } else {
      state = RebalanceState.OFFCHAIN_REBALANCE_IN_PROGRESS;
    }
  } else {
    nextActionTime = new Date((lastActionTime + rebalanceLength) * 1000);
    timeUntilNextAction = lastActionTime + rebalanceLength - currentTime;
    state = RebalanceState.ONCHAIN_REBALANCE_IN_PROGRESS;
  }

  return {
    rebalanceState: state,
    timeUntilNextAction: Math.max(0, timeUntilNextAction),
    nextActionTime,
  };
};

// Write Hooks
export const useRegisterLP = (liquidityManagerAddress: Address) => {
  const {
    writeContract,
    data: hash,
    error: txnError,
    isPending,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    error: contractError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const registerLP = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "addLiquidity",
        args: [parsedAmount],
      });
      toast.success("LP registration initiated");
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
    error: txnError || contractError,
    hash,
  };
};

export const useLiquidityManagement = (liquidityManagerAddress: Address) => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const increaseLiquidity = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "addLiquidity",
        args: [parsedAmount],
      });
      toast.success("Liquidity increase initiated");
    } catch (error) {
      console.error("Error increasing liquidity:", error);
      toast.error("Failed to increase liquidity");
      throw error;
    }
  };

  const decreaseLiquidity = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "reduceLiquidity",
        args: [parsedAmount],
      });
      toast.success("Liquidity decrease initiated");
    } catch (error) {
      console.error("Error decreasing liquidity:", error);
      toast.error("Failed to decrease liquidity");
      throw error;
    }
  };

  const claimInterest = async () => {
    try {
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "claimInterest",
      });
      toast.success("Interest claim initiated");
    } catch (error) {
      console.error("Error claiming interest:", error);
      toast.error("Failed to claim interest");
      throw error;
    }
  };

  const reduceCollateral = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "reduceCollateral",
        args: [parsedAmount],
      });
      toast.success("Collateral reduction initiated");
    } catch (error) {
      console.error("Error reducing collateral:", error);
      toast.error("Failed to reduce collateral");
      throw error;
    }
  };

  return {
    increaseLiquidity,
    decreaseLiquidity,
    claimInterest,
    reduceCollateral,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
};

export const useRebalancing = (cycleManagerAddress: Address) => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const initiateOffchainRebalance = async () => {
    try {
      await writeContract({
        address: cycleManagerAddress,
        abi: poolCylceManagerABI,
        functionName: "initiateOffchainRebalance",
      });
      toast.success("Offchain rebalance initiated");
    } catch (error) {
      console.error("Error initiating offchain rebalance:", error);
      toast.error("Failed to initiate offchain rebalance");
      throw error;
    }
  };

  const initiateOnchainRebalance = async () => {
    try {
      await writeContract({
        address: cycleManagerAddress,
        abi: poolCylceManagerABI,
        functionName: "initiateOnchainRebalance",
      });
      toast.success("Onchain rebalance initiated");
    } catch (error) {
      console.error("Error initiating onchain rebalance:", error);
      toast.error("Failed to initiate onchain rebalance");
      throw error;
    }
  };

  const rebalancePool = async (lp: Address, price: string) => {
    try {
      const parsedPrice = parseUnits(price, 18);
      await writeContract({
        address: cycleManagerAddress,
        abi: poolCylceManagerABI,
        functionName: "rebalancePool",
        args: [lp, parsedPrice],
      });
      toast.success("Pool rebalance executed");
    } catch (error) {
      console.error("Error rebalancing pool:", error);
      toast.error("Failed to rebalance pool");
      throw error;
    }
  };

  return {
    initiateOffchainRebalance,
    initiateOnchainRebalance,
    rebalancePool,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
};

export const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

  return parts.join(" ");
};
