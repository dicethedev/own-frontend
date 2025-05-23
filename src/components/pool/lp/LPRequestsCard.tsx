import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { LPData } from "@/types/lp";
import { formatUnits } from "viem";
import { Loader2, Info, Clock } from "lucide-react";

interface LPRequestsCardProps {
  pool: Pool;
  lpData: LPData;
}

export const LPRequestsCard: React.FC<LPRequestsCardProps> = ({
  pool,
  lpData,
}) => {
  const { lpRequest, isLoading, error } = lpData;

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            LP Requests
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
            LP Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-red-500">
            Error loading requests: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state or filter out non-liquidity requests
  if (
    !lpRequest ||
    (lpRequest.requestType !== "ADD_LIQUIDITY" &&
      lpRequest.requestType !== "REDUCE_LIQUIDITY")
  ) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            LP Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-gray-400">No pending liquidity requests</p>
        </CardContent>
      </Card>
    );
  }

  // Check if request is in current cycle
  const isCurrentCycle =
    lpRequest && Number(pool.currentCycle) === Number(lpRequest.requestCycle);

  // Check if request can be processed (current cycle > request cycle)
  const canBeProcessed =
    lpRequest && Number(pool.currentCycle) > Number(lpRequest.requestCycle);

  const isAddLiquidity = lpRequest.requestType === "ADD_LIQUIDITY";

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          LP Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Request Details */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Request Type</p>
                <p className="text-white font-medium">
                  {isAddLiquidity ? "Add Liquidity" : "Reduce Liquidity"}
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
          </div>

          {/* Status Information */}
          <div className="space-y-3">
            {isCurrentCycle && (
              <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-lg">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Request submitted in current cycle. It will be processed in
                  the next cycle.
                </span>
              </div>
            )}

            {canBeProcessed && (
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-lg">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Request has been processed and is now active.
                </span>
              </div>
            )}

            {!isCurrentCycle && !canBeProcessed && (
              <div className="flex items-center gap-2 text-blue-500 bg-blue-500/10 p-3 rounded-lg">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Request is pending and will be processed at the end of cycle #
                  {lpRequest.requestCycle.toString()}.
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
