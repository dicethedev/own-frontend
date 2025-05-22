// src/config/contracts.ts
import { baseSepolia } from "viem/chains";
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
  [baseSepolia.id]: {
    assetPoolFactory: {
      address: "0x6eA99f37b4c3ad5B3353cF7CBf7db916fd78ee63" as Address,
      chainId: baseSepolia.id,
    },
    protocolRegistry: {
      address: "0xCEaBF7ed92bCA91920316f015C92F61a4F8bE761" as Address,
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
