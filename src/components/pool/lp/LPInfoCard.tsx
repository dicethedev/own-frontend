import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { LPData } from "@/types/lp";
import { formatUnits } from "viem";
import { useChainId } from "wagmi";
import { getExplorerUrl } from "@/utils/explorer";
import { ExternalLink, Loader2 } from "lucide-react";
import { formatAddress } from "@/utils/utils";

interface LPInfoCardProps {
  pool: Pool;
  lpData: LPData;
}

export const LPInfoCard: React.FC<LPInfoCardProps> = ({ pool, lpData }) => {
  const chainId = useChainId();
  const { isLP, lpPosition, isLoading, error } = lpData;

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            LP Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            LP Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-red-500">
            Error loading LP information: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          LP Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400">LP Status</p>
            <p className="text-white font-medium">
              {isLP ? "Registered LP" : "Not Registered"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Your Liquidity</p>
            <p className="text-white font-medium">
              {isLP && lpPosition?.liquidityCommitment
                ? `${formatUnits(lpPosition.liquidityCommitment, 18)} ${
                    pool.depositToken
                  }`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Total LP Liquidity</p>
            <p className="text-white font-medium">
              {pool.totalLPLiquidityCommited
                ? `${formatUnits(pool.totalLPLiquidityCommited, 18)} ${
                    pool.depositToken
                  }`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Total LPs</p>
            <p className="text-white font-medium">
              {pool.lpCount?.toString() || "0"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Last Rebalanced Cycle</p>
            <p className="text-white font-medium">
              {(isLP && lpPosition?.lastRebalanceCycle?.toString()) || "Never"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Pool</p>
            <a
              href={getExplorerUrl(pool.address, chainId)}
              target="_blank"
              className="text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2"
            >
              {formatAddress(pool.address) || "-"}
              <ExternalLink size={14} />
            </a>
          </div>
          <div>
            <p className="text-gray-400">Oracle</p>
            <a
              href={getExplorerUrl(pool.oracleAddress, chainId)}
              target="_blank"
              className="text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2"
            >
              {formatAddress(pool.oracleAddress) || "-"}
              <ExternalLink size={14} />
            </a>
          </div>
          <div>
            <p className="text-gray-400">Your Collateral</p>
            <p className="text-white font-medium">
              {isLP && lpPosition?.collateralAmount
                ? `${formatUnits(lpPosition.collateralAmount, 18)} ${
                    pool.depositToken
                  }`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Interest Accrued</p>
            <p className="text-white font-medium">
              {isLP && lpPosition?.interestAccrued
                ? `${formatUnits(lpPosition.interestAccrued, 18)} ${
                    pool.depositToken
                  }`
                : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
