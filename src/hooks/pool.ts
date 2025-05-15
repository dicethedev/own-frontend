import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { Address, formatUnits, parseUnits } from "viem";
import toast from "react-hot-toast";
import { assetPoolABI, erc20ABI, xTokenABI } from "@/config/abis";
import { useEffect, useState } from "react";
import { Pool } from "@/types/pool";
import { fetchBatchMarketData } from "./marketData";
import { usePoolContext } from "@/context/PoolContext";
import { querySubgraph } from "./subgraph";

// ToDo: implement simulate txn for better eroor handling & user experience

export const useDepositRequest = (
  poolAddress: Address,
  depositTokenAddress: Address
) => {
  const { address } = useAccount();
  const [needsApproval, setNeedsApproval] = useState<boolean>(true);
  const [tokenDecimals, setTokenDecimals] = useState<number>(6);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get token decimals
  const { data: decimals } = useReadContract({
    address: depositTokenAddress,
    abi: erc20ABI,
    functionName: "decimals",
  });

  // Get user's token balance
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: depositTokenAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address!],
  });

  // Get current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: depositTokenAddress,
    abi: erc20ABI,
    functionName: "allowance",
    args: [address!, poolAddress],
  });

  useEffect(() => {
    if (decimals) {
      setTokenDecimals(decimals);
    }
  }, [decimals]);

  useEffect(() => {
    if (balance !== undefined) {
      setUserBalance(balance);
    }
  }, [balance]);

  // Check if approval is needed for a specific amount
  const checkApprovalNeeded = async (amount: string) => {
    if (!allowance || !amount) return true;
    const parsedAmount = parseUnits(amount, tokenDecimals);
    return allowance < parsedAmount;
  };

  // Check if user has sufficient balance
  const checkSufficientBalance = (amount: string): boolean => {
    if (!amount || !userBalance) return false;
    try {
      const parsedAmount = parseUnits(amount, tokenDecimals);
      return userBalance >= parsedAmount;
    } catch (error) {
      console.error("Error checking balance:", error);
      return false;
    }
  };

  // Handle token approval
  const approve = async (amount: string) => {
    try {
      // Check balance before triggering approval
      if (!checkSufficientBalance(amount)) {
        setError("Insufficient balance");
        return;
      }

      const parsedAmount = parseUnits(amount, tokenDecimals);
      const hash = await writeContract({
        address: depositTokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [poolAddress, parsedAmount],
      });
      await refetchAllowance();
      return hash;
    } catch (error) {
      console.error("Error approving token:", error);
      throw error;
    }
  };

  // Handle deposit
  const deposit = async (amount: string) => {
    try {
      setError(null);

      // Check balance before proceeding
      if (!checkSufficientBalance(amount)) {
        setError("Insufficient balance");
        return;
      }

      const parsedAmount = parseUnits(amount, tokenDecimals);

      // Check and handle approval if needed
      const needsApproval = await checkApprovalNeeded(amount);
      if (needsApproval) {
        setNeedsApproval(true);
        await approve(amount);
      }

      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "depositRequest",
        args: [parsedAmount, parsedAmount],
      });

      toast.success("Deposit request initiated");
      return hash;
    } catch (error) {
      console.error("Error making deposit request:", error);
      setError("Failed to process deposit");
      throw error;
    }
  };

  const formattedBalance = userBalance
    ? formatUnits(userBalance, tokenDecimals)
    : "0";

  return {
    deposit,
    approve,
    needsApproval,
    isLoading: isPending || isConfirming,
    isLoadingBalance,
    isSuccess,
    error,
    hash,
    formattedBalance,
    tokenDecimals,
    checkSufficientBalance,
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
        functionName: "claimAsset",
        args: [user],
      });
      toast.success("Claim asset request initiated");
      return hash;
    } catch (error) {
      console.error("Error claiming asset:", error);
      toast.error("Failed to claim asset");
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
    functionName: "userRequests",
    args: [userAddress],
  });
};

export function useVerifiedPools(
  chainId: number,
  limit: number,
  refreshKey: number = 0
) {
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
            pools(first: ${limit}, orderBy: cycleIndex, orderDirection: desc) {
              id
              assetSymbol
              assetToken
              assetSupply
              reserveToken
              reserveTokenSymbol
              oracle {
                id
                assetPrice
              }
              cycleIndex
              cycleState
              totalUserDeposits
              totalLPLiquidityCommited
              lpCount
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
            0: "ACTIVE",
            1: "REBALANCING OFFCHAIN",
            2: "REBALANCING ONCHAIN",
          };

          const marketData = marketDataMap[
            convertTokenSymbol(poolData.assetSymbol)
          ] || {
            name: poolData.assetName || "",
            price: 0,
            priceChange: 0,
            volume: "0",
          };

          // Convert to your Pool type
          return {
            address: poolData.id as Address,
            assetTokenSymbol: poolData.assetSymbol,
            assetName: poolData.assetName || marketData.name,
            assetSymbol: convertTokenSymbol(poolData.assetSymbol),
            assetTokenAddress: poolData.assetToken as Address,
            assetPrice: marketData.price,
            oraclePrice: Number(formatUnits(poolData.oracle.assetPrice, 18)),
            priceChange: marketData.priceChange,
            depositToken: poolData.reserveTokenSymbol,
            depositTokenAddress: poolData.reserveToken as Address,
            oracleAddress: poolData.oracle.id as Address,
            volume24h: marketData.volume,
            currentCycle: Number(poolData.cycleIndex),
            poolStatus:
              statusMap[poolData.cycleState as keyof typeof statusMap] ||
              "ACTIVE",
            xTokenSupply: Number(poolData.assetSupply),
            totalLiquidity: Number(poolData.totalLPLiquidityCommited),
            activeLPs: Number(poolData.lpCount),
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
  }, [limit, refreshKey]);

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
