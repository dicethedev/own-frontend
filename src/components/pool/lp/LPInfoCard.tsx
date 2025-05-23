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
import { formatTVL } from "@/utils/tvl-formatting";

interface LPInfoCardProps {
  pool: Pool;
  lpData: LPData;
}

export const LPInfoCard: React.FC<LPInfoCardProps> = ({ pool, lpData }) => {
  const chainId = useChainId();
  const { isLoading, error } = lpData;

  // Show loading state
  if (isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Pool Information
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
            Pool Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-red-500">
            Error loading pool information: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          Pool Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <p className="text-gray-400">Liquidity Manager</p>
            <a
              href={getExplorerUrl(pool.liquidityManagerAddress, chainId)}
              target="_blank"
              className="text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2"
            >
              {formatAddress(pool.liquidityManagerAddress) || "-"}
              <ExternalLink size={14} />
            </a>
          </div>

          <div>
            <p className="text-gray-400">Cycle Manager</p>
            <a
              href={getExplorerUrl(pool.cycleManagerAddress, chainId)}
              target="_blank"
              className="text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2"
            >
              {formatAddress(pool.cycleManagerAddress) || "-"}
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
            <p className="text-gray-400">Deposit Token</p>
            <p className="text-white font-medium truncate">
              {pool.reserveToken}
            </p>
          </div>

          <div>
            <p className="text-gray-400">Oracle Price</p>
            <p className="text-white font-medium">
              ${pool.oraclePrice.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-400">Total LP Liquidity</p>
            <p className="text-white font-medium">
              {pool.totalLPLiquidityCommited
                ? `${formatTVL(
                    Number(
                      formatUnits(
                        pool.totalLPLiquidityCommited,
                        pool.reserveTokenDecimals
                      )
                    )
                  )} ${pool.reserveToken}`
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
            <p className="text-gray-400">Pool Interest</p>
            <p className="text-white font-medium">
              {pool.poolInterestRate
                ? `${(Number(pool.poolInterestRate) / 100).toFixed(2)}%`
                : "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-400">Pool Utilization</p>
            <p className="text-white font-medium">
              {pool.poolUtilizationRatio
                ? `${(Number(pool.poolUtilizationRatio) / 100).toFixed(2)}%`
                : "-"}
            </p>
          </div>

          <div>
            <p className="text-gray-400">Asset Supply</p>
            <p className="text-white font-medium">
              {pool.assetSupply
                ? `${Number(formatUnits(pool.assetSupply, 18)).toFixed(2)} ${
                    pool.assetTokenSymbol
                  }`
                : "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
