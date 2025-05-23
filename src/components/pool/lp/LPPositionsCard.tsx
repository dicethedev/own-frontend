import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { LPData } from "@/types/lp";
import { formatUnits } from "viem";
import { Loader2 } from "lucide-react";

interface LPPositionsCardProps {
  pool: Pool;
  lpData: LPData;
}

export const LPPositionsCard: React.FC<LPPositionsCardProps> = ({
  pool,
  lpData,
}) => {
  const { isLP, lpPosition, isLoading, error } = lpData;
  const lpCommitment =
    Number(
      formatUnits(
        lpPosition?.liquidityCommitment ?? BigInt(0),
        pool.reserveTokenDecimals
      )
    ) || 0;

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            LP Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            LP Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-red-500">
            Error loading LP positions: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state for non-LPs
  if (!isLP || !lpPosition || lpCommitment <= 0) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            LP Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-gray-400">No active LP positions</p>
        </CardContent>
      </Card>
    );
  }

  // Get health status color
  const getHealthColor = (health: number) => {
    switch (health) {
      case 3:
        return "text-green-500";
      case 2:
        return "text-yellow-500";
      case 1:
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getHealthText = (health: number) => {
    switch (health) {
      case 3:
        return "Healthy";
      case 2:
        return "Warning";
      case 1:
        return "Liquidatable";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          LP Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Position Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Liquidity Commitment</p>
              <p className="text-white font-medium text-lg">
                {formatUnits(
                  lpPosition.liquidityCommitment,
                  pool.reserveTokenDecimals
                )}{" "}
                {pool.reserveToken}
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Collateral Amount</p>
              <p className="text-white font-medium text-lg">
                {formatUnits(
                  lpPosition.collateralAmount,
                  pool.reserveTokenDecimals
                )}{" "}
                {pool.reserveToken}
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Interest Accrued</p>
              <p className="text-green-400 font-medium text-lg">
                {formatUnits(
                  lpPosition.interestAccrued,
                  pool.reserveTokenDecimals
                )}{" "}
                {pool.reserveToken}
              </p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Position Health</p>
                <p
                  className={`font-medium ${getHealthColor(
                    lpPosition.liquidityHealth
                  )}`}
                >
                  {getHealthText(lpPosition.liquidityHealth)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Asset Share</p>
                <p className="text-white font-medium">
                  {lpPosition.assetShare
                    ? formatUnits(lpPosition.assetShare, 18)
                    : "0"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Last Rebalanced</p>
                <p className="text-white font-medium">
                  Cycle #{lpPosition.lastRebalanceCycle?.toString() || "Never"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
