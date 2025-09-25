

export interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  logo: string;
  decimals?: number;
}


export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  const err = error as { code?: number; message?: string };

  // User rejected the request in their wallet
  if (err.code === 4001) return "You canceled the transaction.";

  // Other common scenarios
  if (err.message?.includes("insufficient funds")) 
    return "You don’t have enough balance to complete this swap.";
  if (err.message?.includes("Slippage")) 
    return "Swap failed due to slippage. Try increasing your slippage tolerance.";
  if (err.message?.includes("Pool has no liquidity")) 
    return "Cannot swap: the pool has insufficient liquidity.";
  if (err.message?.includes("timeout") || err.message?.includes("network")) 
    return "Transaction failed due to network issues. Please try again.";

  // Default fallback
  return err.message || "Swap failed. Please try again.";
}


