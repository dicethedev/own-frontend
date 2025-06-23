import { formatUnits } from "viem";

export const formatTokenBalance = (
  balance: string | bigint,
  decimals: number = 18
): string => {
  // If it's a normal human-readable number string (i.e.. from smartcontract)
  if (
    typeof balance === "string" &&
    !balance.includes("e") &&
    !balance.includes(".") &&
    balance.length <= 12
  ) {
    return balance;
  }

  // If balance is a decimal string (already formatted, but has decimals)
  if (typeof balance === "string" && balance.includes(".")) {
    const floatVal = parseFloat(balance);
    return floatVal === 0 ? "0" : floatVal.toFixed(3);
  }

  // Raw bigint or large integer string from contract, format using token decimals
  try {
    const balanceBigInt =
      typeof balance === "string" ? BigInt(balance) : balance;
    const formatted = parseFloat(formatUnits(balanceBigInt, decimals));
    return formatted === 0 ? "0" : formatted.toFixed(3);
  } catch {
    // Fallback: display raw if formatting fails
    return typeof balance === "bigint" ? balance.toString() : balance;
  }
};

export function formatTokenAmount(
  value: bigint,
  decimals: number = 18,
  precision: number = 3
): string {
  const formatted = parseFloat(formatUnits(value, decimals));

  return formatted === 0 ? "0" : Number(formatted).toFixed(precision);
}
