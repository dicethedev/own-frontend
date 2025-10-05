// utils for creating uniswap v4 pool
// fetch token name and synbol from address
// using erc20 abi

import { erc20ABI } from "@/config/abis/erc20";
import { PoolKey } from "@uniswap/v4-sdk";
import { Currency } from "lucide-react";
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
    currency1: "0x7bD1331A7c4E32F3aD9Ca14Ad0E7FAb0d4F380Ec", // USDC
    name: "xAAPL/USDC",
    description: "Apple Token / USD Coin"
  },
  {
    currency0: "0xD6f8511E177f85f9F0411C249699a2bC9abAAfB1", // xTSLA
    currency1: "0x7bD1331A7c4E32F3aD9Ca14Ad0E7FAb0d4F380Ec", // USDC
    name: "xTSLA/USDC",
    description: "Tesla Token / USD Coin"
  },
  {
    currency0: "0xb05A67633431a0c2b0f97eCa2961be43a3BD8764", // tGAURI
    currency1: "0xEb7fDfe90B9B96CA23DC0011ab96e9B58B35E4aB", // tUSDC
    name: "tGAURI/tUSDC",
    description: "tGAURI / tUSDC"
  },
  {
    currency0: "0xE26ad20F878512d1D850cB6b27545Dfb493e13B5", // tSHIV
    currency1: "0x224C035B48265B6CDB9E873449C41E6B39b90441", // tUSDT
    name: "tSHIV/tUSDT",
    description: "tSHIV / tUSDT"
  },
  {
    currency0: "0xE26ad20F878512d1D850cB6b27545Dfb493e13B5", // tSHIV
    currency1: "0x7bD1331A7c4E32F3aD9Ca14Ad0E7FAb0d4F380Ec", // USDC
    name: "tSHIV/USDC",
    description: "tSHIV / USDC"
  }
]

// 1tGAURI (currency0) = 258 tUSDC (currency1)
// currency0/currency1 = 258

// 1xTSLA (currency1) = 429 USDC (currency0)
// currency0/currency1 = 429
