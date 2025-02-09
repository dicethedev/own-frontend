import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { TradingViewWidget } from "./TradingViewComponent";
import { useAccount } from "wagmi";
import { UserActionsCard } from "./user/UserActionsCard";
import { UserPositionsCard } from "./user/UserPositionsCard";
import { UnconnectedActionsCard } from "./user/UnconnectedActionsCard";
import { UnconnectedPositionsCard } from "./user/UnconnectedPositionsCard";
import { Loader2 } from "lucide-react";
import { Address } from "viem";
import { usePoolData } from "@/hooks/pool";

interface PoolDetailsProps {
  poolAddress: Address;
  symbol: string;
}

const PoolDetails: React.FC<PoolDetailsProps> = ({ poolAddress, symbol }) => {
  const { isConnected } = useAccount();
  const { poolData, isLoading, error } = usePoolData(poolAddress, symbol);

  const formatPriceChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    const color = change >= 0 ? "text-green-500" : "text-red-500";
    return (
      <>
        <span className={color}>
          {sign}
          {change}%
        </span>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !poolData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading pool data</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-6 sm:py-24 space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{poolData.name}</h1>
          <p className="text-lg sm:text-xl">
            ${poolData.price.toLocaleString()}{" "}
            {formatPriceChange(poolData.priceChange)}
          </p>
        </div>
        <div className="flex sm:flex-col justify-between sm:text-right">
          <div>
            <p className="text-sm text-gray-500">Pool Status</p>
            <p
              className={`text-base sm:text-lg font-medium ${
                poolData.poolStatus === "ACTIVE"
                  ? "text-green-500"
                  : "text-yellow-500"
              }`}
            >
              {poolData.poolStatus}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">
              Cycle #{poolData.currentCycle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Chart and Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trading View Card */}
          <Card className="h-72 sm:h-96 lg:col-span-2 rounded-lg border border-gray-800 shadow-sm">
            <TradingViewWidget symbol={`NASDAQ:${poolData.symbol}`} />
          </Card>

          {/* Actions Card */}
          {isConnected ? (
            <UserActionsCard pool={poolData} />
          ) : (
            <UnconnectedActionsCard />
          )}
        </div>

        {/* Pool Info Card */}
        <Card className="bg-white/10 border-gray-800 rounded-lg">
          <CardHeader className="p-4 border-b border-gray-800">
            <CardTitle className="text-xl font-semibold text-white">
              Pool Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400">Deposit Token</p>
                <p className="text-white font-medium truncate">
                  {poolData.depositToken}
                </p>
              </div>
              <div>
                <p className="text-gray-400">24h Volume</p>
                <p className="text-white font-medium">{poolData.volume24h}</p>
              </div>
              <div>
                <p className="text-gray-400">Total Liquidity</p>
                <p className="text-white font-medium">
                  ${poolData.totalLiquidity?.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Positions Card */}
        {isConnected ? <UserPositionsCard /> : <UnconnectedPositionsCard />}
      </div>
    </div>
  );
};

export default PoolDetails;
