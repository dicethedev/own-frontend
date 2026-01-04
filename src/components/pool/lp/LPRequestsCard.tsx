"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { LPData, LPRequestType } from "@/types/lp";
import { formatUnits } from "viem";
import { Loader2, Info, Clock, AlertCircle } from "lucide-react";

interface LPRequestsCardProps {
  pool: Pool;
  lpData: LPData;
}

export const LPRequestsCard: React.FC<LPRequestsCardProps> = ({
  pool,
  lpData,
}) => {
  const { lpRequest, isLoading, error } = lpData;

  // Check if LP has an active request (not NONE)
  const hasActiveRequest =
    lpRequest && lpRequest.requestType !== LPRequestType.NONE;

  // Check if request is in current cycle
  const isCurrentCycle =
    lpRequest &&
    lpRequest.requestType !== LPRequestType.NONE &&
    Number(pool.currentCycle) === Number(lpRequest.requestCycle);

  // Check if request can be processed (current cycle > request cycle)
  const canBeProcessed =
    lpRequest &&
    lpRequest.requestType !== LPRequestType.NONE &&
    Number(pool.currentCycle) > Number(lpRequest.requestCycle);

  // Check if request is still pending (submitted in previous cycle but not yet processed)
  const isPendingFromPreviousCycle =
    lpRequest &&
    lpRequest.requestType !== LPRequestType.NONE &&
    Number(pool.currentCycle) > Number(lpRequest.requestCycle) &&
    !canBeProcessed;

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
        <CardHeader className="px-6 py-4 border-b border-[#303136]">
          <CardTitle className="text-lg font-semibold text-white">
            LP Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
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
            LP Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-400">
            Error loading requests: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (!hasActiveRequest) {
    return (
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
        <CardHeader className="px-6 py-4 border-b border-[#303136]">
          <CardTitle className="text-lg font-semibold text-white">
            LP Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-400">No pending liquidity requests</p>
        </CardContent>
      </Card>
    );
  }

  const isAddLiquidity = lpRequest.requestType === LPRequestType.ADDLIQUIDITY;
  const isReduceLiquidity =
    lpRequest.requestType === LPRequestType.REDUCELIQUIDITY;
  const isLiquidation = lpRequest.requestType === LPRequestType.LIQUIDATE;

  const getRequestTypeDisplay = () => {
    if (isAddLiquidity) return "Add Liquidity";
    if (isReduceLiquidity) return "Reduce Liquidity";
    if (isLiquidation) return "Liquidation";
    return "Unknown";
  };

  return (
    <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white">
          LP Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Request Details */}
          <div className="bg-[#303136]/50 p-4 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Request Type</p>
                <p className="text-white font-medium">
                  {getRequestTypeDisplay()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-white font-medium">
                  {formatUnits(
                    lpRequest.requestAmount,
                    pool.reserveTokenDecimals
                  )}{" "}
                  {pool.reserveToken}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Request Cycle</p>
                <p className="text-white font-medium">
                  #{lpRequest.requestCycle.toString()}
                </p>
              </div>
            </div>

            {/* Show liquidator info if it's a liquidation request */}
            {isLiquidation && lpRequest.liquidator && (
              <div className="mt-4 pt-4 border-t border-[#303136]">
                <div>
                  <p className="text-gray-400 text-sm">Liquidator</p>
                  <p className="text-white font-medium font-mono text-sm">
                    {lpRequest.liquidator}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Information */}
          <div className="space-y-3">
            {isCurrentCycle && (
              <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-xl">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Request submitted in current cycle. It will be processed in
                  the next cycle.
                </span>
              </div>
            )}

            {canBeProcessed && (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-xl">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Request has been processed and is now active.
                </span>
              </div>
            )}

            {isPendingFromPreviousCycle && (
              <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-xl">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Request from cycle #{lpRequest.requestCycle.toString()} is
                  pending processing.
                </span>
              </div>
            )}

            {isLiquidation && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Liquidation request is active. This position is being
                  liquidated.
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
