// src/config/contracts.ts
import {
  supportedChains,
  BASE_MAINNET_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  defaultChain,
} from "@/lib/chains.config";
import { Address } from "viem";

export interface ContractConfig {
  address: Address;
  chainId: number;
}

export interface ChainContracts {
  assetPoolFactory: ContractConfig;
  protocolRegistry: ContractConfig;
}

// All contract addresses (both environments)
const ALL_CONTRACTS: Record<number, ChainContracts> = {
  [BASE_MAINNET_CHAIN_ID]: {
    assetPoolFactory: {
      address: "0xC8e4cc79da89FCFaF4436f5e9F9fFCE0D2850378" as Address,
      chainId: BASE_MAINNET_CHAIN_ID,
    },
    protocolRegistry: {
      address: "0xBB9f34413f48aE7520acdedC4f07b110860c1534" as Address,
      chainId: BASE_MAINNET_CHAIN_ID,
    },
  },
  [BASE_SEPOLIA_CHAIN_ID]: {
    assetPoolFactory: {
      address: "0xC0166Fd0F9269B7031477C8098E27E8dDb761D54" as Address,
      chainId: BASE_SEPOLIA_CHAIN_ID,
    },
    protocolRegistry: {
      address: "0xdE65370F905999eaEC9a3612874752C301324cF7" as Address,
      chainId: BASE_SEPOLIA_CHAIN_ID,
    },
  },
};

// Export only contracts for supported chains in current environment
export const contracts: Record<number, ChainContracts> = supportedChains.reduce(
  (acc, chain) => {
    const chainContracts = ALL_CONTRACTS[chain.id];
    if (chainContracts) {
      acc[chain.id] = chainContracts;
    }
    return acc;
  },
  {} as Record<number, ChainContracts>,
);

export const getContractConfig = (
  chainId: number,
  fallbackToDefault: boolean = true,
): ChainContracts => {
  let chainContracts = contracts[chainId];

  // Fallback to default chain if requested chain not available
  if (!chainContracts && fallbackToDefault) {
    console.warn(
      `Chain ${chainId} not supported in current environment. Using default chain ${defaultChain.id}`,
    );
    chainContracts = contracts[defaultChain.id];
  }

  if (!chainContracts) {
    throw new Error(`No contracts configured for chain ${chainId}`);
  }

  return chainContracts;
};

// Uniswap contracts configuration
const ALL_UNISWAP_CONTRACTS: Record<number, Record<string, string>> = {
  [BASE_MAINNET_CHAIN_ID]: {
    // Base Mainnet - v3 specific
    quoter: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    factory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    swapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
    universalRouter: "0x6ff5693b99212da76ad316178a184ab56d299b43",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  },
  [BASE_SEPOLIA_CHAIN_ID]: {
    // Base Sepolia - v4 specific
    quoter: "0x4a6513c898fe1b2d0e78d3b0e0a4a151589b1cba",
    positionDescriptor: "0x571291b572ed32ce6751a2cb2486ebee8defb9b4",
    poolManager: "0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408",
    positionManager: "0x4b2c77d209d3405f41a037ec6c77f7f5b8e2ca80",
    stateView: "0x571291b572ed32ce6751a2cb2486ebee8defb9b4",
    universalRouter: "0x492e6456d9528771018deb9e87ef7750ef184104",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  },
  // more chains later...
};

// Export only Uniswap contracts for supported chains
export const UNISWAP_CONTRACTS: Record<
  number,
  Record<string, string>
> = supportedChains.reduce(
  (acc, chain) => {
    const uniswapContracts = ALL_UNISWAP_CONTRACTS[chain.id];
    if (uniswapContracts) {
      acc[chain.id] = uniswapContracts;
    }
    return acc;
  },
  {} as Record<number, Record<string, string>>,
);

// Helper to determine which pool version to use
export const getPoolVersion = (chainId: number): "v3" | "v4" => {
  switch (chainId) {
    case BASE_MAINNET_CHAIN_ID: // Base Mainnet
      return "v3";
    case BASE_SEPOLIA_CHAIN_ID: // Base Sepolia
      return "v4";
    default:
      return "v3";
  }
};

// Helper to get Uniswap contracts for a specific chain
export const getUniswapContracts = (
  chainId: number,
): Record<string, string> => {
  const contracts = UNISWAP_CONTRACTS[chainId];
  if (!contracts) {
    throw new Error(`No Uniswap contracts configured for chain ${chainId}`);
  }
  return contracts;
};
