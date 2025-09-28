import { Token as UniToken, ChainId } from "@uniswap/sdk-core";
import { Token } from "@/app/(dapp)/trade/components/types";

// Raw token data for UI dropdowns
export const tokenListRWA: Token[] = [
  {
    symbol: "xTSLA",
    name: "Tesla",
    logo: "/icons/tesla-logo.svg",
    decimals: 18,
    address: "0x7c83487569ce805217C58E02D8D52980D8482508" as `0x${string}`,
  },
];

export const tokenList: Token[] = [
  {
    symbol: "USDC",
    name: "USD",
    logo: "/icons/usdc-logo.png",
    decimals: 6,
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  },
];

// UniToken instances for swap logic
export const XTSLA_UNI = new UniToken(
  ChainId.BASE,
  "0x7c83487569ce805217C58E02D8D52980D8482508",
  18,
  "xTSLA",
  "Tesla"
);

export const USDC_UNI = new UniToken(
  ChainId.BASE,
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  6,
  "USDC",
  "USD"
);

//convert to uniswap token
export function convertToUniToken(token: Token): UniToken {
  if (!token.decimals) throw new Error("Token decimals missing");
  return new UniToken(
    ChainId.BASE,
    token.address,
    token.decimals,
    token.symbol,
    token.name
  );
}
