// hooks/lp.ts
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
} from "wagmi";
import { lpRegistryABI, assetPoolABI } from "@/config/abis";
import { Address, parseUnits } from "viem";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getContractConfig } from "@/config/contracts";
import { RebalanceState } from "@/types/pool";

// Hook to get LP Registry address
export const useLPRegistryAddress = () => {
  const chainId = useChainId();
  return getContractConfig(chainId).lpRegistry.address;
};

// Read Hooks

export const useLPStatus = (poolAddress: Address) => {
  const { address } = useAccount();
  const lpRegistryAddress = useLPRegistryAddress();

  const { data: isLP, ...rest } = useReadContract({
    address: lpRegistryAddress,
    abi: lpRegistryABI,
    functionName: "isLP",
    args: [poolAddress, address!],
  });

  return {
    isLP,
    ...rest,
  };
};

export const useLPLiquidity = (poolAddress: Address) => {
  const { address } = useAccount();
  const lpRegistryAddress = useLPRegistryAddress();

  const { data: lpLiquidity, ...rest } = useReadContract({
    address: lpRegistryAddress,
    abi: lpRegistryABI,
    functionName: "getLPLiquidity",
    args: [poolAddress, address!],
  });

  return {
    lpLiquidity,
    ...rest,
  };
};

export const usePoolLPStats = (poolAddress: Address) => {
  const lpRegistryAddress = useLPRegistryAddress();

  const { data: totalLPLiquidity } = useReadContract({
    address: lpRegistryAddress,
    abi: lpRegistryABI,
    functionName: "getTotalLPLiquidity",
    args: [poolAddress],
  });

  const { data: lpCount } = useReadContract({
    address: lpRegistryAddress,
    abi: lpRegistryABI,
    functionName: "getLPCount",
    args: [poolAddress],
  });

  return {
    totalLPLiquidity,
    lpCount,
  };
};

// Hook to get cycle and rebalance lengths
export const usePoolTimings = (poolAddress: Address) => {
  const { data: cycleLength } = useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "cycleLength",
  });

  const { data: rebalanceLength } = useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "rebalanceLength",
  });

  return {
    cycleLength,
    rebalanceLength,
  };
};

export const useLastRebalancedCycle = (
  poolAddress: Address,
  lpAddress: Address
) => {
  const { data: lastRebalancedCycle } = useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "lastRebalancedCycle",
    args: [lpAddress],
  });

  return lastRebalancedCycle;
};

// Write Hooks

export const useRegisterLP = () => {
  const lpRegistryAddress = useLPRegistryAddress();
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
      await writeContract({
        address: lpRegistryAddress,
        abi: lpRegistryABI,
        functionName: "registerLP",
        args: [pool, lp, parsedAmount],
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
    error,
    hash,
  };
};

export const useLiquidityManagement = () => {
  const lpRegistryAddress = useLPRegistryAddress();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const increaseLiquidity = async (pool: Address, amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      await writeContract({
        address: lpRegistryAddress,
        abi: lpRegistryABI,
        functionName: "increaseLiquidity",
        args: [pool, parsedAmount],
      });
      toast.success("Liquidity increase initiated");
    } catch (error) {
      console.error("Error increasing liquidity:", error);
      toast.error("Failed to increase liquidity");
      throw error;
    }
  };

  const decreaseLiquidity = async (pool: Address, amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      await writeContract({
        address: lpRegistryAddress,
        abi: lpRegistryABI,
        functionName: "decreaseLiquidity",
        args: [pool, parsedAmount],
      });
      toast.success("Liquidity decrease initiated");
    } catch (error) {
      console.error("Error decreasing liquidity:", error);
      toast.error("Failed to decrease liquidity");
      throw error;
    }
  };

  return {
    increaseLiquidity,
    decreaseLiquidity,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
};

export const useRebalancing = (poolAddress: Address) => {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const initiateOffchainRebalance = async () => {
    try {
      await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
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
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "initiateOnchainRebalance",
      });
      toast.success("Onchain rebalance initiated");
    } catch (error) {
      console.error("Error initiating onchain rebalance:", error);
      toast.error("Failed to initiate onchain rebalance");
      throw error;
    }
  };

  const rebalancePool = async (
    lp: Address,
    price: string,
    amount: string,
    isDeposit: boolean
  ) => {
    try {
      const parsedPrice = parseUnits(price, 18);
      const parsedAmount = parseUnits(amount, 18);
      await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "rebalancePool",
        args: [lp, parsedPrice, parsedAmount, isDeposit],
      });
      toast.success("Pool rebalance executed");
    } catch (error) {
      console.error("Error rebalancing pool:", error);
      toast.error("Failed to rebalance pool");
      throw error;
    }
  };

  const settlePool = async () => {
    try {
      await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "settlePool",
      });
      toast.success("Pool settlement initiated");
    } catch (error) {
      console.error("Error settling pool:", error);
      toast.error("Failed to settle pool");
      throw error;
    }
  };

  return {
    initiateOffchainRebalance,
    initiateOnchainRebalance,
    rebalancePool,
    settlePool,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
};

export const useRebalanceInfo = (poolAddress: Address) => {
  const { data: rebalanceData } = useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "getLPInfo",
  });

  if (!rebalanceData) return null;

  const [
    totalDepositRequests,
    totalRedemptionRequests,
    netReserveDelta,
    rebalanceAmount,
  ] = rebalanceData;

  return {
    totalDepositRequests,
    totalRedemptionRequests,
    netReserveDelta,
    rebalanceAmount,
  };
};

// Hook to check if current cycle is ready for rebalancing
export const useRebalanceStatus = (poolAddress: Address) => {
  const { data: generalInfo } = useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "getGeneralInfo",
  });

  const { cycleLength, rebalanceLength } = usePoolTimings(poolAddress);

  const [status, setStatus] = useState({
    state: RebalanceState.NOT_READY,
    timeUntilNextAction: 0,
    nextActionTime: null as Date | null,
  });

  useEffect(() => {
    if (!generalInfo || !cycleLength || !rebalanceLength) return;

    const [
      xTokenSupply,
      cycleState,
      cycleIndex,
      assetPrice,
      lastCycleActionDateTime,
    ] = generalInfo;

    const currentTime = Math.floor(Date.now() / 1000);
    const lastActionTime = Number(lastCycleActionDateTime);
    const cycleLengthNum = Number(cycleLength);
    const rebalanceLengthNum = Number(rebalanceLength);

    // Calculate next action time and state
    let nextActionTime: Date;
    let timeUntilNextAction: number;
    let state: RebalanceState;

    if (cycleState === 0) {
      // ACTIVE
      nextActionTime = new Date((lastActionTime + cycleLengthNum) * 1000);
      timeUntilNextAction = lastActionTime + cycleLengthNum - currentTime;

      if (timeUntilNextAction <= 0) {
        state = RebalanceState.READY_FOR_OFFCHAIN_REBALANCE;
      } else {
        state = RebalanceState.NOT_READY;
      }
    } else if (cycleState === 1) {
      // REBALANCING_OFFCHAIN
      nextActionTime = new Date((lastActionTime + rebalanceLengthNum) * 1000);
      timeUntilNextAction = lastActionTime + rebalanceLengthNum - currentTime;

      if (timeUntilNextAction <= 0) {
        state = RebalanceState.READY_FOR_ONCHAIN_REBALANCE;
      } else {
        state = RebalanceState.OFFCHAIN_REBALANCE_IN_PROGRESS;
      }
    } else {
      // REBALANCING_ONCHAIN
      nextActionTime = new Date((lastActionTime + rebalanceLengthNum) * 1000);
      timeUntilNextAction = lastActionTime + rebalanceLengthNum - currentTime;

      state = RebalanceState.ONCHAIN_REBALANCE_IN_PROGRESS;
    }

    setStatus({
      state,
      timeUntilNextAction: Math.max(0, timeUntilNextAction),
      nextActionTime,
    });
  }, [generalInfo, cycleLength, rebalanceLength]);

  return {
    ...status,
    cycleLength,
    rebalanceLength,
    ...generalInfo,
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
