import React from "react";
import { Card } from "@/components/ui/BaseComponents";
import { TradingViewWidget } from "../TradingViewComponent";
import { useAccount } from "wagmi";
import { Pool } from "@/types/pool";
import { LPActionsCard } from "./LPActionsCard";
import { UnconnectedActionsCard } from "./UnconnectedActionsCard";
import { LPInfoCard } from "./LPInfoCard";
import { LPRequestsCard } from "./LPRequestsCard";
import { LPPositionsCard } from "./LPPositionsCard";
import { RebalanceCard } from "./RebalanceCard";
import { useLPData } from "@/hooks/lp"; // Import the existing hook
import { Footer } from "@/components/Footer";

const LPPage: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { isConnected } = useAccount();

  // Use the existing useLPData hook when wallet is connected
  const lpData = useLPData(pool.address);

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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-6 sm:py-24 space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {pool.assetName} ({pool.assetSymbol})
              </h1>
              <p className="text-lg sm:text-xl">
                ${pool.assetPrice.toLocaleString()}{" "}
                {formatPriceChange(pool.priceChange)}
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
                <p className="text-sm text-gray-500">
                  Cycle #{pool.currentCycle}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Chart and Actions Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Trading View Card */}
              <Card className="h-[500px] lg:col-span-2 rounded-lg border border-gray-800 shadow-sm">
                <TradingViewWidget symbol={`NASDAQ:${pool.assetSymbol}`} />
              </Card>

              {/* Actions Card */}
              {isConnected ? (
                <LPActionsCard pool={pool} lpData={lpData} />
              ) : (
                <UnconnectedActionsCard />
              )}
            </div>

            {/* Pool Info Card */}
            <LPInfoCard pool={pool} lpData={lpData} />

            {/* LP Requests Card - Only show when connected */}
            {isConnected && <LPRequestsCard pool={pool} lpData={lpData} />}

            {/* LP Positions Card - Only show when connected */}
            {isConnected && <LPPositionsCard pool={pool} lpData={lpData} />}

            {/* Only render RebalanceCard for LPs */}
            {isConnected && lpData.isLP && (
              <RebalanceCard pool={pool} lpData={lpData} />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LPPage;
