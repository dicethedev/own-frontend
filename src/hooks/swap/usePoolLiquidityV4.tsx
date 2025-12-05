// src/hooks/swap/usePoolLiquidityV4.ts
import { useReadContract } from "wagmi";
import { encodeAbiParameters, keccak256, type Abi } from "viem";
import { StateViewABIBase } from "@/config/abis/StateViewABIBase";
import { PoolKey } from "@uniswap/v4-sdk";
import { PoolLiquidityResult } from "./types";
import { useUniswapContract } from "./useUniswapContract";

function getPoolId(poolKey: PoolKey): `0x${string}` {
  const encoded = encodeAbiParameters(
    [
      { type: "address", name: "currency0" },
      { type: "address", name: "currency1" },
      { type: "uint24", name: "fee" },
      { type: "int24", name: "tickSpacing" },
      { type: "address", name: "hooks" },
    ],
    [
      poolKey.currency0 as `0x${string}`,
      poolKey.currency1 as `0x${string}`,
      poolKey.fee,
      poolKey.tickSpacing,
      poolKey.hooks as `0x${string}`,
    ]
  );

  return keccak256(encoded);
}

/**
 * usePoolLiquidityV4
 *
 * Hook to check V4 pool existence and liquidity via StateView contract.
 */
export function usePoolLiquidityV4(poolKey: PoolKey): PoolLiquidityResult {
  const stateView = useUniswapContract("stateView") as `0x${string}`;

  const poolId =
    poolKey?.currency0 && poolKey?.currency1 ? getPoolId(poolKey) : undefined;

  // Check slot0 to determine if pool exists
  const {
    data: slot0Data,
    isLoading: isLoadingSlot0,
    error: slot0Error,
  } = useReadContract({
    address: stateView,
    abi: StateViewABIBase as Abi,
    functionName: "getSlot0",
    args: poolId ? [poolId] : undefined,
    query: { enabled: !!poolId && !!stateView },
  });

  // Get liquidity
  const {
    data: liquidityData,
    isLoading: isLoadingLiquidity,
    error: liquidityError,
  } = useReadContract({
    address: stateView,
    abi: StateViewABIBase as Abi,
    functionName: "getLiquidity",
    args: poolId ? [poolId] : undefined,
    query: { enabled: !!poolId && !!stateView },
  });

  // Pool exists if sqrtPriceX96 > 0
  const poolExists = (() => {
    if (!slot0Data) return false;
    const sqrtPriceX96 = (slot0Data as unknown[])[0] as bigint;
    return sqrtPriceX96 > 0n;
  })();

  const liquidity = liquidityData ? BigInt(liquidityData.toString()) : null;

  return {
    liquidity,
    isLoading: isLoadingSlot0 || isLoadingLiquidity,
    error: (slot0Error || liquidityError) as Error | null,
    poolExists,
  };
}
