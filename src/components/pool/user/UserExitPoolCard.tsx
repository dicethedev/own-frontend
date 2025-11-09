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
import { Loader2, AlertTriangle, Info } from "lucide-react";
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

  const {
    exitPool,
    assetBalance,
    isLoading,
    isLoadingAssetBalance,
  } = useUserPoolManagement(
    pool.address,
    pool.reserveTokenAddress,
    pool.reserveTokenDecimals,
    pool.assetTokenAddress,
    pool.assetTokenDecimals
  );

  // Get user's current asset amount from position
  const currentAssetAmount = userData.userPosition?.assetAmount
    ? Number(
        formatUnits(
          userData.userPosition.assetAmount,
          pool.assetTokenDecimals
        )
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
    parseFloat(exitAmount) <= Math.min(currentAssetAmount, parseFloat(assetBalance || "0"));

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
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="px-4 py-2 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Emergency Exit Pool
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 py-4 space-y-4">
        {/* Warning Message */}
        <div className="flex items-start gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Pool is Halted</p>
            <p className="text-xs text-red-300">
              This pool is currently halted. You can exit your position by
              burning your {pool.assetTokenSymbol} tokens to recover reserves at the
              current oracle price.
            </p>
          </div>
        </div>

        {/* Position Info */}
        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Your Position:</span>
            <span className="text-white font-medium">
              {formatTokenBalance(currentAssetAmount.toString())} {pool.assetTokenSymbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Account Balance:</span>
            <span className="text-white font-medium">
              {isLoadingAssetBalance
                ? "Loading..."
                : `${formatTokenBalance(assetBalance ?? "0")} ${pool.assetTokenSymbol}`}
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-400">Amount to Exit</label>
            <button
              onClick={handleMaxClick}
              disabled={isLoading || currentAssetAmount === 0}
              className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              MAX
            </button>
          </div>
          <Input
            type="number"
            placeholder={`Amount in ${pool.assetTokenSymbol}`}
            value={exitAmount}
            onChange={(e) => setExitAmount(e.target.value)}
            disabled={isLoading}
            className="bg-slate-800/50 border-gray-700 text-white placeholder-gray-500"
          />

          {/* Validation messages */}
          {exitAmount && !hasEnoughBalance && (
            <p className="text-xs text-red-400 px-1">
              Insufficient {pool.assetTokenSymbol} balance
            </p>
          )}
          {exitAmount &&
            hasEnoughBalance &&
            parseFloat(exitAmount) > currentAssetAmount && (
              <p className="text-xs text-yellow-400 px-1">
                Amount exceeds your position
              </p>
            )}
        </div>

        {/* Exit Button */}
        <Button
          onClick={handleExitPool}
          disabled={isLoading || !isValidAmount}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Exit Pool
        </Button>

        {/* Info Message */}
        <div className="flex items-start gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-lg text-xs">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            When you exit, your {pool.assetTokenSymbol} tokens will be burned and you
            will receive {pool.reserveToken} based on the current oracle price.
            Any collateral will also be returned to you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};