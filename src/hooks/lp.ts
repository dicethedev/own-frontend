// hooks/lp.ts (revised version)
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi";
import { Address, formatUnits, parseUnits } from "viem";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  poolLiquidityManagerABI,
  poolCylceManagerABI,
  erc20ABI,
} from "@/config/abis";
import { querySubgraph } from "./subgraph";
import { RebalanceState, Pool } from "@/types/pool";
import { LPPosition, LPRequest } from "@/types/lp";
import { useRefreshContext } from "@/context/RefreshContext";

// Single hook to fetch LP-specific data
export const useLPData = (poolAddress: Address) => {
  const { address } = useAccount();
  const { refreshTrigger } = useRefreshContext();
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

        // ToDo: update the subgraph to use consistent naming similar to userPosition and userRequest
        const query = `
          query GetLPData {
            lpposition(id: "${address.toLowerCase()}-${poolAddress.toLowerCase()}") {
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
            lprequest(id: "${address.toLowerCase()}-${poolAddress.toLowerCase()}") {
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
          lpPosition: response?.lpposition || null,
          lpRequest: response?.lprequest || null,
          isLP: !!response?.lpposition,
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
  }, [address, poolAddress, refreshTrigger]);

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
export const useLiquidityManagement = (
  liquidityManagerAddress: Address,
  reserveTokenAddress: Address,
  reserveTokenDecimals: number = 6
) => {
  const { address } = useAccount();
  const { triggerRefresh } = useRefreshContext();
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState<boolean>(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get user's reserve token balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: reserveTokenAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address && !!reserveTokenAddress,
    },
  });

  // Get current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: reserveTokenAddress,
    abi: erc20ABI,
    functionName: "allowance",
    args: [address!, liquidityManagerAddress],
    query: {
      enabled: !!address && !!reserveTokenAddress && !!liquidityManagerAddress,
    },
  });

  useEffect(() => {
    if (isSuccess) {
      // Give the blockchain/subgraph time to update
      toast.success("Transaction Successful");
      setTimeout(() => {
        console.log("Transaction confirmed, refreshing data...");
        triggerRefresh();
        refetchAllowance();
        refetchBalance();
      }, 2000);
    }
  }, [isSuccess, triggerRefresh, refetchAllowance, refetchBalance]);

  // Update user balance when data changes
  useEffect(() => {
    if (balance !== undefined) {
      setUserBalance(balance);
    }
  }, [balance]);

  // Check if user has sufficient balance
  const checkSufficientBalance = (amount: string): boolean => {
    if (!amount || !userBalance) return false;
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      return userBalance >= parsedAmount;
    } catch (error) {
      console.error("Error checking balance:", error);
      return false;
    }
  };

  // Check if amount is approved
  const checkApproval = async (amount: string): Promise<boolean> => {
    if (!address || !allowance || !amount) return false;

    try {
      setIsCheckingApproval(true);
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      const isApproved = allowance >= parsedAmount;
      setIsApproved(isApproved);
      return isApproved;
    } catch (error) {
      console.error("Error checking approval:", error);
      return false;
    } finally {
      setIsCheckingApproval(false);
    }
  };

  // Approve token spending
  const approve = async (amount: string) => {
    if (!address || !amount) {
      throw new Error("Address or amount not provided");
    }

    // Check balance first
    if (!checkSufficientBalance(amount)) {
      toast.error("Insufficient balance");
      throw new Error("Insufficient balance");
    }

    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      // Use a higher amount to prevent frequent approvals
      const approvalAmount = parsedAmount;

      await writeContract({
        address: reserveTokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [liquidityManagerAddress, approvalAmount],
      });
      return true;
    } catch (error) {
      console.error("Error approving token:", error);
      toast.error("Failed to approve token");
      throw error;
    }
  };

  const increaseLiquidity = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "addLiquidity",
        args: [parsedAmount],
      });
    } catch (error) {
      console.error("Error increasing liquidity:", error);
      toast.error("Failed to increase liquidity");
      throw error;
    }
  };

  const decreaseLiquidity = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "reduceLiquidity",
        args: [parsedAmount],
      });
    } catch (error) {
      console.error("Error decreasing liquidity:", error);
      toast.error("Failed to decrease liquidity");
      throw error;
    }
  };

  const addCollateral = async (lp: Address, amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "addCollateral",
        args: [lp, parsedAmount],
      });
    } catch (error) {
      console.error("Error adding collateral:", error);
      toast.error("Failed to add collateral");
      throw error;
    }
  };

  const reduceCollateral = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "reduceCollateral",
        args: [parsedAmount],
      });
    } catch (error) {
      console.error("Error reducing collateral:", error);
      toast.error("Failed to reduce collateral");
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
    } catch (error) {
      console.error("Error claiming interest:", error);
      toast.error("Failed to claim interest");
      throw error;
    }
  };

  return {
    increaseLiquidity,
    decreaseLiquidity,
    addCollateral,
    reduceCollateral,
    claimInterest,
    approve,
    checkApproval,
    checkSufficientBalance,
    isLoading: isPending || isConfirming || isCheckingApproval,
    isLoadingBalance,
    isSuccess,
    isApproved,
    error,
    hash,
    userBalance: balance ? formatUnits(balance, reserveTokenDecimals) : "0",
    formattedBalance: balance
      ? formatUnits(balance, reserveTokenDecimals)
      : "0",
  };
};

export const useRebalancing = (cycleManagerAddress: Address) => {
  const { triggerRefresh } = useRefreshContext();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      // Give the blockchain/subgraph time to update
      setTimeout(() => {
        console.log("Transaction confirmed, refreshing data...");
        triggerRefresh();
      }, 2000);
    }
  }, [isSuccess, triggerRefresh]);

  const initiateOffchainRebalance = async () => {
    try {
      await writeContract({
        address: cycleManagerAddress,
        abi: poolCylceManagerABI,
        functionName: "initiateOffchainRebalance",
      });
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
