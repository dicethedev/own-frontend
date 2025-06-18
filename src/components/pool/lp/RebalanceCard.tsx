import React, { useState } from "react";
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
import { Loader2, Info } from "lucide-react";
import { useAccount } from "wagmi";
import { useRebalancing, calculateRebalanceState } from "@/hooks/lp";
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

  const { isLP, isLoading: isLoadingLPData } = lpData;

  // Calculate rebalance state from pool data
  const rebalanceStatus = calculateRebalanceState(pool);

  const { rebalancePool, isLoading } = useRebalancing(pool.cycleManagerAddress);
  const hasLPRebalanced =
    Number(lpData.lpPosition?.lastRebalanceCycle) === pool.currentCycle;

  const handleRebalancePool = async () => {
    if (!address || !rebalancePrice) return;

    try {
      await rebalancePool(address, rebalancePrice);
    } catch (error) {
      console.error("Error in rebalance:", error);
    }
  };

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
      case RebalanceState.ACTIVE:
        return (
          <div className="flex items-center text-sm text-gray-400 bg-slate-800/50 p-4 rounded-lg">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Pool cycle is active. Rebalancing will begin when US stock market
              opens (9:30 AM ET).
            </span>
          </div>
        );
      case RebalanceState.READY_FOR_OFFCHAIN_REBALANCE:
        return (
          <div className="flex items-center text-sm text-gray-400 bg-slate-800/50 p-4 rounded-lg">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Pool is ready for offchain rebalancing. It will begin soon.
            </span>
          </div>
        );

      case RebalanceState.OFFCHAIN_REBALANCE_IN_PROGRESS:
        return (
          <div className="flex items-center text-sm text-gray-400 bg-slate-800/50 p-4 rounded-lg">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Pool is offchain rebalancing. Onchain rebalancing will begin when
              US stock market closes (4:00 PM ET).
            </span>
          </div>
        );

      case RebalanceState.READY_FOR_ONCHAIN_REBALANCE:
        return (
          <div className="flex items-center text-sm text-gray-400 bg-slate-800/50 p-4 rounded-lg">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Pool is ready for onchain rebalancing. It will begin soon.
            </span>
          </div>
        );

      case RebalanceState.ONCHAIN_REBALANCE_IN_PROGRESS:
        return (
          <div className="space-y-4">
            <div className="flex items-center text-sm text-gray-400 bg-slate-800/50 p-4 rounded-lg mb-4">
              <Info className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>
                {hasLPRebalanced
                  ? "You've successfully rebalanced. Pool will become active once all LPs rebalance."
                  : "Onchain rebalancing is in progress. You can rebalance now."}
              </span>
            </div>
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
              disabled={isLoading || !rebalancePrice || hasLPRebalanced}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Execute Rebalance
            </Button>
          </div>
        );

      default:
        return (
          <div className="flex items-center text-sm text-gray-400 bg-slate-800/50 p-4 rounded-lg">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Pool cycle is active. Rebalancing will begin when US stock market
              opens (9:30 AM ET).
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
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {renderRebalanceInfo()}
        {renderStateBasedActions()}
      </CardContent>
    </Card>
  );
};
