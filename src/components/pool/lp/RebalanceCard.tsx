import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui/BaseComponents";
import { Pool, RebalanceState } from "@/types/pool";
import { LPData } from "@/types/lp";
import { Loader2, AlertTriangle, Clock, Info } from "lucide-react";
import { useAccount } from "wagmi";
import {
  useRebalancing,
  calculateRebalanceState,
  formatDuration,
} from "@/hooks/lp";
import { formatUnits } from "viem";

interface RebalanceCardProps {
  pool: Pool;
  lpData: LPData;
}

export const RebalanceCard: React.FC<RebalanceCardProps> = ({
  pool,
  lpData,
}) => {
  const { address } = useAccount();
  const [rebalancePrice, setRebalancePrice] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const { isLP, isLoading: isLoadingLPData } = lpData;

  // Calculate rebalance state from pool data
  const rebalanceStatus = calculateRebalanceState(pool);

  const {
    initiateOffchainRebalance,
    initiateOnchainRebalance,
    rebalancePool,
    isLoading,
  } = useRebalancing(pool.cycleManagerAddress);

  // Update countdown timer
  useEffect(() => {
    if (rebalanceStatus.timeUntilNextAction === undefined) return;

    setTimeLeft(rebalanceStatus.timeUntilNextAction);
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [rebalanceStatus.timeUntilNextAction]);

  const handleRebalancePool = async () => {
    if (!address || !rebalancePrice) return;

    try {
      await rebalancePool(address, rebalancePrice);
    } catch (error) {
      console.error("Error in rebalance:", error);
    }
  };

  const renderTimingInfo = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-lg mb-4">
      <div>
        <p className="text-gray-400">Rebalance Window</p>
        <p className="text-white font-medium">
          {pool.rebalanceLength
            ? formatDuration(Number(pool.rebalanceLength))
            : "-"}
        </p>
      </div>
      {rebalanceStatus.nextActionTime && (
        <>
          <div>
            <p className="text-gray-400">Next Action</p>
            <p className="text-white font-medium">
              {rebalanceStatus.nextActionTime.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Time Remaining</p>
            <p className="text-white font-medium flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDuration(timeLeft)}
            </p>
          </div>
        </>
      )}
    </div>
  );

  const renderRebalanceInfo = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <p className="text-gray-400 mb-2">Total Deposit Requests</p>
        <p className="text-white font-medium">
          {pool.cycleTotalDeposits !== undefined
            ? `${formatUnits(
                pool.cycleTotalDeposits,
                pool.reserveTokenDecimals
              )} ${pool.reserveToken}`
            : "-"}
        </p>
      </div>
      <div>
        <p className="text-gray-400 mb-2">Total Redemption Requests</p>
        <p className="text-white font-medium">
          {pool.cycleTotalRedemptions !== undefined
            ? `${formatUnits(pool.cycleTotalRedemptions, 18)} x${
                pool.assetSymbol
              }`
            : "-"}
        </p>
      </div>
    </div>
  );

  const renderStateBasedActions = () => {
    switch (rebalanceStatus.rebalanceState) {
      case RebalanceState.READY_FOR_OFFCHAIN_REBALANCE:
        return (
          <div className="space-y-4">
            <Button
              onClick={initiateOffchainRebalance}
              disabled={isLoading}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Initiate Offchain Rebalance
            </Button>
            <div className="flex items-center text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded-lg">
              <Info className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Cycle complete. Ready to start offchain rebalancing.</span>
            </div>
          </div>
        );

      case RebalanceState.READY_FOR_ONCHAIN_REBALANCE:
        return (
          <div className="space-y-4">
            <Button
              onClick={initiateOnchainRebalance}
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Initiate Onchain Rebalance
            </Button>
            <div className="flex items-center text-sm text-orange-500 bg-orange-500/10 p-3 rounded-lg">
              <Info className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                Offchain rebalancing complete. Ready to start onchain
                rebalancing.
              </span>
            </div>
          </div>
        );

      case RebalanceState.ONCHAIN_REBALANCE_IN_PROGRESS:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">
                  Rebalance Price (USD)
                </label>
              </div>
              <Input
                type="number"
                placeholder={`Enter price`}
                value={rebalancePrice}
                onChange={(e) => setRebalancePrice(e.target.value)}
                className="bg-slate-600/50 border-slate-700 h-12 px-2"
              />
            </div>
            <Button
              onClick={handleRebalancePool}
              disabled={isLoading || !rebalancePrice}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Execute Rebalance
            </Button>
          </div>
        );

      case RebalanceState.OFFCHAIN_REBALANCE_IN_PROGRESS:
        return (
          <div className="flex items-center text-sm text-yellow-500 bg-yellow-500/10 p-4 rounded-lg">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Offchain rebalancing in progress. Please wait for the rebalance
              window to complete.
            </span>
          </div>
        );

      default:
        return (
          <div className="flex items-center text-sm text-gray-400 bg-slate-800/50 p-4 rounded-lg">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Pool cycle is active. Rebalancing will be available after the
              cycle ends.
            </span>
          </div>
        );
    }
  };

  // Show loading state
  if (isLoadingLPData) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Rebalance Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  // Only render if user is an LP
  if (!isLP) return null;

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-white">
            Rebalance Actions
          </CardTitle>
          <span
            className={`text-sm px-3 py-1 rounded-full ${
              rebalanceStatus.rebalanceState === RebalanceState.NOT_READY
                ? "bg-gray-800 text-gray-400"
                : rebalanceStatus.rebalanceState ===
                  RebalanceState.READY_FOR_OFFCHAIN_REBALANCE
                ? "bg-yellow-500/20 text-yellow-500"
                : rebalanceStatus.rebalanceState ===
                  RebalanceState.OFFCHAIN_REBALANCE_IN_PROGRESS
                ? "bg-orange-500/20 text-orange-500"
                : rebalanceStatus.rebalanceState ===
                  RebalanceState.READY_FOR_ONCHAIN_REBALANCE
                ? "bg-blue-500/20 text-blue-500"
                : "bg-green-500/20 text-green-500"
            }`}
          >
            {rebalanceStatus.rebalanceState.replace(/_/g, " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {renderTimingInfo()}
        {renderRebalanceInfo()}
        {renderStateBasedActions()}
      </CardContent>
    </Card>
  );
};
