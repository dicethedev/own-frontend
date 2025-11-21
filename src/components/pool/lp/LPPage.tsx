import React, { useEffect, useState } from "react";
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
import { LPRequestType } from "@/types/lp";
import { AdditionalActionsCard } from "./AdditionalActionsCard";
import { checkIfUserIsWhitelisted } from "@/services/supabase";
import { LPWhitelistCard } from "@/components/LPWhitelistCard/LPWhitelistCard";

const LPPage: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { isConnected, address } = useAccount();

  // Use the existing useLPData hook when wallet is connected
  const lpData = useLPData(pool.address);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  // Calculate if user is blocked from new requests
  const calculateBlockedStatusForLP = () => {
    if (!lpData.lpRequest) return { isBlocked: false, message: "" };

    const hasActiveRequest =
      lpData.lpRequest.requestType !== LPRequestType.NONE;

    if (!hasActiveRequest) return { isBlocked: false, message: "" };

    const isCurrentCycle =
      Number(pool.currentCycle) === Number(lpData.lpRequest.requestCycle);

    if (isCurrentCycle) {
      return {
        isBlocked: true,
        message:
          "You already have an active request. You must wait for it to be processed before making a new one.",
      };
    }

    return {
      isBlocked: true,
      message:
        "You have an active liquidity request. You must wait for it to be processed before making a new one.",
    };
  };

  const blockedStatus = isConnected
    ? calculateBlockedStatusForLP()
    : { isBlocked: false, message: "" };

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

  useEffect(() => {
    if (isConnected && address) {
      checkIfUserIsWhitelisted(address as string).then((isWhitelisted) => {
        setIsWhitelisted(isWhitelisted);
      });
    }
  }, [address, isConnected]);

  return (
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
              {pool.assetSymbol.toLocaleLowerCase() === "ai7" ? (
                <TradingViewWidget symbol={`CBOE:MAGS`} />
              ) : (
                <TradingViewWidget symbol={`NASDAQ:${pool.assetSymbol}`} />
              )}
            </Card>

            {/* Actions Card */}
            {/* if connected and whitelisted, show the actions card */}
            {/* if connected and not whitelisted, show the whitelist card */}
            {/* if not connected, show the unconnected actions card */}
            {isConnected && isWhitelisted ? (
              <LPActionsCard
                pool={pool}
                lpData={lpData}
                isBlockedFromNewRequests={blockedStatus.isBlocked}
                blockMessage={blockedStatus.message}
              />
            ) : isConnected && !isWhitelisted ? (
              <LPWhitelistCard title="Liquidity Provider" />
            ) : (
              <UnconnectedActionsCard />
            )}
          </div>

          {/* Pool Info Card */}
          <LPInfoCard
            pool={pool}
            lpData={lpData}
            isWhitelisted={isWhitelisted}
          />

          {/* LP Whitelist Card - Only show when not whitelisted */}
          {isConnected && !isWhitelisted && (
            <LPWhitelistCard title="LP Position" />
          )}

          {/* LP Requests Card - Only show when connected */}
          {isConnected && isWhitelisted && (
            <LPRequestsCard pool={pool} lpData={lpData} />
          )}

          {/* LP Positions Card - Only show when connected */}
          {isConnected && isWhitelisted && (
            <LPPositionsCard pool={pool} lpData={lpData} />
          )}

          {/* Only render RebalanceCard for LPs */}
          {isConnected && isWhitelisted && lpData.isLP && (
            <RebalanceCard pool={pool} lpData={lpData} />
          )}

          {/* Additional Actions Card - Only show for registered LPs */}
          {isConnected && isWhitelisted && lpData.isLP && (
            <AdditionalActionsCard pool={pool} lpData={lpData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LPPage;
