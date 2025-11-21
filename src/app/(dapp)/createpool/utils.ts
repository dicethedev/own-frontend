// utils for creating uniswap v4 pool
// fetch token name and synbol from address
// using erc20 abi

import { erc20ABI } from "@/config/abis/erc20";
import { PoolKey } from "@uniswap/v4-sdk";
import { encodeAbiParameters, keccak256 } from "viem";
import { Config } from "wagmi";
import { readContract } from "wagmi/actions";

export const getTokenDetailsFromAddress = async (
  tokenAddress: string,
  config: Config
) => {
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
    }),
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

// Currency doesn't need to be in increasing order of address
export const TOKEN_PAIRS = [
  {
    currency0: "0xFfd42d60f82A6117d113A6aFC0958c6d53060713", // AI7
    currency1: "0x82eECDd667D68961045B18B38501ef391ff71b25", // USDT
    name: "AI7/USDT",
    description: "AI7 Index Token / Tether USD",
  },
  {
    currency0: "0xb2DEB620Ad02dB6dEdB3f63C2113758EC4e2a4E8", // TSLA
    currency1: "0x82eECDd667D68961045B18B38501ef391ff71b25", // USDT
    name: "TSLA/USDT",
    description: "Tesla Token / Tether USD",
  },
  {
    currency0: "0xB5dBea4a6031AdBa6e9368da887647C3ea83d546", // NVDA
    currency1: "0x82eECDd667D68961045B18B38501ef391ff71b25", // USDT
    name: "NVDA/USDT",
    description: "NVIDIA Token / Tether USD",
  },
];

// 1tGAURI (currency0) = 258 tUSDC (currency1)
// currency0/currency1 = 258

// 1xTSLA (currency1) = 429 USDC (currency0)
// currency0/currency1 = 429
