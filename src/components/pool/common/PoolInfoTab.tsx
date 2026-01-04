"use client";

import React from "react";
import { Pool } from "@/types/pool";
import { ExternalLink, Info } from "lucide-react";
import { formatUnits } from "viem";
import { useChainId } from "wagmi";
import { getExplorerUrl } from "@/utils/explorer";
import { formatAddress } from "@/utils/utils";
import { formatTVL } from "@/utils/tvl-formatting";

interface PoolInfoTabProps {
  pool: Pool;
}

export const PoolInfoTab: React.FC<PoolInfoTabProps> = ({ pool }) => {
  const chainId = useChainId();

  const formatTokenAmount = (value: bigint | undefined, decimals: number) => {
    if (!value) return "-";
    return Number(formatUnits(value, decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Pool Metrics */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Pool Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-[#222325] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Oracle Price</p>
            <p className="text-white font-medium">
              ${pool.oraclePrice.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#222325] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Total Liquidity</p>
            <p className="text-white font-medium">
              {pool.totalLPLiquidityCommited
                ? `${formatTVL(
                    Number(
                      formatUnits(
                        pool.totalLPLiquidityCommited,
                        pool.reserveTokenDecimals
                      )
                    )
                  )}`
                : "-"}
            </p>
          </div>

          <div className="bg-[#222325] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Utilization Ratio</p>
            <p className="text-white font-medium">
              {pool.poolUtilizationRatio
                ? `${(Number(pool.poolUtilizationRatio) / 100).toFixed(2)}%`
                : "-"}
            </p>
          </div>

          <div className="bg-[#222325] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Asset Supply</p>
            <p className="text-white font-medium">
              {pool.assetSupply
                ? `${formatTokenAmount(pool.assetSupply, 18)} ${
                    pool.assetTokenSymbol
                  }`
                : "-"}
            </p>
          </div>

          <div className="bg-[#222325] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Interest Rate</p>
            <p className="text-emerald-400 font-medium">
              {pool.poolInterestRate
                ? `${(Number(pool.poolInterestRate) / 100).toFixed(2)}%`
                : "-"}
            </p>
          </div>

          <div className="bg-[#222325] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Deposit Token</p>
            <p className="text-white font-medium">{pool.reserveToken}</p>
          </div>
        </div>
      </div>

      {/* Cycle Information */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Cycle Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#222325] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Current Cycle</p>
            <p className="text-white font-medium">#{pool.currentCycle}</p>
          </div>

          <div className="bg-[#222325] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Pool Status</p>
            <p
              className={`font-medium ${
                pool.poolStatus === "ACTIVE"
                  ? "text-emerald-400"
                  : "text-yellow-400"
              }`}
            >
              {pool.poolStatus}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-gray-400" />
          <h3 className="text-white font-semibold">Contract Addresses</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Pool</p>
            <a
              href={getExplorerUrl(pool.address, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              {formatAddress(pool.address)}
              <ExternalLink size={14} />
            </a>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Oracle</p>
            <a
              href={getExplorerUrl(pool.oracleAddress, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              {formatAddress(pool.oracleAddress)}
              <ExternalLink size={14} />
            </a>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Cycle Manager</p>
            <a
              href={getExplorerUrl(pool.cycleManagerAddress, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              {formatAddress(pool.cycleManagerAddress)}
              <ExternalLink size={14} />
            </a>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Liquidity Manager</p>
            <a
              href={getExplorerUrl(pool.liquidityManagerAddress, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              {formatAddress(pool.liquidityManagerAddress)}
              <ExternalLink size={14} />
            </a>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Reserve Token</p>
            <a
              href={getExplorerUrl(pool.reserveTokenAddress, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              {pool.reserveToken} ({formatAddress(pool.reserveTokenAddress)})
              <ExternalLink size={14} />
            </a>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Asset Token</p>
            <a
              href={getExplorerUrl(pool.assetTokenAddress, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              {pool.assetTokenSymbol} ({formatAddress(pool.assetTokenAddress)})
              <ExternalLink size={14} />
            </a>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Pool Strategy</p>
            <a
              href={getExplorerUrl(pool.poolStrategyAddress, chainId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              {formatAddress(pool.poolStrategyAddress)}
              <ExternalLink size={14} />
            </a>
          </div>

          {chainId === 8453 && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Uniswap Pool</p>
              <a
                href="https://app.uniswap.org/explore/pools/base/0x6efd64f46691157C387A298E8d54c89fc6BB9E23"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-300 transition-colors font-medium flex items-center gap-2 text-sm"
              >
                0x6efd...9E23
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolInfoTab;
