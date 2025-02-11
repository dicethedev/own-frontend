import React from "react";
import { Card } from "@/components/ui/BaseComponents";
import { TradingViewWidget } from "../TradingViewComponent";
import { useAccount } from "wagmi";
import { Pool } from "@/types/pool";
import { LPActionsCard } from "./LPActionsCard";
import { UnconnectedActionsCard } from "./UnconnectedActionsCard";
import { LPInfoCard } from "./LPInfoCard";
import { RebalanceCard } from "./RebalanceCard";

interface LPPageProps {
  pool: Pool;
}

const LPPage: React.FC<LPPageProps> = ({ pool }) => {
  const { isConnected } = useAccount();

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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-6 sm:py-24 space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {pool.name} ({pool.symbol})
          </h1>
          <p className="text-lg sm:text-xl">
            ${pool.price.toLocaleString()} {formatPriceChange(pool.priceChange)}
          </p>
        </div>
        <div className="flex sm:flex-col justify-between sm:text-right">
          <div>
            <p className="text-sm text-gray-500">Pool Status</p>
            <p
              className={`text-base sm:text-lg font-medium ${
                pool.poolStatus === "ACTIVE"
                  ? "text-green-500"
                  : "text-yellow-500"
              }`}
            >
              {pool.poolStatus}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cycle #{pool.currentCycle}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Chart and Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trading View Card */}
          <Card className="h-72 sm:h-96 lg:col-span-2 rounded-lg border border-gray-800 shadow-sm">
            <TradingViewWidget symbol={`NASDAQ:${pool.symbol}`} />
          </Card>

          {/* Actions Card */}
          {isConnected ? (
            <LPActionsCard pool={pool} />
          ) : (
            <UnconnectedActionsCard />
          )}
        </div>

        {/* Pool Info Card */}
        <LPInfoCard pool={pool} />

        <RebalanceCard pool={pool} />
      </div>
    </div>
  );
};

export default LPPage;
