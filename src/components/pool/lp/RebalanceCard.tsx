// RebalanceCard.tsx
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
import { Loader2, AlertTriangle, Clock, Info } from "lucide-react";
import { useAccount } from "wagmi";
import {
  useRebalancing,
  useRebalanceInfo,
  useRebalanceStatus,
  useLPStatus,
  formatDuration,
} from "@/hooks/lp";
import { formatUnits } from "viem";

interface RebalanceCardProps {
  pool: Pool;
}

export const RebalanceCard: React.FC<RebalanceCardProps> = ({ pool }) => {
  const { address } = useAccount();
  const [rebalancePrice, setRebalancePrice] = useState("");
  const [rebalanceAmount, setRebalanceAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const { isLP } = useLPStatus(pool.address);
  const rebalanceInfo = useRebalanceInfo(pool.address);
  const rebalanceStatus = useRebalanceStatus(pool.address);

  const {
    initiateOffchainRebalance,
    initiateOnchainRebalance,
    rebalancePool,
    settlePool,
    isLoading,
  } = useRebalancing(pool.address);

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
    if (!address || !rebalancePrice || !rebalanceAmount) return;

    // Determine if it's a deposit based on rebalanceAmount
    const isDeposit = rebalanceInfo?.rebalanceAmount
      ? rebalanceInfo.rebalanceAmount > BigInt(0)
      : false;

    try {
      await rebalancePool(address, rebalancePrice, rebalanceAmount, isDeposit);
      setRebalancePrice("");
      setRebalanceAmount("");
    } catch (error) {
      console.error("Error in rebalance:", error);
    }
  };

  const renderTimingInfo = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-lg mb-4">
      <div>
        <p className="text-gray-400">Cycle Length</p>
        <p className="text-white font-medium">
          {rebalanceStatus.cycleLength
            ? formatDuration(Number(rebalanceStatus.cycleLength))
            : "-"}
        </p>
      </div>
      <div>
        <p className="text-gray-400">Rebalance Window</p>
        <p className="text-white font-medium">
          {rebalanceStatus.rebalanceLength
            ? formatDuration(Number(rebalanceStatus.rebalanceLength))
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
        <p className="text-gray-400 mb-2">Net Reserve Delta</p>
        <p className="text-white font-medium">
          {rebalanceInfo?.netReserveDelta !== undefined
            ? `${formatUnits(rebalanceInfo.netReserveDelta, 6)} ${
                pool.depositToken
              }`
            : "-"}
        </p>
      </div>
      <div>
        <p className="text-gray-400 mb-2">Rebalance Amount</p>
        <p className="text-white font-medium">
          {rebalanceInfo?.rebalanceAmount !== undefined
            ? `${formatUnits(rebalanceInfo.rebalanceAmount, 6)} ${
                pool.depositToken
              }`
            : "-"}
        </p>
      </div>
      <div>
        <p className="text-gray-400 mb-2">Total Deposit Requests</p>
        <p className="text-white font-medium">
          {rebalanceInfo?.totalDepositRequests !== undefined
            ? `${formatUnits(rebalanceInfo.totalDepositRequests, 6)} ${
                pool.depositToken
              }`
            : "-"}
        </p>
      </div>
      <div>
        <p className="text-gray-400 mb-2">Total Redemption Requests</p>
        <p className="text-white font-medium">
          {rebalanceInfo?.totalRedemptionRequests !== undefined
            ? `${formatUnits(rebalanceInfo.totalRedemptionRequests, 18)} x${
                pool.assetSymbol
              }`
            : "-"}
        </p>
      </div>
    </div>
  );

  const renderStateBasedActions = () => {
    switch (rebalanceStatus.state) {
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
                  Rebalance Price (in {pool.depositToken})
                </label>
              </div>
              <Input
                type="number"
                placeholder={`Enter price in ${pool.depositToken}`}
                value={rebalancePrice}
                onChange={(e) => setRebalancePrice(e.target.value)}
                className="bg-slate-600/50 border-slate-700"
              />
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">
                  Rebalance Amount
                </label>
              </div>
              <Input
                type="number"
                placeholder="Enter amount to rebalance"
                value={rebalanceAmount}
                onChange={(e) => setRebalanceAmount(e.target.value)}
                className="bg-slate-600/50 border-slate-700"
              />
            </div>
            <Button
              onClick={handleRebalancePool}
              disabled={isLoading || !rebalancePrice || !rebalanceAmount}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Execute Rebalance
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-gray-400">or</span>
              </div>
            </div>
            <Button
              onClick={settlePool}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Settle Pool
            </Button>
            <div className="flex items-center text-sm text-blue-500 bg-blue-500/10 p-3 rounded-lg">
              <Info className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                Complete the rebalance by executing trade or settle if rebalance
                window expires.
              </span>
            </div>
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
              rebalanceStatus.state === RebalanceState.NOT_READY
                ? "bg-gray-800 text-gray-400"
                : rebalanceStatus.state ===
                  RebalanceState.READY_FOR_OFFCHAIN_REBALANCE
                ? "bg-yellow-500/20 text-yellow-500"
                : rebalanceStatus.state ===
                  RebalanceState.OFFCHAIN_REBALANCE_IN_PROGRESS
                ? "bg-orange-500/20 text-orange-500"
                : rebalanceStatus.state ===
                  RebalanceState.READY_FOR_ONCHAIN_REBALANCE
                ? "bg-blue-500/20 text-blue-500"
                : "bg-green-500/20 text-green-500"
            }`}
          >
            {rebalanceStatus.state.replace(/_/g, " ")}
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
