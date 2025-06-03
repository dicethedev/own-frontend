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
          <div className="flex items-center text-sm text-orange-500 bg-orange-500/10 p-4 rounded-lg">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Offchain rebalancing in progress. Onchain rebalancing will be
              available once US stock market closes.
            </span>
          </div>
        );

      default:
        return (
          <div className="flex items-center text-sm text-gray-400 bg-slate-800/50 p-4 rounded-lg">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>
              Pool cycle is active. Rebalancing will begin when US stock market
              opens
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
