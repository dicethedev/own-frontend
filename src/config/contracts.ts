// src/config/contracts.ts
import { baseSepolia, base } from "viem/chains";
import { Address } from "viem";

export interface ContractConfig {
  address: Address;
  chainId: number;
}

export interface ChainContracts {
  assetPoolFactory: ContractConfig;
  protocolRegistry: ContractConfig;
}

export const contracts: Record<number, ChainContracts> = {
  [base.id]: {
    assetPoolFactory: {
      address: "0xC8e4cc79da89FCFaF4436f5e9F9fFCE0D2850378" as Address,
      chainId: base.id,
    },
    protocolRegistry: {
      address: "0xBB9f34413f48aE7520acdedC4f07b110860c1534" as Address,
      chainId: base.id,
    },
  },
  [baseSepolia.id]: {
    assetPoolFactory: {
      address: "0xC0166Fd0F9269B7031477C8098E27E8dDb761D54" as Address,
      chainId: baseSepolia.id,
    },
    protocolRegistry: {
      address: "0xdE65370F905999eaEC9a3612874752C301324cF7" as Address,
      chainId: baseSepolia.id,
    },
  },
};

export const getContractConfig = (chainId: number): ChainContracts => {
  const chainContracts = contracts[chainId];
  if (!chainContracts) {
    throw new Error(`No contracts configured for chain ${chainId}`);
  }
  return chainContracts;
};

export const UNISWAP_CONTRACTS: Record<number, Record<string, string>> = {
  8453: {
    // Base
    quoter: "0x0d5e0F971ED27FBfF6c2837bf31316121532048D",
    positionDescriptor: "0x25d093633990dc94bedeed76c8f3cdaa75f3e7d5",
    poolManager: "0x498581ff718922c3f8e6a244956af099b2652b2b",
    positionManager: "0x7c5f5a4bbd8fd63184577525326123b519429bdc",
    stateView: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71",
    universalRouter: "0x6ff5693b99212da76ad316178a184ab56d299b43",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  },
  84532: {
    // Base Sepolia
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
