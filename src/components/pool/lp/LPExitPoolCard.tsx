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
    <Card className="bg-[#222325] border border-white-500/30 rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          Exit Pool
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Warning Message */}
        <div className="flex items-start gap-2 text-white-400 bg-yellow-500/10 p-4 rounded-xl text-sm border border-yellow-500/20">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Pool Halted</p>
            <p className="text-xs text-white-300">
              This pool is currently halted. You can exit your entire LP
              position to recover your liquidity commitment, collateral, and any
              accrued interest.
            </p>
          </div>
        </div>

        {/* Position Info */}
        <div className="bg-[#303136]/50 rounded-xl p-4 space-y-3">
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
            <span className="text-emerald-400 font-medium">
              {formatTokenBalance(accruedInterest.toString())}{" "}
              {pool.reserveToken}
            </span>
          </div>
          <div className="pt-3 mt-3 border-t border-[#303136]">
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
          className="w-full h-12 rounded-xl"
          variant="primary"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {!hasPosition ? "No Position to Exit" : "Exit Pool"}
        </Button>

        {/* Info Message */}
        <div className="flex items-start gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-xl text-xs">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            When you exit, you will receive your deposited collateral and any
            accrued interest. This action will completely remove your LP
            position from the pool.
          </p>
        </div>

        {!hasPosition && (
          <div className="flex items-start gap-2 text-yellow-400 bg-yellow-500/10 p-3 rounded-xl text-xs">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>You have no active LP position to exit.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
