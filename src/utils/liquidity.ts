import { formatUnits } from "viem";
import { Pool } from "@/types/pool";

/**
 * Calculate available liquidity for deposits
 * @param pool Pool data
 * @returns Available liquidity amount in formatted units
 */
export function calculateAvailableLiquidity(pool: Pool): {
  availableLiquidity: number;
  totalCommitment: number;
  currentUtilization: number;
  utilizationRatio: number;
} {
  // Get total LP commitment
  const totalCommitment = pool.totalLPLiquidityCommited
    ? Number(
        formatUnits(pool.totalLPLiquidityCommited, pool.reserveTokenDecimals)
      )
    : 0;

  // Get current user deposits (utilization)
  const currentUtilization = pool.totalUserDeposits
    ? Number(formatUnits(pool.totalUserDeposits, pool.reserveTokenDecimals))
    : 0;

  // Calculate utilization ratio (as percentage)
  const utilizationRatio =
    totalCommitment > 0 ? (currentUtilization / totalCommitment) * 100 : 0;

  // Available liquidity = total commitment - current utilization
  const availableLiquidity = Math.max(0, totalCommitment - currentUtilization);

  return {
    availableLiquidity,
    totalCommitment,
    currentUtilization,
    utilizationRatio,
  };
}

/**
 * Check if a deposit amount exceeds available liquidity
 * @param depositAmount Deposit amount as string
 * @param availableLiquidity Available liquidity amount
 * @returns Boolean indicating if deposit exceeds available liquidity
 */
export function doesDepositExceedLiquidity(
  depositAmount: string,
  availableLiquidity: number
): boolean {
  if (!depositAmount || isNaN(Number(depositAmount))) return false;
  return Number(depositAmount) > availableLiquidity;
}

/**
 * Format liquidity amount for display
 * @param amount Liquidity amount
 * @param tokenSymbol Token symbol
 * @returns Formatted string
 */
export function formatLiquidityAmount(
  amount: number,
  tokenSymbol: string
): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${tokenSymbol}`;
}
