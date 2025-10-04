import { Token as UniToken, ChainId } from "@uniswap/sdk-core";
import { Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { Token, TokenType } from "../types/token";

// -----------------------------
// Tokens by chain
// -----------------------------
export const tokensByChain: Record<number, Token[]> = {
  [base.id]: [
    {
      symbol: "USDC",
      name: "USD",
      logo: "/icons/usdc-logo.png",
      decimals: 6,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
      type: "STABLECOIN",
    },
    {
      symbol: "xTSLA",
      name: "Tesla",
      logo: "/icons/tesla-logo.svg",
      decimals: 18,
      address: "0x7c83487569ce805217C58E02D8D52980D8482508" as Address,
      type: "RWA",
    },
  ],
  [baseSepolia.id]: [
    {
      symbol: "USDT",
      name: "Tether USD",
      logo: "/icons/usdt-logo.png",
      decimals: 18,
      address: "0x82eECDd667D68961045B18B38501ef391ff71b25" as Address,
      type: "STABLECOIN",
    },
    {
      symbol: "USDC",
      name: "USDC",
      logo: "/icons/usdc-logo.png",
      decimals: 6,
      address: "0x7bD1331A7c4E32F3aD9Ca14Ad0E7FAb0d4F380Ec" as Address,
      type: "STABLECOIN",
    },
    {
      symbol: "xNVDA",
      name: "Nvidia",
      logo: "/icons/nvidia-logo.svg",
      decimals: 18,
      address: "0x19aA79C04E6662012E80B5Dc9A7582C62559e503" as Address,
      type: "RWA",
    },
    {
      symbol: "xAAPL",
      name: "Apple",
      logo: "/icons/apple-logo.svg",
      decimals: 18,
      address: "0xf9777dFdD4Ff1cCd310b6aD430Ded701f489f905" as Address,
      type: "RWA",
    },
    {
      symbol: "xTSLA",
      name: "Tesla",
      logo: "/icons/tesla-logo.svg",
      decimals: 18,
      address: "0xD6f8511E177f85f9F0411C249699a2bC9abAAfB1" as Address,
      type: "RWA",
    },
  ],
};

// -----------------------------
// Utilities
// -----------------------------
export function convertToUniToken(token: Token, chainId: number): UniToken {
  return new UniToken(
    chainId as ChainId,
    token.address,
    token.decimals,
    token.symbol,
    token.name
  );
}

export function getTokens(chainId: number, type?: TokenType): Token[] {
  const list = tokensByChain[chainId];
  if (!list) throw new Error(`No tokens configured for chain ${chainId}`);
  return type ? list.filter((t) => t.type === type) : list;
}

export function getTokenBySymbol(
  chainId: number,
  symbol: string
): Token | undefined {
  return tokensByChain[chainId]?.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export function getUniTokens(chainId: number, type?: TokenType): UniToken[] {
  return getTokens(chainId, type).map((t) => convertToUniToken(t, chainId));
}
