"use client";

import React from "react";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Pool } from "@/types/pool";

interface PoolAssetHeaderProps {
  pool: Pool;
  pageType?: "mint" | "underwrite";
}

export const PoolAssetHeader: React.FC<PoolAssetHeaderProps> = ({ pool }) => {
  const isPositive = pool.priceChange >= 0;

  // Get the appropriate logo based on asset symbol
  const getAssetLogo = () => {
    if (pool.assetSymbol.toLowerCase() === "ai7") {
      return "/icons/ai7-logo.svg";
    }
    return "/icons/ai7-logo.svg"; // Fallback
  };

  // Get asset description
  const getAssetDescription = () => {
    if (pool.assetSymbol.toLowerCase() === "ai7") {
      return "Tokenized Roundhill Magnificent Seven ETF (MAGS)";
    }
    return pool.assetName;
  };

  // Helper to render badges to avoid code duplication
  const renderBadges = () => (
    <>
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          pool.poolStatus === "ACTIVE"
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-yellow-500/20 text-yellow-400"
        }`}
      >
        {pool.poolStatus}
      </span>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#303136] text-gray-300">
        Cycle #{pool.currentCycle}
      </span>
    </>
  );

  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#222325]/80 border border-[#303136] backdrop-blur-sm">
      {/* Left: Logo & Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#303136]/50 border border-[#303136] flex items-center justify-center flex-shrink-0">
          <Image
            src={getAssetLogo()}
            alt={pool.assetName}
            width={28}
            height={28}
            className="object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold text-lg">
              {pool.assetSymbol.toUpperCase() === "AI7"
                ? "AI7 Index"
                : pool.assetName}
            </h2>

            {/* DESKTOP ONLY: Badges next to title */}
            <div className="hidden sm:flex items-center gap-3">
              {renderBadges()}
            </div>
          </div>

          <p className="text-gray-400 text-sm">{getAssetDescription()}</p>

          {/* MOBILE ONLY: Badges below description */}
          <div className="flex sm:hidden items-center gap-2 mt-2">
            {renderBadges()}
          </div>
        </div>
      </div>

      {/* Right: Price & Change */}
      <div className="text-left sm:text-right">
        <p className="text-white font-semibold text-xl">
          ${pool.assetPrice.toLocaleString()}
        </p>
        <div
          className={`flex items-center sm:justify-end gap-1 text-sm ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {pool.priceChange.toFixed(2)}%
          </span>
          <span className="text-gray-500">24h</span>
        </div>
      </div>
    </div>
  );
};

export default PoolAssetHeader;
