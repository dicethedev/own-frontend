"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { getExplorerUrl } from "@/utils/explorer";
import { useChainId } from "wagmi";
import { ExternalLink, Loader2 } from "lucide-react";
import { UserData } from "@/types/user";
import {
  calculateUserPositionMetrics,
  formatCurrency,
  formatNumber,
} from "@/hooks/user";

interface UserPositionsCardProps {
  pool: Pool;
  userData: UserData;
}

// Utility function to format PNL with color and percentage
const formatPNL = (pnlValue: number, pnlPercentage: number): JSX.Element => {
  const isPositive = pnlValue >= 0;
  const colorClass = isPositive ? "text-green-500" : "text-red-500";
  return (
    <span className={colorClass} data-testid="pnl-value">
      {formatCurrency(pnlValue)} ({isPositive ? "+" : ""}
      {pnlPercentage.toFixed(2)}%)
    </span>
  );
};

export const UserPositionsCard: React.FC<UserPositionsCardProps> = ({
  pool,
  userData,
}) => {
  const chainId = useChainId();
  const { userPosition, isLoading, error, isUser } = userData;

  // Calculate position details using our helper function
  const { positionValue, entryPrice, pnlValue, pnlPercentage } =
    calculateUserPositionMetrics(
      userPosition,
      pool.assetPrice,
      pool.assetTokenDecimals,
      pool.reserveTokenDecimals,
      pool.oraclePrice
    );

  const assetAmount = userPosition
    ? Number(userPosition.assetAmount) / 10 ** pool.assetTokenDecimals
    : 0;

  const depositAmount = userPosition
    ? Number(userPosition.depositAmount) / 10 ** pool.reserveTokenDecimals
    : 0;

  const collateralAmount = userPosition
    ? Number(userPosition.collateralAmount) / 10 ** pool.reserveTokenDecimals
    : 0;

  const interestPaid = 0;

  const interestPaidPercentage =
    depositAmount > 0 ? (interestPaid / depositAmount) * 100 : 0;

  const positionHealth = 3;

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

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Position
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex justify-center items-center">
          <Loader2
            role="status"
            className="w-6 h-6 animate-spin text-blue-500"
          />
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
            Position
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-red-500">
            Error loading position: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (!isUser || assetAmount <= 0) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Position
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-gray-400">No open position yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          Position
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Position Details */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Asset</p>
                <a
                  href={getExplorerUrl(pool.assetTokenAddress, chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-300 hover:underline transition-colors font-medium inline-flex items-center gap-1"
                >
                  {pool.assetTokenSymbol}
                  <ExternalLink size={14} />
                </a>
                <p className="text-gray-400 text-xs">{pool.assetName}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Position Size</p>
                <p className="text-white font-medium">
                  {formatNumber(assetAmount)} {pool.assetTokenSymbol}
                </p>
                <p className="text-gray-400 text-xs">
                  {formatCurrency(positionValue)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Entry Price</p>
                <p className="text-white font-medium">
                  {formatCurrency(entryPrice)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">
                  Profit & Loss (PNL)
                </p>
                <p className="font-medium">
                  {formatPNL(pnlValue, pnlPercentage)}
                </p>
              </div>
            </div>
          </div>

          {/* Position Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Deposit Amount</p>
              <p className="text-white font-medium text-lg">
                {formatCurrency(depositAmount)}
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Collateral Amount</p>
              <p className="text-white font-medium text-lg">
                {formatCurrency(collateralAmount)}
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Interest Paid</p>
              <p className="text-white font-medium text-lg">
                {formatCurrency(interestPaid)}
                {interestPaid > 0 && (
                  <span className="text-sm ml-1">
                    (+{interestPaidPercentage.toFixed(2)}%)
                  </span>
                )}
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Position Health</p>
              <p className={`font-medium ${getHealthColor(positionHealth)}`}>
                {getHealthText(positionHealth)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
