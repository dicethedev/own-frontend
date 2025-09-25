import { useReadContract } from "wagmi";
import { encodeAbiParameters, keccak256, type Abi } from "viem";
import { useUniswapContract } from "./useUniswapContract";
import { StateViewABIBase } from "@/config/abis/StateViewABIBase";
import { PoolKey } from "@uniswap/v4-sdk";

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

export function usePoolLiquidity(poolKey: PoolKey) {
  const stateView = useUniswapContract("stateView");

  const poolId =
    poolKey?.currency0 && poolKey?.currency1 ? getPoolId(poolKey) : undefined;

  const { data, isLoading, error } = useReadContract({
    address: stateView! as `0x${string}`,
    abi: StateViewABIBase as Abi,
    functionName: "getLiquidity",
    args: poolId ? [poolId as `0x${string}`] : undefined,
    query: { enabled: !!poolId },
  });

  return { data, isLoading, error };
}
