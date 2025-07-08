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
      address: "0x59409659e34158244AF69c3E3aE15Ded8bA941A4" as Address,
      chainId: baseSepolia.id,
    },
    protocolRegistry: {
      address: "0x811Ad5f758DB53d8dD3B18890a0cfe5a389e3C72" as Address,
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
