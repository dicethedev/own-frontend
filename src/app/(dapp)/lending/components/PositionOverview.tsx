// src/app/(dapp)/lending/components/PositionOverview.tsx
"use client";

import React from "react";
import { TrendingUp, TrendingDown, Shield, Coins, Percent } from "lucide-react";

interface PositionOverviewProps {
  supplyAssetsFormatted: string;
  borrowAssetsFormatted: string;
  collateralFormatted: string;
  totalSupplyFormatted: string;
  totalBorrowFormatted: string;
  availableLiquidityFormatted: string;
  utilization: number;
  lltv: number;
  supplyApy: number;
  borrowApy: number;
  isLoading: boolean;
  isConnected: boolean;
}

function formatUsd(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return "$0.00";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatToken(value: string, maxDecimals = 4): string {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  const fixed = num.toFixed(Math.min(maxDecimals, num >= 1 ? 2 : maxDecimals));
  const [intPart, decPart] = fixed.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

export const PositionOverview: React.FC<PositionOverviewProps> = ({
  supplyAssetsFormatted,
  borrowAssetsFormatted,
  collateralFormatted,
  totalSupplyFormatted,
  totalBorrowFormatted,
  availableLiquidityFormatted,
  utilization,
  lltv,
  supplyApy,
  borrowApy,
  isLoading,
  isConnected,
}) => {
  const hasPosition =
    parseFloat(supplyAssetsFormatted) > 0 ||
    parseFloat(borrowAssetsFormatted) > 0 ||
    parseFloat(collateralFormatted) > 0;

  return (
    <div className="space-y-4">
      {/* APY Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#303136] bg-[#1a1b1f]/60 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-gray-500">Supply APY</span>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 bg-[#303136] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-emerald-400">
              {supplyApy.toFixed(2)}%
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Earn by lending USDC</p>
        </div>
        <div className="rounded-xl border border-[#303136] bg-[#1a1b1f]/60 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-500">Borrow APY</span>
          </div>
          {isLoading ? (
            <div className="h-8 w-24 bg-[#303136] rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-amber-400">
              {borrowApy.toFixed(2)}%
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Cost to borrow USDC</p>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Supply"
          value={formatUsd(totalSupplyFormatted)}
          icon={<TrendingUp className="h-4 w-4 text-[#2660F5]" />}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Borrow"
          value={formatUsd(totalBorrowFormatted)}
          icon={<TrendingDown className="h-4 w-4 text-amber-400" />}
          isLoading={isLoading}
        />
        <StatCard
          label="Available Liquidity"
          value={formatUsd(availableLiquidityFormatted)}
          icon={<Coins className="h-4 w-4 text-emerald-400" />}
          isLoading={isLoading}
        />
        <StatCard
          label="Utilization"
          value={`${utilization.toFixed(1)}%`}
          icon={<Shield className="h-4 w-4 text-purple-400" />}
          isLoading={isLoading}
          extra={
            <div className="w-full bg-[#1a1b1f] rounded-full h-1.5 mt-2">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(utilization, 100)}%`,
                  background:
                    utilization > 90
                      ? "#ef4444"
                      : utilization > 70
                        ? "#f59e0b"
                        : "#2660F5",
                }}
              />
            </div>
          }
        />
      </div>

      {/* User Position */}
      {isConnected && hasPosition && (
        <div className="rounded-xl border border-[#303136] bg-[#1a1b1f]/60 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Your Position
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Supplied USDC</p>
              <p className="text-lg font-semibold text-white">
                {formatToken(supplyAssetsFormatted, 2)}
              </p>
              <p className="text-xs text-gray-500">
                {formatUsd(supplyAssetsFormatted)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Collateral (AI7)</p>
              <p className="text-lg font-semibold text-white">
                {formatToken(collateralFormatted)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Borrowed USDC</p>
              <p className="text-lg font-semibold text-white">
                {formatToken(borrowAssetsFormatted, 2)}
              </p>
              <p className="text-xs text-gray-500">
                {formatUsd(borrowAssetsFormatted)}
              </p>
            </div>
          </div>
          {/* LLTV info */}
          <div className="mt-3 pt-3 border-t border-[#303136] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Liquidation LTV (LLTV)
            </span>
            <span className="text-xs font-medium text-gray-300">
              {lltv.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Stat Card ──
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isLoading: boolean;
  extra?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  isLoading,
  extra,
}) => (
  <div className="rounded-xl border border-[#303136] bg-[#1a1b1f]/60 p-3">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    {isLoading ? (
      <div className="h-6 w-20 bg-[#303136] rounded animate-pulse" />
    ) : (
      <p className="text-base font-semibold text-white">{value}</p>
    )}
    {extra}
  </div>
);

export default PositionOverview;
