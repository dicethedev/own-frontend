// src/hooks/user.ts
import { querySubgraph, waitForSubgraphSync } from "./subgraph";
import { UserData, UserPosition, UserRequest } from "@/types/user";
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { Address, formatUnits, parseUnits } from "viem";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { assetPoolABI, erc20ABI, xTokenABI } from "@/config/abis";
import { useRefreshContext } from "@/context/RefreshContext";

/**
 * Hook to manage user operations in the asset pool
 * @param poolAddress Address of the asset pool contract
 * @param reserveTokenAddress Address of the reserve token (e.g. USDC)
 * @param reserveTokenDecimals Decimals of the reserve token
 * @param assetTokenAddress Address of the asset token (e.g. xTSLA)
 * @param assetTokenDecimals Decimals of the asset token
 * @returns Object with functions and state for managing user operations
 */
export const useUserPoolManagement = (
  poolAddress: Address,
  reserveTokenAddress: Address,
  reserveTokenDecimals: number = 6,
  assetTokenAddress: Address,
  assetTokenDecimals: number = 18
) => {
  const { address } = useAccount();
  const { triggerRefresh } = useRefreshContext();
  const [reserveBalance, setReserveBalance] = useState<bigint>(BigInt(0));
  const [assetBalance, setAssetBalance] = useState<bigint>(BigInt(0));
  const [reserveApproved, setReserveApproved] = useState<boolean>(false);
  const [assetApproved, setAssetApproved] = useState<boolean>(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState<boolean>(false);
  const [isWaitingForSync, setIsWaitingForSync] = useState<boolean>(false);
  const [lastTransactionType, setLastTransactionType] = useState<string | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch reserve token balance
  const {
    data: reserveTokenBalance,
    isLoading: isLoadingReserveBalance,
    refetch: refetchReserveBalance,
  } = useReadContract({
    address: reserveTokenAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address && !!reserveTokenAddress,
    },
  });

  // Fetch asset token balance
  const {
    data: assetTokenBalance,
    isLoading: isLoadingAssetBalance,
    refetch: refetchAssetBalance,
  } = useReadContract({
    address: assetTokenAddress,
    abi: xTokenABI,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address && !!assetTokenAddress,
    },
  });

  // Fetch reserve token allowance
  const { data: reserveAllowance, refetch: refetchReserveAllowance } =
    useReadContract({
      address: reserveTokenAddress,
      abi: erc20ABI,
      functionName: "allowance",
      args: [address!, poolAddress],
      query: {
        enabled: !!address && !!reserveTokenAddress && !!poolAddress,
      },
    });

  // Fetch asset token allowance
  const { data: assetAllowance, refetch: refetchAssetAllowance } =
    useReadContract({
      address: assetTokenAddress,
      abi: erc20ABI,
      functionName: "allowance",
      args: [address!, poolAddress],
      query: {
        enabled: !!address && !!assetTokenAddress && !!poolAddress,
      },
    });

  // Update balances when data changes
  useEffect(() => {
    if (reserveTokenBalance !== undefined) {
      setReserveBalance(reserveTokenBalance);
    }
    if (assetTokenBalance !== undefined) {
      setAssetBalance(assetTokenBalance);
    }
  }, [reserveTokenBalance, assetTokenBalance]);

  // Refresh data after successful transaction
  useEffect(() => {
    const handleSuccessfulTransaction = async () => {
      if (isSuccess && receipt) {
        const isApprovalTx = lastTransactionType === "approval";

        if (isApprovalTx) {
          // For approvals, just refresh allowances and balances
          toast.success("Approval successful");
          setTimeout(() => {
            refetchReserveAllowance();
            refetchAssetAllowance();
            refetchReserveBalance();
            refetchAssetBalance();
          }, 1000); // Small delay to ensure blockchain state is updated
        } else {
          setIsWaitingForSync(true); // Start sync waiting
          toast.success(
            "Transaction successful. Waiting for subgraph to sync."
          );
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

            // Refresh data after sync (or timeout)
            triggerRefresh();
            refetchReserveAllowance();
            refetchAssetAllowance();
            refetchReserveBalance();
            refetchAssetBalance();
          } catch (error) {
            console.error("Error waiting for subgraph sync:", error);
            toast.success("Data refresh completed");

            // Fallback: refresh immediately if there's an error
            triggerRefresh();
            refetchReserveAllowance();
            refetchAssetAllowance();
            refetchReserveBalance();
            refetchAssetBalance();
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
    refetchAssetAllowance,
    refetchAssetBalance,
    refetchReserveAllowance,
    refetchReserveBalance,
    lastTransactionType,
  ]);

  // Check if user has sufficient reserve balance
  const checkSufficientReserveBalance = (amount: string): boolean => {
    if (!amount || !reserveBalance) return false;
    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      return reserveBalance >= parsedAmount;
    } catch (error) {
      console.error("Error checking reserve balance:", error);
      return false;
    }
  };

  // Check if user has sufficient asset balance
  const checkSufficientAssetBalance = (amount: string): boolean => {
    if (!amount || !assetBalance) return false;
    try {
      const parsedAmount = parseUnits(amount, assetTokenDecimals);
      return assetBalance >= parsedAmount;
    } catch (error) {
      console.error("Error checking asset balance:", error);
      return false;
    }
  };

  // Check if reserve token amount is approved
  const checkReserveApproval = async (amount: string): Promise<boolean> => {
    if (!address || !reserveAllowance || !amount) return false;

    try {
      setIsCheckingApproval(true);
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      const isApproved = reserveAllowance >= parsedAmount;
      setReserveApproved(isApproved);
      return isApproved;
    } catch (error) {
      console.error("Error checking reserve approval:", error);
      return false;
    } finally {
      setIsCheckingApproval(false);
    }
  };

  // Check if asset token amount is approved
  const checkAssetApproval = async (amount: string): Promise<boolean> => {
    if (!address || !assetAllowance || !amount) return false;

    try {
      setIsCheckingApproval(true);
      const parsedAmount = parseUnits(amount, assetTokenDecimals);
      const isApproved = assetAllowance >= parsedAmount;
      setAssetApproved(isApproved);
      return isApproved;
    } catch (error) {
      console.error("Error checking asset approval:", error);
      return false;
    } finally {
      setIsCheckingApproval(false);
    }
  };

  // Approve reserve token spending
  const approveReserve = async (amount: string) => {
    if (!address || !amount) {
      throw new Error("Address or amount not provided");
    }

    // Check balance first
    if (!checkSufficientReserveBalance(amount)) {
      toast.error("Insufficient reserve balance");
      throw new Error("Insufficient reserve balance");
    }

    try {
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);
      setLastTransactionType("approval");
      await writeContract({
        address: reserveTokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [poolAddress, parsedAmount],
      });
      return true;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error approving reserve token:", error);
      toast.error("Failed to approve reserve token");
      throw error;
    }
  };

  // Approve asset token spending
  const approveAsset = async (amount: string) => {
    if (!address || !amount) {
      throw new Error("Address or amount not provided");
    }

    // Check balance first
    if (!checkSufficientAssetBalance(amount)) {
      toast.error("Insufficient asset balance");
      throw new Error("Insufficient asset balance");
    }

    try {
      const parsedAmount = parseUnits(amount, assetTokenDecimals);
      setLastTransactionType("approval");
      await writeContract({
        address: assetTokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [poolAddress, parsedAmount],
      });
      return true;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error approving asset token:", error);
      toast.error("Failed to approve asset token");
      throw error;
    }
  };

  // Make a deposit request
  const depositRequest = async (
    depositAmount: string,
    collateralAmount?: string
  ) => {
    try {
      setError(null);
      setLastTransactionType("deposit");
      // If collateral is not specified, use the same amount as deposit (1:1 ratio)
      const collateral = collateralAmount || depositAmount;

      // Check balance before proceeding
      const totalAmount = (
        Number(depositAmount) + Number(collateral)
      ).toString();
      if (!checkSufficientReserveBalance(totalAmount)) {
        setError(new Error("Insufficient balance for deposit and collateral"));
        toast.error("Insufficient balance for deposit and collateral");
        return;
      }

      // Parse amounts
      const parsedDepositAmount = parseUnits(
        depositAmount,
        reserveTokenDecimals
      );
      const parsedCollateralAmount = parseUnits(
        collateral,
        reserveTokenDecimals
      );

      // Check and handle approval if needed
      const needsApproval = !(await checkReserveApproval(totalAmount));
      if (needsApproval) {
        await approveReserve(totalAmount);
      }

      // Make the deposit request
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "depositRequest",
        args: [parsedDepositAmount, parsedCollateralAmount],
      });

      toast.success("Deposit request initiated");
      return hash;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error making deposit request:", error);
      setError(
        error instanceof Error ? error : new Error("Failed to process deposit")
      );
      toast.error("Failed to process deposit");
      throw error;
    }
  };

  // Make a redemption request
  const redemptionRequest = async (amount: string) => {
    try {
      setError(null);
      setLastTransactionType("redemption");
      // Check balance before proceeding
      if (!checkSufficientAssetBalance(amount)) {
        setError(new Error("Insufficient asset balance"));
        toast.error("Insufficient asset balance");
        return;
      }

      // Parse amount
      const parsedAmount = parseUnits(amount, assetTokenDecimals);

      // Check and handle approval if needed
      const needsApproval = !(await checkAssetApproval(amount));
      if (needsApproval) {
        await approveAsset(amount);
      }

      // Make the redemption request
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "redemptionRequest",
        args: [parsedAmount],
      });

      toast.success("Redemption request initiated");
      return hash;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error making redemption request:", error);
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to process redemption")
      );
      toast.error("Failed to process redemption");
      throw error;
    }
  };

  // Claim assets after a deposit request
  const claimAsset = async (user: Address) => {
    try {
      setError(null);
      setLastTransactionType("claimAsset");
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "claimAsset",
        args: [user],
      });

      toast.success("Asset claim initiated");
      return hash;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error claiming asset:", error);
      setError(
        error instanceof Error ? error : new Error("Failed to claim asset")
      );
      toast.error("Failed to claim asset");
      throw error;
    }
  };

  // Claim reserves after a redemption request
  const claimReserve = async (user: Address) => {
    try {
      setError(null);
      setLastTransactionType("claimReserve");
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "claimReserve",
        args: [user],
      });

      toast.success("Reserve claim initiated");
      return hash;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error claiming reserve:", error);
      setError(
        error instanceof Error ? error : new Error("Failed to claim reserve")
      );
      toast.error("Failed to claim reserve");
      throw error;
    }
  };

  // Add collateral to a user position
  const addCollateral = async (user: Address, amount: string) => {
    try {
      setError(null);
      setLastTransactionType("addCollateral");
      // Check balance before proceeding
      if (!checkSufficientReserveBalance(amount)) {
        setError(new Error("Insufficient reserve balance"));
        toast.error("Insufficient reserve balance");
        return;
      }

      // Parse amount
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);

      // Check and handle approval if needed
      const needsApproval = !(await checkReserveApproval(amount));
      if (needsApproval) {
        await approveReserve(amount);
      }

      // Add collateral
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "addCollateral",
        args: [user, parsedAmount],
      });

      toast.success("Collateral added successfully");
      return hash;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error adding collateral:", error);
      setError(
        error instanceof Error ? error : new Error("Failed to add collateral")
      );
      toast.error("Failed to add collateral");
      throw error;
    }
  };

  // Reduce collateral from a user position
  const reduceCollateral = async (amount: string) => {
    try {
      setError(null);
      setLastTransactionType("reduceCollateral");
      // Parse amount
      const parsedAmount = parseUnits(amount, reserveTokenDecimals);

      // Reduce collateral
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "reduceCollateral",
        args: [parsedAmount],
      });

      toast.success("Collateral reduced successfully");
      return hash;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error reducing collateral:", error);
      setError(
        error instanceof Error
          ? error
          : new Error("Failed to reduce collateral")
      );
      toast.error("Failed to reduce collateral");
      throw error;
    }
  };

  // Exit from the pool (only works when pool is halted)
  const exitPool = async (amount: string) => {
    try {
      setError(null);
      setLastTransactionType("exitPool");
      // Check asset balance before proceeding
      if (!checkSufficientAssetBalance(amount)) {
        setError(new Error("Insufficient asset balance"));
        toast.error("Insufficient asset balance");
        return;
      }

      // Parse amount
      const parsedAmount = parseUnits(amount, assetTokenDecimals);

      // Exit pool
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "exitPool",
        args: [parsedAmount],
      });

      toast.success("Successfully exited pool");
      return hash;
    } catch (error) {
      setLastTransactionType(null);
      console.error("Error exiting pool:", error);
      setError(
        error instanceof Error ? error : new Error("Failed to exit pool")
      );
      toast.error("Failed to exit pool");
      throw error;
    }
  };

  return {
    // State
    isLoading:
      isPending || isConfirming || isCheckingApproval || isWaitingForSync,
    isLoadingReserveBalance,
    isLoadingAssetBalance,
    isSuccess,
    error,
    transactionHash: hash,

    // Balances
    reserveBalance: reserveBalance
      ? formatUnits(reserveBalance, reserveTokenDecimals)
      : "0",
    assetBalance: assetBalance
      ? formatUnits(assetBalance, assetTokenDecimals)
      : "0",

    // Balance checks
    checkSufficientReserveBalance,
    checkSufficientAssetBalance,

    // Approval state and checks
    reserveApproved,
    assetApproved,
    checkReserveApproval,
    checkAssetApproval,

    // Approval actions
    approveReserve,
    approveAsset,

    // Pool operations
    depositRequest,
    redemptionRequest,
    claimAsset,
    claimReserve,
    addCollateral,
    reduceCollateral,
    exitPool,
  };
};

/**
 * Hook to fetch user-specific data related to a pool
 * @param poolAddress The address of the pool to query
 * @returns User data including positions and requests
 */
export const useUserData = (poolAddress: Address): UserData => {
  const { address } = useAccount();
  const { refreshTrigger } = useRefreshContext();
  const [data, setData] = useState<{
    userPosition: UserPosition | null;
    userRequest: UserRequest | null;
    isUser: boolean;
  }>({
    userPosition: null,
    userRequest: null,
    isUser: false,
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
          query GetUserData {
            userPosition(id: "${address.toLowerCase()}-${poolAddress.toLowerCase()}") {
              id
              user
              pool {
                id
              }
              assetAmount
              depositAmount
              collateralAmount
              createdAt
              updatedAt
            }
            userRequest(id: "${address.toLowerCase()}-${poolAddress.toLowerCase()}") {
              id
              requestType
              amount
              collateralAmount
              requestCycle
              liquidator
              createdAt
              updatedAt
            }
          }
        `;

        const response = await querySubgraph(query);

        setData({
          userPosition: response?.userPosition || null,
          userRequest: response?.userRequest || null,
          isUser: !!response?.userPosition,
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch user data")
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

/**
 * Calculate user's position details
 * @param userPosition The user's position data
 * @param assetPrice Current asset price
 * @param oraclePrice Oracle price
 * @returns Calculated metrics for the position
 */
export const calculateUserPositionMetrics = (
  userPosition: UserPosition | null,
  assetPrice: number,
  oraclePrice: number
) => {
  if (!userPosition) {
    return {
      positionValue: 0,
      entryPrice: 0,
      pnlValue: 0,
      pnlPercentage: 0,
      collateralRatio: 0,
    };
  }

  // Calculate with correct decimals
  const assetAmount = Number(userPosition.assetAmount) / 1e18;
  const depositAmount = Number(userPosition.depositAmount) / 1e6;
  const collateralAmount = Number(userPosition.collateralAmount) / 1e6;

  // Calculate position details
  const positionValue = assetAmount * assetPrice;
  const entryPrice = assetAmount > 0 ? depositAmount / assetAmount : 0;
  const pnlValue = assetAmount * (assetPrice - entryPrice);
  const pnlPercentage =
    entryPrice > 0 ? ((assetPrice - entryPrice) / entryPrice) * 100 : 0;

  // Calculate collateral health ratio
  const currentValue = assetAmount * oraclePrice;
  const collateralRatio =
    currentValue > 0 ? (collateralAmount / currentValue) * 100 : 0;

  return {
    positionValue,
    entryPrice,
    pnlValue,
    pnlPercentage,
    collateralRatio,
  };
};

/**
 * Format a number for display based on its magnitude
 * @param value The number to format
 * @returns Formatted string representation
 */
export const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString(undefined, {
    minimumSignificantDigits: 2,
    maximumSignificantDigits: 4,
  });
};

/**
 * Format a value as currency
 * @param value The number to format as currency
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return `$${formatNumber(value)}`;
};

/**
 * Check if a user has a pending request
 * @param userRequest The user request data
 * @param currentCycle The current cycle number
 * @returns Boolean indicating if the request is still pending
 */
export const hasPendingRequest = (
  userRequest: UserRequest | null,
  currentCycle: number
): boolean => {
  if (!userRequest) return false;
  return (
    userRequest.requestType !== "NONE" &&
    Number(userRequest.requestCycle) <= currentCycle
  );
};
