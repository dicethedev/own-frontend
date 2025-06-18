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
import { querySubgraph, waitForSubgraphSync } from "./subgraph";
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

// Helper function to check if US market is open (9:30 AM - 4:00 PM ET)
export const isUSMarketOpen = (): boolean => {
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;

  const marketOpenTime = 9 * 60 + 30; // 9:30 AM
  const marketCloseTime = 16 * 60; // 4:00 PM

  // Check if it's a weekday (Monday = 1, Sunday = 0)
  const dayOfWeek = etTime.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  return (
    isWeekday &&
    currentTimeInMinutes >= marketOpenTime &&
    currentTimeInMinutes < marketCloseTime
  );
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
  let state: RebalanceState = RebalanceState.ACTIVE;
  let nextActionTime: Date | null = null;
  let timeUntilNextAction = 0;

  if (!pool) {
    return { rebalanceState: state, timeUntilNextAction, nextActionTime };
  }

  const marketIsOpen = isUSMarketOpen();

  // Calculate next market open/close times for timeUntilNextAction
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  // Set next action time based on current market status
  if (marketIsOpen) {
    // Market is open, next action is market close (4:00 PM ET)
    const marketClose = new Date(etTime);
    marketClose.setHours(16, 0, 0, 0);
    nextActionTime = marketClose;
    timeUntilNextAction = Math.floor(
      (marketClose.getTime() - now.getTime()) / 1000
    );
  } else {
    // Market is closed, next action is market open (9:30 AM ET)
    const marketOpen = new Date(etTime);
    marketOpen.setHours(9, 30, 0, 0);

    // If it's past market hours today, set for next business day
    if (
      etTime.getHours() >= 16 ||
      etTime.getDay() === 0 ||
      etTime.getDay() === 6
    ) {
      // Move to next business day
      do {
        marketOpen.setDate(marketOpen.getDate() + 1);
      } while (marketOpen.getDay() === 0 || marketOpen.getDay() === 6);
    }

    nextActionTime = marketOpen;
    timeUntilNextAction = Math.floor(
      (marketOpen.getTime() - now.getTime()) / 1000
    );
  }

  // Determine state based on pool status and market hours
  if (pool.poolStatus === "ACTIVE") {
    if (marketIsOpen) {
      state = RebalanceState.READY_FOR_OFFCHAIN_REBALANCE;
    } else {
      state = RebalanceState.ACTIVE;
    }
  } else if (pool.poolStatus === "REBALANCING OFFCHAIN") {
    if (marketIsOpen) {
      state = RebalanceState.OFFCHAIN_REBALANCE_IN_PROGRESS;
    } else {
      // Market is closed, ready for onchain rebalancing
      state = RebalanceState.READY_FOR_ONCHAIN_REBALANCE;
    }
  } else if (pool.poolStatus === "REBALANCING ONCHAIN") {
    state = RebalanceState.ONCHAIN_REBALANCE_IN_PROGRESS;
  } else {
    state = RebalanceState.ACTIVE;
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
  const [isWaitingForSync, setIsWaitingForSync] = useState<boolean>(false);
  const [lastTransactionType, setLastTransactionType] = useState<string | null>(
    null
  );
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
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
    const handleSuccessfulTransaction = async () => {
      if (isSuccess && receipt) {
        const isApprovalTx = lastTransactionType === "approval";

        if (isApprovalTx) {
          // For approvals, just refresh allowances and balances
          toast.success("Approval successful");
          setTimeout(() => {
            refetchAllowance();
            refetchBalance();
          }, 1000); // Small delay to ensure blockchain state is updated
        } else {
          setIsWaitingForSync(true); // Start sync waiting
          toast.success("Transaction successful. Waiting for subgraph to sync");
          try {
            console.log(
              `Waiting for subgraph to sync to block ${receipt.blockNumber}`
            );

            const synced = await waitForSubgraphSync(receipt.blockNumber);

            if (synced) {
              console.log("Subgraph synced, refreshing data...");
              toast.success("Data synced successfully");
            } else {
              console.warn("Subgraph sync timeout, refreshing anyway...");
              toast.success("Data refresh completed");
            }

            triggerRefresh();
            refetchAllowance();
            refetchBalance();
          } catch (error) {
            console.error("Error waiting for subgraph sync:", error);
            toast.success("Data refresh completed");
            triggerRefresh();
            refetchAllowance();
            refetchBalance();
          } finally {
            setIsWaitingForSync(false); // End sync waiting
          }
        }
        setLastTransactionType(null);
      }
    };

    handleSuccessfulTransaction();
  }, [
    isSuccess,
    receipt,
    triggerRefresh,
    refetchAllowance,
    refetchBalance,
    lastTransactionType,
  ]);

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
      setLastTransactionType("approval");
      await writeContract({
        address: reserveTokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [liquidityManagerAddress, approvalAmount],
      });
      return true;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error approving token:", error);
      toast.error("Failed to approve token");
      throw error;
    }
  };

  const increaseLiquidity = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      setLastTransactionType("increaseLiquidity");
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "addLiquidity",
        args: [parsedAmount],
      });
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error increasing liquidity:", error);
      toast.error("Failed to increase liquidity");
      throw error;
    }
  };

  const decreaseLiquidity = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      setLastTransactionType("decreaseLiquidity");
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "reduceLiquidity",
        args: [parsedAmount],
      });
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error decreasing liquidity:", error);
      toast.error("Failed to decrease liquidity");
      throw error;
    }
  };

  const addCollateral = async (lp: Address, amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      setLastTransactionType("addCollateral");
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "addCollateral",
        args: [lp, parsedAmount],
      });
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error adding collateral:", error);
      toast.error("Failed to add collateral");
      throw error;
    }
  };

  const reduceCollateral = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      setLastTransactionType("reduceCollateral");
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
    setLastTransactionType("claimInterest");
    try {
      await writeContract({
        address: liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "claimInterest",
      });
    } catch (error) {
      setLastTransactionType(null);
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
    isLoading:
      isPending || isConfirming || isCheckingApproval || isWaitingForSync,
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
  const [isWaitingForSync, setIsWaitingForSync] = useState<boolean>(false);
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    const handleSuccessfulTransaction = async () => {
      if (isSuccess && receipt) {
        setIsWaitingForSync(true); // Start sync waiting
        toast.success("Transaction successful. Waiting for subgraph to sync");

        try {
          console.log(
            `Waiting for subgraph to sync to block ${receipt.blockNumber}`
          );

          const synced = await waitForSubgraphSync(receipt.blockNumber);

          if (synced) {
            console.log("Subgraph synced, refreshing data...");
          } else {
            console.warn("Subgraph sync timeout, refreshing anyway...");
          }

          triggerRefresh();
        } catch (error) {
          console.error("Error waiting for subgraph sync:", error);
          triggerRefresh();
        } finally {
          setIsWaitingForSync(false); // End sync waiting
        }
      }
    };

    handleSuccessfulTransaction();
  }, [isSuccess, receipt, triggerRefresh]);

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
    isLoading: isPending || isConfirming || isWaitingForSync,
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
