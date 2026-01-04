"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { UserData } from "@/types/user";
import {
  calculateUserPositionMetrics,
  formatCurrency,
  formatNumber,
} from "@/hooks/user";
import { Loader2 } from "lucide-react";

interface UserPositionsCardProps {
  pool: Pool;
  userData: UserData;
}

// Utility function to format PNL with color and percentage
const formatPNL = (pnlValue: number, pnlPercentage: number): JSX.Element => {
  const isPositive = pnlValue >= 0;
  const colorClass = isPositive ? "text-emerald-400" : "text-red-400";
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
        return "text-emerald-400";
      case 2:
        return "text-yellow-400";
      case 1:
        return "text-red-400";
      default:
        return "text-gray-400";
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
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
        <CardHeader className="px-6 py-4 border-b border-[#303136]">
          <CardTitle className="text-lg font-semibold text-white">
            Position
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 role="status" className="w-6 h-6 animate-spin text-white" />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
        <CardHeader className="px-6 py-4 border-b border-[#303136]">
          <CardTitle className="text-lg font-semibold text-white">
            Position
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-400">
            Error loading position: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (!isUser || assetAmount <= 0) {
    return (
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
        <CardHeader className="px-6 py-4 border-b border-[#303136]">
          <CardTitle className="text-lg font-semibold text-white">
            Position
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-400">No active position</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white">
          Position
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Position Value Section */}
          <div className="bg-gradient-to-r from-[#303136]/50 to-[#222325] p-4 rounded-xl border border-[#303136]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Asset Amount</p>
                <p className="text-white font-medium text-lg">
                  {formatNumber(assetAmount)} {pool.assetTokenSymbol}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Position Value</p>
                <p className="text-white font-medium text-lg">
                  {formatCurrency(positionValue)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Entry Price</p>
                <p className="text-white font-medium text-lg">
                  {formatCurrency(entryPrice)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">
                  Profit & Loss (PNL)
                </p>
                <p className="font-medium text-lg">
                  {formatPNL(pnlValue, pnlPercentage)}
                </p>
              </div>
            </div>
          </div>

          {/* Position Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#303136]/50 p-4 rounded-xl">
              <p className="text-gray-400 text-sm mb-1">Deposit Amount</p>
              <p className="text-white font-medium text-lg">
                {formatCurrency(depositAmount)}
              </p>
            </div>

            <div className="bg-[#303136]/50 p-4 rounded-xl">
              <p className="text-gray-400 text-sm mb-1">Collateral Amount</p>
              <p className="text-white font-medium text-lg">
                {formatCurrency(collateralAmount)}
              </p>
            </div>

            <div className="bg-[#303136]/50 p-4 rounded-xl">
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

            <div className="bg-[#303136]/50 p-4 rounded-xl">
              <p className="text-gray-400 text-sm mb-1">Position Health</p>
              <p
                className={`font-medium text-lg ${getHealthColor(
                  positionHealth
                )}`}
              >
                {getHealthText(positionHealth)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
