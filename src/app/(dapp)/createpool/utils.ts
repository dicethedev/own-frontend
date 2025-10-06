// utils for creating uniswap v4 pool
// fetch token name and synbol from address
// using erc20 abi

import { erc20ABI } from "@/config/abis/erc20";
import { PoolKey } from "@uniswap/v4-sdk";
import { encodeAbiParameters, keccak256 } from "viem";
import { Config } from "wagmi";
import { readContract } from "wagmi/actions";

export const getTokenDetailsFromAddress = async (tokenAddress: string, config: Config) => {
  const [name, symbol, decimals] = await Promise.all([
    readContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: erc20ABI,
      functionName: "name",
    }),
    readContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: erc20ABI,
      functionName: "symbol",
    }),
    readContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: erc20ABI,
      functionName: "decimals",
    })
  ]);
  return {
    name,
    symbol,
    decimals,
  };
};

export function getPoolId(poolKey: PoolKey): `0x${string}` {
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


export const TOKEN_PAIRS = [
  {
    currency0: "0x19aA79C04E6662012E80B5Dc9A7582C62559e503", // xNVDA
    currency1: "0x82eECDd667D68961045B18B38501ef391ff71b25", // USDT
    name: "xNVDA/USDT",
    description: "NVIDIA Token / Tether USD"
  },
  {
    currency0: "0xf9777dFdD4Ff1cCd310b6aD430Ded701f489f905", // xAAPL
    currency1: "0x82eECDd667D68961045B18B38501ef391ff71b25", // USDT
    name: "xAAPL/USDT",
    description: "Apple Token / Tether USD"
  },
  {
    currency0: "0xD6f8511E177f85f9F0411C249699a2bC9abAAfB1", // xTSLA
    currency1: "0x82eECDd667D68961045B18B38501ef391ff71b25", // USDT
    name: "xTSLA/USDT",
    description: "Tesla Token / Tether USD"
  },
]

// 1tGAURI (currency0) = 258 tUSDC (currency1)
// currency0/currency1 = 258

// 1xTSLA (currency1) = 429 USDC (currency0)
// currency0/currency1 = 429
