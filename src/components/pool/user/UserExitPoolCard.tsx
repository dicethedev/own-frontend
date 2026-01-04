"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui/BaseComponents";
import { Loader2, Info } from "lucide-react";
import { Pool } from "@/types/pool";
import { UserData } from "@/types/user";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useUserPoolManagement } from "@/hooks/user";
import { formatTokenBalance } from "@/utils";

interface UserExitPoolCardProps {
  pool: Pool;
  userData: UserData;
}

export const UserExitPoolCard: React.FC<UserExitPoolCardProps> = ({
  pool,
  userData,
}) => {
  const { address } = useAccount();
  const [exitAmount, setExitAmount] = useState<string>("");

  const { exitPool, assetBalance, isLoading, isLoadingAssetBalance } =
    useUserPoolManagement(
      pool.address,
      pool.reserveTokenAddress,
      pool.reserveTokenDecimals,
      pool.assetTokenAddress,
      pool.assetTokenDecimals
    );

  // Get user's current asset amount from position
  const currentAssetAmount = userData.userPosition?.assetAmount
    ? Number(
        formatUnits(userData.userPosition.assetAmount, pool.assetTokenDecimals)
      )
    : 0;

  // Check if user has enough balance
  const hasEnoughBalance =
    exitAmount &&
    assetBalance &&
    parseFloat(exitAmount) <= parseFloat(assetBalance);

  // Check if amount is valid (greater than 0 and not exceeding balance)
  const isValidAmount =
    exitAmount &&
    parseFloat(exitAmount) > 0 &&
    parseFloat(exitAmount) <=
      Math.min(currentAssetAmount, parseFloat(assetBalance || "0"));

  // Handle exit pool action
  const handleExitPool = async () => {
    if (!address || !exitAmount || !isValidAmount) return;

    try {
      await exitPool(exitAmount);
      setExitAmount(""); // Clear input after successful exit
    } catch (error) {
      console.error("Failed to exit pool:", error);
    }
  };

  // Handle max button click
  const handleMaxClick = () => {
    const maxAmount = Math.min(
      currentAssetAmount,
      parseFloat(assetBalance || "0")
    );
    setExitAmount(maxAmount.toString());
  };

  return (
    <Card className="bg-[#222325] border border-white-500/30 rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          Exit Pool
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Warning Message */}
        <div className="flex items-start gap-2 text-white-400 bg-yellow-500/10 p-4 rounded-xl text-sm border">
          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Pool Halted</p>
            <p className="text-xs text-white-300">
              This pool is currently halted. You can exit your position by
              burning your asset tokens and receiving the underlying collateral
              at the last known price.
            </p>
          </div>
        </div>

        {/* Current Position Info */}
        <div className="bg-[#303136]/50 p-4 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Your Asset Balance</span>
            <span className="text-white font-medium">
              {isLoadingAssetBalance ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `${formatTokenBalance(assetBalance ?? 0)} ${
                  pool.assetTokenSymbol
                }`
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Position Assets</span>
            <span className="text-white font-medium">
              {currentAssetAmount.toFixed(6)} {pool.assetTokenSymbol}
            </span>
          </div>
        </div>

        {/* Exit Amount Input */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="number"
              placeholder={`Amount of ${pool.assetTokenSymbol} to exit`}
              value={exitAmount}
              onChange={(e) => setExitAmount(e.target.value)}
              disabled={isLoading}
              className="bg-[#303136]/50 border-[#303136] text-white placeholder-gray-500 rounded-xl h-12 pr-16"
            />
            <button
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-white bg-[#303136] hover:bg-[#404146] rounded-lg transition"
            >
              MAX
            </button>
          </div>

          {/* Validation messages */}
          {exitAmount && !hasEnoughBalance && (
            <p className="text-red-400 text-xs px-1">Insufficient balance</p>
          )}
        </div>

        {/* Exit Button */}
        <Button
          onClick={handleExitPool}
          disabled={isLoading || !isValidAmount}
          className="w-full h-12 rounded-xl"
          variant="primary"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Exit Pool
        </Button>

        {/* Info Note */}
        <div className="flex items-start gap-2 text-gray-400 bg-[#303136]/30 p-3 rounded-xl text-xs">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Upon exit, your asset tokens will be burned and you will receive the
            equivalent value in {pool.reserveToken} based on the last rebalance
            price.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
