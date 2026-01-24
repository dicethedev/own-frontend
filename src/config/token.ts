import { Token as UniToken, ChainId } from "@uniswap/sdk-core";
import { Address } from "viem";
import { supportedChains, BASE_MAINNET_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID, defaultChain } from "@/lib/chains.config";
import { Token, TokenType } from "../types/token";

// -----------------------------
// Tokens by chain
// -----------------------------
const ALL_TOKENS_BY_CHAIN: Record<number, Token[]> = {
  [BASE_MAINNET_CHAIN_ID]: [
    {
      symbol: "USDC",
      name: "USD Coin",
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
  [BASE_SEPOLIA_CHAIN_ID]: [
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

// Export only tokens for supported chains in current environment
export const tokensByChain: Record<number, Token[]> = supportedChains.reduce(
  (acc, chain) => {
    const tokens = ALL_TOKENS_BY_CHAIN[chain.id];
    if (tokens) {
      acc[chain.id] = tokens;
    }
    return acc;
  },
  {} as Record<number, Token[]>
);


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

// export function getTokens(chainId: number, type?: TokenType): Token[] {
//   const list = tokensByChain[chainId];
//   if (!list) throw new Error(`No tokens configured for chain ${chainId}`);
//   return type ? list.filter((t) => t.type === type) : list;
// }

/**
 * Get tokens for a chain. Returns empty array if chain not supported in current environment.
 * @param chainId - The chain ID to get tokens for
 * @param type - Optional token type filter
 * @param fallbackToDefault - If true, returns default chain tokens when requested chain not available
 */
export function getTokens(
  chainId: number, 
  type?: TokenType,
  fallbackToDefault: boolean = true
): Token[] {
  let list = tokensByChain[chainId];
  
  // If chain not supported in current environment, use default chain
  if (!list && fallbackToDefault) {
    console.warn(
      `Chain ${chainId} not supported in current environment. Using default chain ${defaultChain.id}`
    );
    list = tokensByChain[defaultChain.id];
  }
  
  // If still no list, return empty array
  if (!list) {
    console.warn(`No tokens configured for chain ${chainId}`);
    return [];
  }
  
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
