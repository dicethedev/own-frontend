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
      symbol: "AI7",
      name: "AI7 Index",
      logo: "/icons/ai7-logo.svg",
      decimals: 18,
      address: "0x2567563f230A3A30A5ba9de84157E0449c00EB36" as Address,
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
      symbol: "AI7",
      name: "AI7 Index",
      logo: "/icons/ai7-logo.svg",
      decimals: 18,
      address: "0xFfd42d60f82A6117d113A6aFC0958c6d53060713" as Address,
      type: "RWA",
    },
    {
      symbol: "TSLA",
      name: "Tesla",
      logo: "/icons/tesla-logo.svg",
      decimals: 18,
      address: "0xb2DEB620Ad02dB6dEdB3f63C2113758EC4e2a4E8" as Address,
      type: "RWA",
    },
    {
      symbol: "NVDA",
      name: "Nvidia",
      logo: "/icons/nvidia-logo.svg",
      decimals: 18,
      address: "0xB5dBea4a6031AdBa6e9368da887647C3ea83d546" as Address,
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
