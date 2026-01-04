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
import { Loader2, AlertCircle } from "lucide-react";
import { Pool } from "@/types/pool";
import { LPData } from "@/types/lp";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address, parseUnits } from "viem";
import { poolLiquidityManagerABI } from "@/config/abis/poolLiquidityManager";
import { erc20ABI } from "@/config/abis/erc20";
import toast from "react-hot-toast";
import { LPExitPoolCard } from "./LPExitPoolCard";

interface AdditionalActionsCardProps {
  pool: Pool;
  lpData: LPData;
}

export const AdditionalActionsCard: React.FC<AdditionalActionsCardProps> = ({
  pool,
  lpData,
}) => {
  const { address } = useAccount();
  const [approvalAmount, setApprovalAmount] = useState("");
  const [lastAction, setLastAction] = useState<"delegate" | "approve" | null>(
    null
  );

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const isLoading = isPending || isConfirming;

  // Check if pool is halted
  const isPoolHalted = pool.poolStatus === "HALTED";

  // If pool is halted, show exit pool UI instead
  if (isPoolHalted) {
    return <LPExitPoolCard pool={pool} lpData={lpData} />;
  }

  // Predefined delegate address from environment variable
  const DELEGATE_ADDRESS =
    (process.env.NEXT_PUBLIC_LP_DELEGATE_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000";

  // Get current delegate from lpData if available
  const currentDelegate = lpData.lpPosition?.delegateAddress;

  // Check if delegate is already set
  const isDelegateSet =
    currentDelegate &&
    currentDelegate !== "0x0000000000000000000000000000000000000000";

  // Check if the current delegate matches the expected delegate
  const isExpectedDelegate =
    isDelegateSet &&
    currentDelegate?.toLowerCase() === DELEGATE_ADDRESS.toLowerCase();

  const handleSetDelegate = async () => {
    if (!address) return;
    setLastAction("delegate");

    try {
      await writeContract({
        address: pool.liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "setDelegate",
        args: [DELEGATE_ADDRESS],
      });
      toast.success("Delegate set successfully");
    } catch (error) {
      console.error("Error setting delegate:", error);
      toast.error("Failed to set delegate");
    }
  };

  const handleRemoveDelegate = async () => {
    if (!address) return;
    setLastAction("delegate");

    try {
      await writeContract({
        address: pool.liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "setDelegate",
        args: ["0x0000000000000000000000000000000000000000" as Address],
      });
      toast.success("Delegate removed successfully");
    } catch (error) {
      console.error("Error removing delegate:", error);
      toast.error("Failed to remove delegate");
    }
  };

  const handleApprovePoolCycleManager = async () => {
    if (!address || !approvalAmount) return;
    setLastAction("approve");

    try {
      const parsedAmount = parseUnits(
        approvalAmount,
        pool.reserveTokenDecimals
      );
      await writeContract({
        address: pool.reserveTokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [pool.cycleManagerAddress, parsedAmount],
      });
      toast.success("Approval successful");
      setApprovalAmount("");
    } catch (error) {
      console.error("Error approving PoolCycleManager:", error);
      toast.error("Failed to approve PoolCycleManager");
    }
  };

  return (
    <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white">
          Additional Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Delegate Management Section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">
              Delegate Management
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Set a delegate to automatically rebalance on your behalf
            </p>
            {isDelegateSet && (
              <div className="text-xs text-gray-400 bg-[#303136]/50 p-3 rounded-xl mb-3">
                <span className="text-gray-500">Current delegate: </span>
                <span className="font-mono text-white">{currentDelegate}</span>
              </div>
            )}
            {isDelegateSet && !isExpectedDelegate ? (
              <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 p-2 rounded-xl text-xs mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Different delegate set - click &quot;Set Delegate&quot; to use
                  protocol delegate
                </span>
              </div>
            ) : null}
          </div>

          {isDelegateSet ? (
            <Button
              onClick={handleRemoveDelegate}
              disabled={isLoading}
              className="w-full h-12 rounded-xl"
              variant="secondary"
            >
              {isLoading && lastAction === "delegate" && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Remove Delegate
            </Button>
          ) : (
            <Button
              onClick={handleSetDelegate}
              disabled={isLoading}
              className="w-full h-12 rounded-xl"
              variant="primary"
            >
              {isLoading && lastAction === "delegate" && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Set Delegate
            </Button>
          )}
        </div>

        {/* Approve PoolCycleManager Section */}
        <div className="space-y-3 pt-4 border-t border-[#303136]">
          <div>
            <h3 className="text-sm font-medium text-white mb-1">
              Approve for Automated Rebalance
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Approve {pool.reserveToken} spending by PoolCycleManager to enable
              automated rebalancing by delegate
            </p>
          </div>
          <div className="space-y-2">
            <Input
              type="number"
              placeholder={`Amount in ${pool.reserveToken}`}
              value={approvalAmount}
              onChange={(e) => setApprovalAmount(e.target.value)}
              disabled={isLoading}
              className="bg-[#303136]/50 border-[#303136] text-white placeholder-gray-500 rounded-xl h-12"
            />
          </div>
          <Button
            onClick={handleApprovePoolCycleManager}
            disabled={
              isLoading || !approvalAmount || parseFloat(approvalAmount) <= 0
            }
            className="w-full h-12 rounded-xl"
            variant="primary"
          >
            {isLoading && lastAction === "approve" && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Approve PoolCycleManager
          </Button>
        </div>

        {/* Info message */}
        <div className="flex items-start gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-xs">
            These actions allow automation of rebalancing. Your delegate can
            rebalance on your behalf, and approval enables them to use your
            funds for rebalancing.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
