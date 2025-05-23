import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { UserData } from "@/types/user";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Loader2, Info, Clock } from "lucide-react";
import { useUserPoolManagement } from "@/hooks/user";
import toast from "react-hot-toast";

interface UserRequestsCardProps {
  pool: Pool;
  userData: UserData;
}

export const UserRequestsCard: React.FC<UserRequestsCardProps> = ({
  pool,
  userData,
}) => {
  const { address } = useAccount();
  const { userRequest, isLoading, error } = userData;

  const {
    claimAsset,
    claimReserve,
    isLoading: isClaimLoading,
  } = useUserPoolManagement(
    pool.address,
    pool.reserveTokenAddress,
    pool.reserveTokenDecimals,
    pool.assetTokenAddress,
    18
  );

  // Check if request can be claimed (current cycle > request cycle)
  const canClaim =
    userRequest && Number(pool.currentCycle) > Number(userRequest.requestCycle);

  // Check if request is in current cycle (should show info about next cycle)
  const isCurrentCycle =
    userRequest &&
    Number(pool.currentCycle) === Number(userRequest.requestCycle);

  const handleClaim = async () => {
    if (!address || !userRequest) return;

    try {
      if (userRequest.requestType === "DEPOSIT") {
        await claimAsset(address);
      } else if (userRequest.requestType === "REDEEM") {
        await claimReserve(address);
      }
      toast.success("Request claimed successfully");
    } catch (error) {
      console.error("Claim error:", error);
      toast.error("Error claiming request");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Requests
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
          <CardTitle className="text-xl font-semibred text-white">
            Requests
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

  // Show empty state
  if (
    !userRequest ||
    (userRequest.requestType !== "DEPOSIT" &&
      userRequest.requestType !== "REDEEM")
  ) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-gray-400">No pending requests</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate some display values
  const isDeposit = userRequest.requestType === "DEPOSIT";
  const rebalancePrice = pool.prevRebalancePrice;

  // For deposit requests, calculate expected asset tokens
  const expectedAssetTokens =
    isDeposit && rebalancePrice && canClaim
      ? Number(formatUnits(userRequest.amount, pool.reserveTokenDecimals)) /
        Number(formatUnits(rebalancePrice, 18))
      : null;

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Request Details */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Request Type</p>
                <p className="text-white font-medium">
                  {isDeposit ? "Deposit" : "Redemption"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-white font-medium">
                  {formatUnits(
                    userRequest.amount,
                    isDeposit ? pool.reserveTokenDecimals : 18
                  )}{" "}
                  {isDeposit ? pool.reserveToken : pool.assetTokenSymbol}
                </p>
              </div>
              {isDeposit && userRequest.collateralAmount && (
                <div>
                  <p className="text-gray-400 text-sm">Collateral</p>
                  <p className="text-white font-medium">
                    {formatUnits(
                      userRequest.collateralAmount,
                      pool.reserveTokenDecimals
                    )}{" "}
                    {pool.reserveToken}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-sm">Request Cycle</p>
                <p className="text-white font-medium">
                  #{userRequest.requestCycle.toString()}
                </p>
              </div>
            </div>

            {/* Additional info for deposit requests when claimable */}
            {isDeposit && canClaim && rebalancePrice && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Rebalance Price</p>
                    <p className="text-white font-medium">
                      ${formatUnits(rebalancePrice, 18)}
                    </p>
                  </div>
                  {expectedAssetTokens && (
                    <div>
                      <p className="text-gray-400 text-sm">
                        Expected {pool.assetTokenSymbol}
                      </p>
                      <p className="text-white font-medium">
                        {expectedAssetTokens.toFixed(5)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status and Action */}
          <div className="space-y-3">
            {isCurrentCycle && (
              <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-lg">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Request submitted in current cycle. Claim will be available in
                  the next cycle.
                </span>
              </div>
            )}

            {canClaim && (
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-3 rounded-lg">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Request processed and ready to claim!
                </span>
              </div>
            )}

            <Button
              onClick={handleClaim}
              disabled={!canClaim || isClaimLoading}
              className={`w-full ${
                canClaim
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              {isClaimLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {canClaim ? (
                <>
                  Claim {isDeposit ? pool.assetTokenSymbol : pool.reserveToken}
                </>
              ) : (
                "Claim Available Next Cycle"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
