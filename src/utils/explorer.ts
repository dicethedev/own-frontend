export const getExplorerUrl = (address: string, chainId: number): string => {
  // Base Sepolia explorer URL
  const BASE_SEPOLIA_EXPLORER = "https://sepolia.basescan.org";

  switch (chainId) {
    case 84532: // Base Sepolia chain ID
      return `${BASE_SEPOLIA_EXPLORER}/address/${address}`;
    default:
      return `${BASE_SEPOLIA_EXPLORER}/address/${address}`;
  }
};
