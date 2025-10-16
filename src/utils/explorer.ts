// Base Sepolia explorer URL
const BASE_SEPOLIA_EXPLORER = "https://sepolia.basescan.org";
const BASE_MAINNET_EXPLORER = "https://basescan.org";

export const getExplorerUrl = (address: string, chainId: number): string => {
  switch (chainId) {
    case 8453: // Base Mainnet chain ID
      return `${BASE_MAINNET_EXPLORER}/address/${address}`;
    case 84532: // Base Sepolia chain ID
      return `${BASE_SEPOLIA_EXPLORER}/address/${address}`;
    default:
      return `${BASE_MAINNET_EXPLORER}/address/${address}`;
  }
};

export const getTxnExplorerUrl = (txHash: string, chainId: number): string => {
  switch (chainId) {
    case 8453: // Base Mainnet chain ID
      return `${BASE_MAINNET_EXPLORER}/tx/${txHash}`;
    case 84532: // Base Sepolia chain ID
      return `${BASE_SEPOLIA_EXPLORER}/tx/${txHash}`;
    default:
      return `${BASE_MAINNET_EXPLORER}/tx/${txHash}`;
  }
};
