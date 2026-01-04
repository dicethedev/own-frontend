"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { UserRequestType, UserData } from "@/types/user";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { formatCurrency, useUserPoolManagement } from "@/hooks/user";
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

  // Check if user has an active request (not NONE and not yet claimed)
  const hasActiveRequest =
    userRequest && userRequest.requestType !== UserRequestType.NONE;

  // Check if request can be claimed (current cycle > request cycle)
  const canClaim =
    userRequest &&
    userRequest.requestType !== UserRequestType.NONE &&
    Number(pool.currentCycle) > Number(userRequest.requestCycle);

  const handleClaim = async () => {
    if (!address || !userRequest) return;

    try {
      if (userRequest.requestType === UserRequestType.DEPOSIT) {
        await claimAsset(address);
      } else if (userRequest.requestType === UserRequestType.REDEEM) {
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
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
        <CardHeader className="px-6 py-4 border-b border-[#303136]">
          <CardTitle className="text-lg font-semibold text-white">
            Request
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 role="status" className="w-6 h-6 animate-spin text-white" />
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
            Request
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-400">Error loading request: {error.message}</p>
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
            Request
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-400">No pending request</p>
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
    <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white">
          Request
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
              <div>
                <p className="text-gray-400 text-sm">Request Cycle</p>
                <p className="text-white font-medium">
                  #{userRequest.requestCycle.toString()}
                </p>
              </div>
            </div>
          </div>

          {/* Additional info for deposit requests when claimable */}
          {isDeposit && canClaim && rebalancePrice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#303136]/50 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Rebalance Price</p>
                <p className="text-white font-medium">
                  $
                  {formatCurrency(
                    Number(formatUnits(rebalancePrice, pool.assetTokenDecimals))
                  )}
                </p>
              </div>
              {expectedAssetTokens && (
                <div className="bg-[#303136]/50 p-4 rounded-xl">
                  <p className="text-gray-400 text-sm">
                    Expected {pool.assetTokenSymbol}
                  </p>
                  <p className="text-white font-medium">
                    {expectedAssetTokens.toFixed(5)}
                  </p>
                </div>
              )}
            </div>
          )}
          {/* Claim Button & Info */}
          <div>
            <Button
              onClick={handleClaim}
              disabled={!canClaim || isClaimLoading}
              className={`w-full h-12 rounded-xl`}
              variant={canClaim ? "primary" : "inactive"}
            >
              {isClaimLoading && (
                <Loader2 role="status" className="w-4 h-4 mr-2 animate-spin" />
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
