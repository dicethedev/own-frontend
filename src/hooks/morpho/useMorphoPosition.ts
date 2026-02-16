// src/hooks/useMorphoPosition.ts
import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { formatUnits, erc20Abi } from "viem";
import { useMemo } from "react";
import {
  MORPHO_BLUE_ADDRESS,
  MORPHO_MARKET_ID,
  MorphoBlueABI,
  USDC_ADDRESS,
  AI7_ADDRESS,
  USDC_DECIMALS,
  AI7_DECIMALS,
} from "@/config/morpho";

export interface MorphoPosition {
  // Raw position data
  supplyShares: bigint;
  borrowShares: bigint;
  collateral: bigint;
  // Formatted
  collateralFormatted: string;
  // Wallet balances
  usdcBalance: bigint;
  usdcBalanceFormatted: string;
  ai7Balance: bigint;
  ai7BalanceFormatted: string;
  // Allowances
  usdcAllowance: bigint;
  ai7Allowance: bigint;
  // Computed supply/borrow amounts (converted from shares)
  supplyAssets: bigint;
  supplyAssetsFormatted: string;
  borrowAssets: bigint;
  borrowAssetsFormatted: string;
  // Health
  ltv: number; // current LTV as percentage
  healthFactor: number; // > 1 is healthy
  // Loading
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseMorphoPositionParams {
  totalSupplyAssets: bigint;
  totalSupplyShares: bigint;
  totalBorrowAssets: bigint;
  totalBorrowShares: bigint;
  lltv: bigint;
}

export function useMorphoPosition(
  marketTotals: UseMorphoPositionParams,
): MorphoPosition {
  const { address } = useAccount();

  // Fetch user position from Morpho
  const {
    data: positionData,
    isLoading: isLoadingPosition,
    error: positionError,
    refetch: refetchPosition,
  } = useReadContract({
    address: MORPHO_BLUE_ADDRESS,
    abi: MorphoBlueABI,
    functionName: "position",
    args: [MORPHO_MARKET_ID, address!],
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  // Fetch balances and allowances in a single multicall
  const {
    data: balancesData,
    isLoading: isLoadingBalances,
    refetch: refetchBalances,
  } = useReadContracts({
    contracts: [
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address!],
      },
      {
        address: AI7_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address!],
      },
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address!, MORPHO_BLUE_ADDRESS],
      },
      {
        address: AI7_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address!, MORPHO_BLUE_ADDRESS],
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  const position = useMemo(() => {
    if (!positionData) {
      return { supplyShares: 0n, borrowShares: 0n, collateral: 0n };
    }
    const [supplyShares, borrowShares, collateral] = positionData as [
      bigint,
      bigint,
      bigint,
    ];
    return { supplyShares, borrowShares, collateral };
  }, [positionData]);

  // Convert shares to assets
  const supplyAssets = useMemo(() => {
    if (position.supplyShares === 0n || marketTotals.totalSupplyShares === 0n) {
      return 0n;
    }
    return (
      (position.supplyShares * marketTotals.totalSupplyAssets) /
      marketTotals.totalSupplyShares
    );
  }, [
    position.supplyShares,
    marketTotals.totalSupplyAssets,
    marketTotals.totalSupplyShares,
  ]);

  const borrowAssets = useMemo(() => {
    if (position.borrowShares === 0n || marketTotals.totalBorrowShares === 0n) {
      return 0n;
    }
    // Round up for borrow (user owes more)
    return (
      (position.borrowShares * marketTotals.totalBorrowAssets +
        marketTotals.totalBorrowShares -
        1n) /
      marketTotals.totalBorrowShares
    );
  }, [
    position.borrowShares,
    marketTotals.totalBorrowAssets,
    marketTotals.totalBorrowShares,
  ]);

  // Parse balances
  const usdcBalance =
    balancesData?.[0]?.status === "success"
      ? (balancesData[0].result as bigint)
      : 0n;
  const ai7Balance =
    balancesData?.[1]?.status === "success"
      ? (balancesData[1].result as bigint)
      : 0n;
  const usdcAllowance =
    balancesData?.[2]?.status === "success"
      ? (balancesData[2].result as bigint)
      : 0n;
  const ai7Allowance =
    balancesData?.[3]?.status === "success"
      ? (balancesData[3].result as bigint)
      : 0n;

  // Compute health — simplified (oracle price needed for real calc)
  // For now we use a basic ratio
  const ltv = 0; // Will be computed with oracle price
  const healthFactor = position.borrowShares > 0n ? 999 : Infinity; // placeholder

  const refetch = () => {
    refetchPosition();
    refetchBalances();
  };

  return {
    ...position,
    collateralFormatted: formatUnits(position.collateral, AI7_DECIMALS),
    usdcBalance,
    usdcBalanceFormatted: formatUnits(usdcBalance, USDC_DECIMALS),
    ai7Balance,
    ai7BalanceFormatted: formatUnits(ai7Balance, AI7_DECIMALS),
    usdcAllowance,
    ai7Allowance,
    supplyAssets,
    supplyAssetsFormatted: formatUnits(supplyAssets, USDC_DECIMALS),
    borrowAssets,
    borrowAssetsFormatted: formatUnits(borrowAssets, USDC_DECIMALS),
    ltv,
    healthFactor,
    isLoading: isLoadingPosition || isLoadingBalances,
    error: positionError as Error | null,
    refetch,
  };
}
