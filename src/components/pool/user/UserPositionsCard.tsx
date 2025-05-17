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
    <span className={colorClass}>
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
      pool.oraclePrice
    );

  const assetAmount = userPosition
    ? Number(userPosition.assetAmount) / 1e18
    : 0;

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Positions
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
            Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-red-500">
            Error loading positions: {error.message}
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
              <td className="py-2 text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2">
                <a
                  href={getExplorerUrl(pool.assetTokenAddress, chainId)}
                  target="_blank"
                  className="text-white"
                >
                  {pool.assetTokenSymbol}
                  <ExternalLink size={14} />
                </a>
              </td>
              <td className="py-2">{formatNumber(assetAmount)}</td>
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
