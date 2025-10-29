"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui/BaseComponents";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { Pool } from "@/types/pool";
import { UserData } from "@/types/user";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useUserPoolManagement } from "@/hooks/user";
import { formatTokenBalance } from "@/utils";

interface UserAdditionalActionsCardProps {
  pool: Pool;
  userData: UserData;
}

export const UserAdditionalActionsCard: React.FC<
  UserAdditionalActionsCardProps
> = ({ pool, userData }) => {
  const { address } = useAccount();
  const [collateralAmount, setCollateralAmount] = useState<string>("");
  const [actionType, setActionType] = useState<"add" | "remove">("add");

  const {
    addCollateral,
    reduceCollateral,
    approveReserve,
    reserveBalance,
    reserveApproved,
    isLoading,
    isLoadingReserveBalance,
    checkReserveApproval,
  } = useUserPoolManagement(
    pool.address,
    pool.reserveTokenAddress,
    pool.reserveTokenDecimals,
    pool.assetTokenAddress,
    pool.assetTokenDecimals
  );

  // Get user's current collateral from position
  const currentCollateral = userData.userPosition?.collateralAmount
    ? Number(
        formatUnits(
          userData.userPosition.collateralAmount,
          pool.reserveTokenDecimals
        )
      )
    : 0;

  // Check approval status when amount changes
  useEffect(() => {
    if (actionType === "add" && collateralAmount && address) {
      checkReserveApproval(collateralAmount);
    }
  }, [collateralAmount, actionType, address, checkReserveApproval]);

  // Check if user has enough balance for adding collateral
  const hasEnoughBalance =
    actionType === "add" &&
    collateralAmount &&
    reserveBalance &&
    parseFloat(collateralAmount) <= parseFloat(reserveBalance);

  // Check if user is trying to remove more than available
  const canRemoveAmount =
    actionType === "remove" &&
    collateralAmount &&
    parseFloat(collateralAmount) <= currentCollateral;

  // Handle approving reserve token
  const handleApproveReserve = async () => {
    if (!address || !collateralAmount) return;

    try {
      await approveReserve(collateralAmount);

      await checkReserveApproval(collateralAmount);
    } catch (error) {
      console.error("Failed to approve reserve token:", error);
    }
  };

  // Handle adding collateral
  const handleAddCollateral = async () => {
    if (!address || !collateralAmount || !hasEnoughBalance) return;

    try {
      await addCollateral(address, collateralAmount);
      setCollateralAmount("");
    } catch (error) {
      console.error("Failed to add collateral:", error);
    }
  };

  // Handle removing collateral
  const handleRemoveCollateral = async () => {
    if (!address || !collateralAmount || !canRemoveAmount) return;

    try {
      await reduceCollateral(collateralAmount);
      setCollateralAmount("");
    } catch (error) {
      console.error("Failed to remove collateral:", error);
    }
  };

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="px-4 py-2 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          Manage Collateral
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 py-4 space-y-6">
        {/* Add / Remove Tabs */}
        <div className="flex gap-3 bg-slate-900/50 rounded-lg p-1">
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              actionType === "add"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setActionType("add");
              setCollateralAmount("");
            }}
            disabled={isLoading}
          >
            Add
          </button>
          <button
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              actionType === "remove"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setActionType("remove");
              setCollateralAmount("");
            }}
            disabled={isLoading}
          >
            Remove
          </button>
        </div>

        {/* Input field + validation */}
        <div className="space-y-2">
          <Input
            type="number"
            placeholder={`Amount in ${pool.reserveToken}`}
            value={collateralAmount}
            onChange={(e) => setCollateralAmount(e.target.value)}
            disabled={isLoading}
            className="bg-slate-800/50 border-gray-700 text-white placeholder-gray-500"
          />

          {/* Balance display */}
          {actionType === "add" && (
            <div className="flex justify-between text-xs px-1 text-gray-400">
              <span>
                {isLoadingReserveBalance
                  ? "Loading balance..."
                  : `Balance: ${formatTokenBalance(reserveBalance ?? 0)} ${
                      pool.reserveToken
                    }`}
              </span>
              {collateralAmount && !hasEnoughBalance && (
                <span className="text-red-400">Insufficient balance</span>
              )}
            </div>
          )}

          {actionType === "remove" && (
            <div className="flex justify-between text-xs px-1 text-gray-400">
              <span>
                Available: {currentCollateral.toFixed(4)} {pool.reserveToken}
              </span>
              {collateralAmount && !canRemoveAmount && (
                <span className="text-yellow-400">Exceeds available</span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {actionType === "add" ? (
          <div className="space-y-2">
            {!reserveApproved ? (
              <Button
                onClick={handleApproveReserve}
                disabled={
                  isLoading ||
                  !collateralAmount ||
                  parseFloat(collateralAmount) <= 0 ||
                  !hasEnoughBalance
                }
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Approve {pool.reserveToken}
              </Button>
            ) : (
              <Button
                onClick={handleAddCollateral}
                disabled={
                  isLoading ||
                  !collateralAmount ||
                  parseFloat(collateralAmount) <= 0 ||
                  !hasEnoughBalance
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Collateral
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={handleRemoveCollateral}
            disabled={
              isLoading ||
              !collateralAmount ||
              parseFloat(collateralAmount) <= 0 ||
              !canRemoveAmount
            }
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Remove Collateral
          </Button>
        )}

        {/* Hint message */}
        {actionType === "add" && (
          <div className="flex items-start gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-lg text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            Adding collateral strengthens your position and reduces liquidation
            risk.
          </div>
        )}

        {actionType === "remove" && (
          <div className="flex items-start gap-2 text-yellow-400 bg-yellow-500/10 p-3 rounded-lg text-xs">
            <Info className="w-4 h-4 mt-0.5" />
            You can only remove excess collateral if your position remains
            healthy.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
