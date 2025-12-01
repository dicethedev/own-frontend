"use client";

import React, { useEffect, useState } from "react";
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
import { UserAdditionalActionsCard } from "./UserAdditionalActionsCard";
import { Pool } from "@/types/pool";
import { getExplorerUrl } from "@/utils/explorer";
import { formatAddress } from "@/utils/utils";
import { ExternalLink } from "lucide-react";
import { useUserData } from "@/hooks/user";
import { formatUnits } from "viem";
import { UserRequestsCard } from "./UserRequestsCard";
import { UserRequestType } from "@/types/user";
import { formatTVL } from "@/utils/tvl-formatting";
import { checkIfUserIsWhitelisted } from "@/services/supabase";
import { LPWhitelistCard } from "@/components/LPWhitelistCard/LPWhitelistCard";

interface UserPageProps {
  pool: Pool;
}

const UserPage: React.FC<UserPageProps> = ({ pool }) => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const userData = useUserData(pool.address);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  const calculateBlockedStatus = () => {
    if (!userData.userRequest) return { isBlocked: false, message: "" };

    const hasActiveRequest =
      userData.userRequest.requestType !== UserRequestType.NONE;

    if (!hasActiveRequest) return { isBlocked: false, message: "" };

    const canClaim =
      Number(pool.currentCycle) > Number(userData.userRequest.requestCycle);

    const isCurrentCycle =
      Number(pool.currentCycle) === Number(userData.userRequest.requestCycle);

    if (canClaim) {
      return {
        isBlocked: true,
        message: "Please claim your processed request before making a new one.",
      };
    }

    if (isCurrentCycle) {
      return {
        isBlocked: true,
        message:
          "You have an active request. Wait for it to be processed before making a new one.",
      };
    }

    return {
      isBlocked: true,
      message:
        "You have an active request. You must wait for it to be processed before making a new one.",
    };
  };

  const blockedStatus = isConnected
    ? calculateBlockedStatus()
    : { isBlocked: false, message: "" };

  const formatPriceChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    const color = change >= 0 ? "text-green-500" : "text-red-500";
    return (
      <span className={color}>
        {sign}
        {change}%
      </span>
    );
  };

  useEffect(() => {
    if (isConnected && address) {
      checkIfUserIsWhitelisted(address as string).then((isWhitelisted) => {
        setIsWhitelisted(isWhitelisted);
      });
    }
  }, [address, isConnected]);

  // Check if user has a position (deposited amount > 0)
  const hasPosition =
    userData.userPosition?.depositAmount &&
    Number(
      formatUnits(
        userData.userPosition.depositAmount,
        pool.reserveTokenDecimals
      )
    ) > 0;

  return (
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
            <p className="text-sm text-gray-500">Cycle #{pool.currentCycle}</p>
          </div>
        </div>
      </div>

      {/* Chart + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="h-[500px] lg:col-span-2 rounded-lg border border-gray-800 shadow-sm">
          {pool.assetSymbol.toLocaleLowerCase() === "ai7" ? (
            <TradingViewWidget symbol={`CBOE:MAGS`} />
          ) : (
            <TradingViewWidget symbol={`NASDAQ:${pool.assetSymbol}`} />
          )}
        </Card>

        {isConnected && isWhitelisted ? (
          <UserActionsCard
            pool={pool}
            userData={userData}
            isBlockedFromNewRequests={blockedStatus.isBlocked}
            blockMessage={blockedStatus.message}
          />
        ) : isConnected && !isWhitelisted ? (
          <LPWhitelistCard title="Deposit / Redeem" />
        ) : (
          <UnconnectedActionsCard />
        )}
      </div>

      {/* Pool Info */}
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

            {isWhitelisted && (
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
            )}

            {isWhitelisted && (
              <div>
                <p className="text-gray-400">Pool Interest</p>
                <p className="text-white font-medium">
                  {pool.poolInterestRate
                    ? `${(Number(pool.poolInterestRate) / 100).toFixed(2)}%`
                    : "-"}
                </p>
              </div>
            )}

            {isWhitelisted && (
              <div>
                <p className="text-gray-400">Pool Utilization</p>
                <p className="text-white font-medium">
                  {pool.poolUtilizationRatio
                    ? `${(Number(pool.poolUtilizationRatio) / 100).toFixed(2)}%`
                    : "-"}
                </p>
              </div>
            )}

            {isWhitelisted && (
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
            )}

            {chainId === 8453 && (
              <div>
                <p className="text-gray-400">Uniswap Pool</p>
                <p className="text-white font-medium">
                  <a
                    href="https://app.uniswap.org/explore/pools/base/0x11ad41c9715619c75d42ae403e90e7529c12bb07c955711bb2e78b99f41ed4d0"
                    target="_blank"
                    className="text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2"
                  >
                    {"0x11ad41...1ed4d0"}
                    <ExternalLink size={14} />
                  </a>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Whitelist Card - Only show when not whitelisted */}
      {isConnected && !isWhitelisted && <LPWhitelistCard title="Position" />}

      {isConnected && isWhitelisted && (
        <UserRequestsCard pool={pool} userData={userData} />
      )}

      {/* User Positions Card - Only show when connected */}
      {isConnected && isWhitelisted && (
        <UserPositionsCard pool={pool} userData={userData} />
      )}
      {/* Unconnected Positions Card - Only show when not connected */}
      {!isConnected && <UnconnectedPositionsCard />}

      {/* Additional Actions Card - Only show for users with positions */}
      {isConnected && isWhitelisted && hasPosition && (
        <UserAdditionalActionsCard pool={pool} userData={userData} />
      )}
    </div>
  );
};

export default UserPage;
