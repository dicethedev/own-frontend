import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { useAssetToken } from "@/hooks/pool";
import { Pool } from "@/types/pool";

interface UserPositionsCardProps {
  pool: Pool;
}

// Utility function to format numbers based on their value
const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString(undefined, {
    minimumSignificantDigits: 2,
    maximumSignificantDigits: 4,
  });
};

// Utility function to format currency
const formatCurrency = (value: number): string => {
  return `$${formatNumber(value)}`;
};

// Utility function to format PNL with color and percentage
const formatPNL = (pnlValue: number, pnlPercentage: number): JSX.Element => {
  const isPositive = pnlValue >= 0;
  const colorClass = isPositive ? "text-green-500" : "text-red-500";

  return (
    <span className={colorClass}>
      {formatCurrency(pnlValue)} ({isPositive ? "+" : ""}
      {pnlPercentage.toFixed(2)}%)
    </span>
  );
};

export const UserPositionsCard: React.FC<UserPositionsCardProps> = ({
  pool,
}) => {
  const { balance, reserveBalance, isLoading } = useAssetToken(
    pool.assetTokenAddress
  );

  const balanceNum = parseFloat(balance);
  const reserveBalanceNum = parseFloat(reserveBalance);

  // Calculate position details
  const positionValue = balanceNum * pool.assetPrice;
  const entryPrice = balanceNum > 0 ? reserveBalanceNum / balanceNum : 0;
  const pnlValue = balanceNum * (pool.assetPrice - entryPrice);
  const pnlPercentage =
    entryPrice > 0 ? ((pool.assetPrice - entryPrice) / entryPrice) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-gray-400">Loading positions...</p>
        </CardContent>
      </Card>
    );
  }

  if (balanceNum <= 0) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-gray-400">No open positions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pb-4">Token</th>
              <th className="pb-4">Size</th>
              <th className="pb-4">Position Value</th>
              <th className="pb-4">Entry Price</th>
              <th className="pb-4">PNL</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-white">
              <td className="py-2">{pool.assetTokenSymbol}</td>
              <td className="py-2">{formatNumber(balanceNum)}</td>
              <td className="py-2">{formatCurrency(positionValue)}</td>
              <td className="py-2">{formatCurrency(entryPrice)}</td>
              <td className="py-2">{formatPNL(pnlValue, pnlPercentage)}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
