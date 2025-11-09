"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui/BaseComponents";
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { Pool } from "@/types/pool";
import { LPData } from "@/types/lp";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useLiquidityManagement } from "@/hooks/lp";
import { formatTokenBalance } from "@/utils";

interface LPExitPoolCardProps {
  pool: Pool;
  lpData: LPData;
}

export const LPExitPoolCard: React.FC<LPExitPoolCardProps> = ({
  pool,
  lpData,
}) => {
  const { address } = useAccount();

  const { exitPool, isLoading } = useLiquidityManagement(
    pool.liquidityManagerAddress,
    pool.reserveTokenAddress,
    pool.reserveTokenDecimals
  );

  // Get LP's current liquidity commitment from position
  const currentLiquidityCommitment = lpData.lpPosition?.liquidityCommitment
    ? Number(
        formatUnits(
          lpData.lpPosition.liquidityCommitment,
          pool.reserveTokenDecimals
        )
      )
    : 0;

  // Get LP's current collateral
  const currentCollateral = lpData.lpPosition?.collateralAmount
    ? Number(
        formatUnits(
          lpData.lpPosition.collateralAmount,
          pool.reserveTokenDecimals
        )
      )
    : 0;

  // Get LP's accrued interest
  const accruedInterest = lpData.lpPosition?.interestAccrued
    ? Number(
        formatUnits(
          lpData.lpPosition.interestAccrued,
          pool.reserveTokenDecimals
        )
      )
    : 0;

  // Handle exit pool action
  const handleExitPool = async () => {
    if (!address) return;

    try {
      await exitPool();
    } catch (error) {
      console.error("Failed to exit pool:", error);
    }
  };

  // Check if LP has any position to exit
  const hasPosition = currentLiquidityCommitment > 0 || currentCollateral > 0;

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="px-4 py-2 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Emergency Exit Pool
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 py-4 space-y-4">
        {/* Warning Message */}
        <div className="flex items-start gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Pool is Halted</p>
            <p className="text-xs text-red-300">
              This pool is currently halted. You can exit your entire LP
              position to recover your liquidity commitment, collateral, and any
              accrued interest.
            </p>
          </div>
        </div>

        {/* Position Info */}
        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Liquidity Commitment:</span>
            <span className="text-white font-medium">
              {formatTokenBalance(String(currentLiquidityCommitment))}{" "}
              {pool.reserveToken}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Collateral:</span>
            <span className="text-white font-medium">
              {formatTokenBalance(String(currentCollateral))}{" "}
              {pool.reserveToken}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Accrued Interest:</span>
            <span className="text-green-400 font-medium">
              {formatTokenBalance(accruedInterest.toString())}{" "}
              {pool.reserveToken}
            </span>
          </div>
          <div className="pt-2 mt-2 border-t border-gray-700">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-300">Total to Recover:</span>
              <span className="text-white">
                {formatTokenBalance(
                  String(currentCollateral + accruedInterest)
                )}{" "}
                {pool.reserveToken}
              </span>
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <Button
          onClick={handleExitPool}
          disabled={isLoading || !hasPosition}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {!hasPosition ? "No Position to Exit" : "Exit Pool"}
        </Button>

        {/* Info Message */}
        <div className="flex items-start gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-lg text-xs">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            When you exit, you will receive your deposited collateral and any
            accrued interest.This action will completely remove your LP position
            from the pool.
          </p>
        </div>

        {!hasPosition && (
          <div className="flex items-start gap-2 text-yellow-400 bg-yellow-500/10 p-3 rounded-lg text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>You have no active LP position to exit.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
