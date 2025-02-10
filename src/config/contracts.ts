// src/config/contracts.ts
import { baseSepolia } from "viem/chains";
import { Address } from "viem";

export interface ContractConfig {
  address: Address;
  chainId: number;
}

export interface ChainContracts {
  assetPoolFactory: ContractConfig;
  lpRegistry: ContractConfig;
}

export const contracts: Record<number, ChainContracts> = {
  [baseSepolia.id]: {
    assetPoolFactory: {
      address: "0x0AE43Ac4d1B35da83D46dC5f78b22501f83E846c" as Address,
      chainId: baseSepolia.id,
    },
    lpRegistry: {
      address: "0x66B2079cfdB9f387Bc08E36ca25097ADeD661e2b" as Address,
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
