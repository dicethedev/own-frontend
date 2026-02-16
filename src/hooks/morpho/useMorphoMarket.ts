// src/hooks/useMorphoMarket.ts
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { useMemo } from "react";
import {
  MORPHO_BLUE_ADDRESS,
  MORPHO_MARKET_ID,
  MorphoBlueABI,
  AdaptiveCurveIrmABI,
  USDC_DECIMALS,
  SECONDS_PER_YEAR,
  MorphoMarketParams,
} from "@/config/morpho";

const WAD = BigInt(1e18);

export interface MorphoMarketData {
  // Market params
  marketParams: MorphoMarketParams | null;
  // Market state
  totalSupplyAssets: bigint;
  totalSupplyShares: bigint;
  totalBorrowAssets: bigint;
  totalBorrowShares: bigint;
  lastUpdate: bigint;
  fee: bigint;
  // Computed
  utilization: number; // 0-100
  availableLiquidity: bigint;
  availableLiquidityFormatted: string;
  totalSupplyFormatted: string;
  totalBorrowFormatted: string;
  lltv: number; // 0-100
  borrowApy: number; // percentage e.g. 5.2
  supplyApy: number; // percentage e.g. 4.1
  // Loading
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useMorphoMarket(): MorphoMarketData {
  // Fetch market params
  const {
    data: marketParamsRaw,
    isLoading: isLoadingParams,
    error: paramsError,
  } = useReadContract({
    address: MORPHO_BLUE_ADDRESS,
    abi: MorphoBlueABI,
    functionName: "idToMarketParams",
    args: [MORPHO_MARKET_ID],
  });

  // Fetch market state
  const {
    data: marketStateRaw,
    isLoading: isLoadingState,
    error: stateError,
    refetch,
  } = useReadContract({
    address: MORPHO_BLUE_ADDRESS,
    abi: MorphoBlueABI,
    functionName: "market",
    args: [MORPHO_MARKET_ID],
    query: {
      refetchInterval: 30_000,
    },
  });

  const marketParams: MorphoMarketParams | null = useMemo(() => {
    if (!marketParamsRaw) return null;
    const [loanToken, collateralToken, oracle, irm, lltv] = marketParamsRaw as [
      `0x${string}`,
      `0x${string}`,
      `0x${string}`,
      `0x${string}`,
      bigint,
    ];
    return { loanToken, collateralToken, oracle, irm, lltv };
  }, [marketParamsRaw]);

  const marketData = useMemo(() => {
    if (!marketStateRaw) {
      return {
        totalSupplyAssets: 0n,
        totalSupplyShares: 0n,
        totalBorrowAssets: 0n,
        totalBorrowShares: 0n,
        lastUpdate: 0n,
        fee: 0n,
      };
    }
    const [
      totalSupplyAssets,
      totalSupplyShares,
      totalBorrowAssets,
      totalBorrowShares,
      lastUpdate,
      fee,
    ] = marketStateRaw as [bigint, bigint, bigint, bigint, bigint, bigint];
    return {
      totalSupplyAssets,
      totalSupplyShares,
      totalBorrowAssets,
      totalBorrowShares,
      lastUpdate,
      fee,
    };
  }, [marketStateRaw]);

  // Fetch borrow rate from the IRM
  const borrowRateViewArgs = marketParams
    ? ([
        {
          loanToken: marketParams.loanToken,
          collateralToken: marketParams.collateralToken,
          oracle: marketParams.oracle,
          irm: marketParams.irm,
          lltv: marketParams.lltv,
        },
        {
          totalSupplyAssets: marketData.totalSupplyAssets,
          totalSupplyShares: marketData.totalSupplyShares,
          totalBorrowAssets: marketData.totalBorrowAssets,
          totalBorrowShares: marketData.totalBorrowShares,
          lastUpdate: marketData.lastUpdate,
          fee: marketData.fee,
        },
      ] as const)
    : undefined;

  const { data: borrowRatePerSecond } = useReadContract({
    address: marketParams?.irm as `0x${string}`,
    abi: AdaptiveCurveIrmABI,
    functionName: "borrowRateView",
    args: borrowRateViewArgs!,
    query: {
      enabled: !!marketParams?.irm && marketData.lastUpdate > 0n,
      refetchInterval: 30_000,
    },
  });

  // Compute derived values
  const utilization = useMemo(() => {
    if (marketData.totalSupplyAssets === 0n) return 0;
    return (
      Number(
        (marketData.totalBorrowAssets * 10000n) / marketData.totalSupplyAssets,
      ) / 100
    );
  }, [marketData.totalSupplyAssets, marketData.totalBorrowAssets]);

  // borrowAPY = e^(borrowRatePerSecond × secondsPerYear) - 1
  // supplyAPY = borrowAPY × utilization × (1 - fee)
  const { borrowApy, supplyApy } = useMemo(() => {
    if (!borrowRatePerSecond) return { borrowApy: 0, supplyApy: 0 };

    const ratePerSecond = Number(borrowRatePerSecond) / 1e18;
    const borrowApy = (Math.exp(ratePerSecond * SECONDS_PER_YEAR) - 1) * 100;

    const util =
      marketData.totalSupplyAssets > 0n
        ? Number(marketData.totalBorrowAssets) /
          Number(marketData.totalSupplyAssets)
        : 0;
    const feeRate = Number(marketData.fee) / 1e18;
    const supplyApy = borrowApy * util * (1 - feeRate);

    return { borrowApy, supplyApy };
  }, [
    borrowRatePerSecond,
    marketData.totalSupplyAssets,
    marketData.totalBorrowAssets,
    marketData.fee,
  ]);

  const availableLiquidity =
    marketData.totalSupplyAssets - marketData.totalBorrowAssets;

  const lltv = marketParams
    ? Number((marketParams.lltv * 10000n) / WAD) / 100
    : 0;

  return {
    marketParams,
    ...marketData,
    utilization,
    availableLiquidity,
    availableLiquidityFormatted: formatUnits(availableLiquidity, USDC_DECIMALS),
    totalSupplyFormatted: formatUnits(
      marketData.totalSupplyAssets,
      USDC_DECIMALS,
    ),
    totalBorrowFormatted: formatUnits(
      marketData.totalBorrowAssets,
      USDC_DECIMALS,
    ),
    lltv,
    borrowApy,
    supplyApy,
    isLoading: isLoadingParams || isLoadingState,
    error: (paramsError || stateError) as Error | null,
    refetch,
  };
}
