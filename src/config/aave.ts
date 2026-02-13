import { Address } from "viem";
import { base } from "viem/chains";

// =============================================================================
// Aave V3 on Base Mainnet
// =============================================================================

export const AAVE_V3_CONFIG: Record<
  number,
  {
    poolAddress: Address;
    usdcAddress: Address;
    aUsdcAddress: Address;
    usdcDecimals: number;
    aUsdcDecimals: number;
  }
> = {
  [base.id]: {
    poolAddress: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5" as Address, // Aave V3 L2Pool on Base
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // USDC on Base
    aUsdcAddress: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB" as Address, // aBasUSDC on Base
    usdcDecimals: 6,
    aUsdcDecimals: 6,
  },
};

export function getAaveConfig(chainId: number) {
  const config = AAVE_V3_CONFIG[chainId];
  if (!config) return null;
  return config;
}

export function isAaveSupported(chainId: number): boolean {
  return !!AAVE_V3_CONFIG[chainId];
}

// =============================================================================
// Aave V3 Pool ABI (only the functions we need)
// =============================================================================

export const aavePoolABI = [
  {
    type: "function",
    name: "supply",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "onBehalfOf", type: "address", internalType: "address" },
      { name: "referralCode", type: "uint16", internalType: "uint16" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "asset", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "to", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;
