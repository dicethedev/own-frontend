"use client";

import React from "react";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarketData } from "@/hooks/marketData";

export const AssetHeader: React.FC = () => {
  const { marketData, isLoading } = useMarketData("MAGS");

  const isPositive = marketData.priceChange >= 0;

  return (
    <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#222325]/80 border border-[#303136] backdrop-blur-sm">
      {/* Left: Logo & Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#303136]/50 border border-[#303136] flex items-center justify-center flex-shrink-0">
          <Image
            src="/icons/ai7-logo.svg"
            alt="AI7 Index"
            width={28}
            height={28}
            className="object-contain"
          />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">AI7 Index</h2>
          <p className="text-gray-400 text-sm">
            Tokenized Roundhill Magnificent Seven ETF (MAGS)
          </p>
        </div>
      </div>

      {/* Right: Price & Change */}
      <div className="text-right">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-6 w-20 bg-[#303136] rounded mb-1" />
            <div className="h-4 w-16 bg-[#303136] rounded ml-auto" />
          </div>
        ) : (
          <>
            <p className="text-white font-semibold text-xl">
              ${marketData.price.toFixed(2)}
            </p>
            <div
              className={`flex items-center justify-end gap-1 text-sm ${
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
                {marketData.priceChange.toFixed(2)}%
              </span>
              <span className="text-gray-500">24h</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssetHeader;
