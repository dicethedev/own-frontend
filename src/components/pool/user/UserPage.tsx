import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { TradingViewWidget } from "../TradingViewComponent";
import { useAccount, useChainId } from "wagmi";
import { UserActionsCard } from "./UserActionsCard";
import { UserPositionsCard } from "./UserPositionsCard";
import { UnconnectedActionsCard } from "./UnconnectedActionsCard";
import { UnconnectedPositionsCard } from "./UnconnectedPositionsCard";
import { Pool } from "@/types/pool";
import { getExplorerUrl } from "@/utils/explorer";
import { formatAddress } from "@/utils/utils";
import { ExternalLink } from "lucide-react";
import { useUserData } from "@/hooks/user"; // Import the new hook
import { formatUnits } from "viem";
import { Footer } from "@/components/Footer";
import { UserRequestsCard } from "./UserRequestsCard";
import { formatTVL } from "@/utils/tvl-formatting";

interface UserPageProps {
  pool: Pool;
}

const UserPage: React.FC<UserPageProps> = ({ pool }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Fetch user data with the new hook
  const userData = useUserData(pool.address);

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
                <UserActionsCard pool={pool} userData={userData} />
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
                    <p className="text-gray-400">Pool</p>
                    <a
                      href={getExplorerUrl(pool.address, chainId)}
                      target="_blank"
                      className="text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2"
                    >
                      {formatAddress(pool.address) || "-"}
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <div>
                    <p className="text-gray-400">Oracle</p>
                    <a
                      href={getExplorerUrl(pool.oracleAddress, chainId)}
                      target="_blank"
                      className="text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2"
                    >
                      {formatAddress(pool.oracleAddress) || "-"}
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <div>
                    <p className="text-gray-400">Deposit Token</p>
                    <p className="text-white font-medium truncate">
                      {pool.reserveToken}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Oracle Price</p>
                    <p className="text-white font-medium">
                      {pool.oraclePrice.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Total Liquidity</p>
                    <p className="text-white font-medium">
                      {pool?.totalLPLiquidityCommited
                        ? `${formatTVL(
                            Number(
                              formatUnits(
                                pool.totalLPLiquidityCommited,
                                pool.reserveTokenDecimals
                              )
                            )
                          )}`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Pool Interest</p>
                    <p className="text-white font-medium">
                      {pool.poolInterestRate
                        ? `${(Number(pool.poolInterestRate) / 100).toFixed(2)}%`
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Pool Utilization</p>
                    <p className="text-white font-medium">
                      {pool.poolUtilizationRatio
                        ? `${(Number(pool.poolUtilizationRatio) / 100).toFixed(
                            2
                          )}%`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Asset Supply</p>
                    <p className="text-white font-medium">
                      {pool.assetSupply
                        ? `${Number(formatUnits(pool.assetSupply, 18)).toFixed(
                            2
                          )} ${pool.assetTokenSymbol}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isConnected && (
              <UserRequestsCard pool={pool} userData={userData} />
            )}

            {/* User Positions Card */}
            {isConnected ? (
              <UserPositionsCard pool={pool} userData={userData} />
            ) : (
              <UnconnectedPositionsCard />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserPage;
