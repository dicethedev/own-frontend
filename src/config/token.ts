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

export const tokenListRWA_Testnet: Token[] = [
  {
    symbol: "xNVDA",
    name: "Nvidia",
    logo: "/icons/nvda-logo.svg",
    decimals: 18,
    address: "0x19aA79C04E6662012E80B5Dc9A7582C62559e503" as `0x${string}`,
  },
  {
    symbol: "xAAPL",
    name: "Apple",
    logo: "/icons/aapl-logo.svg",
    decimals: 18,
    address: "0xf9777dFdD4Ff1cCd310b6aD430Ded701f489f905" as `0x${string}`,
  },
  {
    symbol: "xTSLA",
    name: "Tesla",
    logo: "/icons/tsla-logo.svg",
    decimals: 18,
    address: "0xD6f8511E177f85f9F0411C249699a2bC9abAAfB1" as `0x${string}`,
  }
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

export const TOKEN_LIST_TESTNET: Token[] = [
  {
    symbol: "USDT",
    name: "Tether USD",
    logo: "/icons/usdt-logo.png",
    decimals: 18,
    address: "0x82eECDd667D68961045B18B38501ef391ff71b25" as `0x${string}`,
  },
  {
    symbol: "USDC",
    name: "USDC",
    logo: "/icons/usdc-logo.png",
    decimals: 6,
    address: "0x7bD1331A7c4E32F3aD9Ca14Ad0E7FAb0d4F380Ec" as `0x${string}`,
  },
];
