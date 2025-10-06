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

  // Predefined delegate address from environment variable
  const DELEGATE_ADDRESS =
    (process.env.NEXT_PUBLIC_LP_DELEGATE_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000";

  // Get current delegate from lpData if available
  const currentDelegate = lpData.lpPosition?.delegateAddress;

  // Check if delegate is already set
  const isDelegateSet =
    currentDelegate &&
    currentDelegate !== "0x0000000000000000000000000000000000000000" &&
    currentDelegate.toLowerCase() === DELEGATE_ADDRESS.toLowerCase();

  // Handle setting delegate address
  const handleSetDelegate = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setLastAction("delegate");
      const toastId = toast.loading("Setting delegate address...");

      await writeContract({
        address: pool.liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "setDelegate",
        args: [DELEGATE_ADDRESS],
      });

      toast.success("Request to set delegate address sent successfully", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error setting delegate:", error);
      toast.error("Failed to set delegate address");
    }
  };

  // Handle removing delegate
  const handleRemoveDelegate = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setLastAction("delegate");
      const toastId = toast.loading("Removing delegate address...");

      await writeContract({
        address: pool.liquidityManagerAddress,
        abi: poolLiquidityManagerABI,
        functionName: "setDelegate",
        args: ["0x0000000000000000000000000000000000000000" as Address],
      });

      toast.success("Request to remove delegate address sent successfully", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error removing delegate:", error);
      toast.error("Failed to remove delegate address");
    }
  };

  // Handle approving poolCycleManager
  const handleApprovePoolCycleManager = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    if (!approvalAmount || parseFloat(approvalAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setLastAction("approve");
      const toastId = toast.loading("Approving PoolCycleManager...");

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

      toast.success("Request to approve PoolCycleManager sent successfully", {
        id: toastId,
      });
      setApprovalAmount("");
    } catch (error) {
      console.error("Error approving PoolCycleManager:", error);
      toast.error("Failed to approve PoolCycleManager");
    }
  };

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="px-4 py-2 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          Additional Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-4 space-y-6">
        {/* Set Delegate Section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-1">
              Automated Rebalancing Delegate
            </h3>
            <p className="text-xs text-gray-400 mb-2">
              Enable a trusted delegate to rebalance your position automatically
            </p>
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">Current Delegate:</p>
              {currentDelegate &&
              currentDelegate !==
                "0x0000000000000000000000000000000000000000" ? (
                <p className="text-xs font-mono text-gray-300 bg-slate-800/50 p-2 rounded break-all">
                  {currentDelegate}
                </p>
              ) : (
                <p className="text-xs text-gray-500 italic">None</p>
              )}
            </div>
            {isDelegateSet ? (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-2 rounded text-xs">
                <span>
                  ✓ Delegate is active and matches the protocol delegate
                </span>
              </div>
            ) : currentDelegate &&
              currentDelegate !==
                "0x0000000000000000000000000000000000000000" ? (
              <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 p-2 rounded text-xs">
                <span>
                  ⚠ Different delegate set - click &quot;Set Delegate&quot; to
                  use protocol delegate
                </span>
              </div>
            ) : null}
          </div>

          {isDelegateSet ? (
            <Button
              onClick={handleRemoveDelegate}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700"
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
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && lastAction === "delegate" && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Set Delegate
            </Button>
          )}
        </div>

        {/* Approve PoolCycleManager Section */}
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-1">
              Approve for Automated Rebalance
            </h3>
            <p className="text-xs text-gray-400 mb-2">
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
              className="bg-slate-800/50 border-gray-700 text-white placeholder-gray-500"
            />
          </div>
          <Button
            onClick={handleApprovePoolCycleManager}
            disabled={
              isLoading || !approvalAmount || parseFloat(approvalAmount) <= 0
            }
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading && lastAction === "approve" && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Approve PoolCycleManager
          </Button>
        </div>

        {/* Info message */}
        <div className="flex items-start gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-lg">
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
