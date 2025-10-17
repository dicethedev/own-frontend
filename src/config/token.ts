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
      address: "0x4e7a6fc2F3A8815be67Abd00fC423a409C545A22" as Address,
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
      symbol: "xTSLA",
      name: "Tesla",
      logo: "/icons/tesla-logo.svg",
      decimals: 18,
      address: "0xF61f572488711a470f6c129De5c1904C2ACabbf4" as Address,
      type: "RWA",
    },
    {
      symbol: "xAAPL",
      name: "Apple",
      logo: "/icons/apple-logo.svg",
      decimals: 18,
      address: "0xf61a0A765432a5aa0261d09FaFAB529Dd2b69207" as Address,
      type: "RWA",
    },
    {
      symbol: "xNVDA",
      name: "Nvidia",
      logo: "/icons/nvidia-logo.svg",
      decimals: 18,
      address: "0x875Cc2D531D89fbb92Ce1664F562E121614D3247" as Address,
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
