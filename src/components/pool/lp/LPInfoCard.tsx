import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { formatUnits } from "viem";
import {
  useLPStatus,
  useLPLiquidity,
  usePoolLPStats,
  useLastRebalancedCycle,
} from "@/hooks/lp";
import { useAccount, useChainId } from "wagmi";
import { getExplorerUrl } from "@/utils/explorer";
import { ExternalLink } from "lucide-react";
import { formatAddress } from "@/utils/utils";

interface LPInfoCardProps {
  pool: Pool;
}

export const LPInfoCard: React.FC<LPInfoCardProps> = ({ pool }) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { isLP } = useLPStatus(pool.address);
  const { lpLiquidity } = useLPLiquidity(pool.address);
  const { totalLPLiquidity, lpCount } = usePoolLPStats(pool.address);
  const lastRebalancedCycle = useLastRebalancedCycle(pool.address, address!);

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
              {lpLiquidity
                ? `${formatUnits(lpLiquidity, 18)} ${pool.depositToken}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Total LP Liquidity</p>
            <p className="text-white font-medium">
              {totalLPLiquidity
                ? `${formatUnits(totalLPLiquidity, 18)} ${pool.depositToken}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Total LPs</p>
            <p className="text-white font-medium">
              {lpCount?.toString() || "0"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Last Rebalanced Cycle</p>
            <p className="text-white font-medium">
              {lastRebalancedCycle?.toString() || "Never"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Pool</p>
            <a
              href={getExplorerUrl(pool.address, chainId)}
              target="_blank"
              className="text-white hover:text-blue-300 hover:underline transition-colors font-medium flex items-center gap-2"
            >
              {formatAddress(pool.oracleAddress) || "-"}
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
            <p className="text-gray-400">Oracle Price</p>
            <p className="text-white font-medium">
              {pool.oraclePrice.toLocaleString() || "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Oracle Last Updated</p>
            <p className="text-white font-medium">{"-"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
