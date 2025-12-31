"use client";

import React from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ArrowUpRight, ArrowDownRight, Zap, Share2 } from "lucide-react";
import { usePortfolio, PortfolioPosition } from "@/hooks/usePortfolio";

// Format currency with proper decimals
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `$${value.toFixed(2)}`;
};

// Format token balance
const formatBalance = (balance: string): string => {
  const num = parseFloat(balance);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (num < 0.001 && num > 0) {
    return "< 0.001";
  }
  return num.toFixed(4);
};

// Share on X handler
const handleShareOnX = () => {
  const tweetText = encodeURIComponent(
    "Earning 24% APY by investing in ETFs onchain is the best way to save in this bear market. You can invest in AI7 Index now on @ownfinanceHQ"
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
  window.open(twitterUrl, "_blank", "noopener,noreferrer");
};

// Position Card Component
const PositionCard: React.FC<{ position: PortfolioPosition }> = ({
  position,
}) => {
  const isPositiveChange = position.priceChange24h >= 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          {/* Token Logo */}
          <div className="w-12 h-12 rounded-full bg-[#303136]/50 border border-[#303136] flex items-center justify-center overflow-hidden">
            <Image
              src={position.logo}
              alt={position.symbol}
              width={28}
              height={28}
              className="object-contain"
            />
          </div>

          {/* Token Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{position.name}</h3>
            </div>
            <p className="text-gray-400 text-sm">
              {formatBalance(position.balance)} {position.symbol}
            </p>
          </div>
        </div>

        {/* Price Change Badge */}
        <div className="flex items-center gap-1">
          {isPositiveChange ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-400" />
          )}
          <span
            className={`text-sm font-semibold ${
              isPositiveChange ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isPositiveChange ? "+" : ""}
            {position.priceChange24h.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">Total Value</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(position.usdValue)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Current Price</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(position.usdPrice)}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Unrealized P&L</p>
          <p
            className={`text-2xl font-bold ${
              position.unrealizedGainPercent >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {position.unrealizedGainPercent >= 0 ? "+" : ""}
            {formatCurrency(
              position.usdValue * (position.unrealizedGainPercent / 100)
            )}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#303136] my-4" />

      {/* APY Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Annual Percentage Yield</p>
            <p className="text-xl font-bold text-white">{position.apy}% APY</p>
          </div>
        </div>

        {/* Share on X Button */}
        <button
          onClick={handleShareOnX}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#303136]/50 border border-[#303136] hover:bg-[#303136] text-white font-medium rounded-xl transition-all duration-200"
        >
          <Share2 className="w-4 h-4" />
          Share on X
        </button>
      </div>
    </div>
  );
};

// Main Portfolio Section Component
export default function PortfolioSection() {
  const { isConnected } = useAccount();
  const { positions, isLoading } = usePortfolio();

  const renderContent = () => {
    // Show loader when loading
    if (isConnected && isLoading) {
      return (
        <div className="p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-[#303136]" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            </div>
            <p className="text-gray-400">Loading portfolio...</p>
          </div>
        </div>
      );
    }

    // Show empty state when not connected or no positions
    if (!isConnected || positions.length === 0) {
      return (
        <div className="p-8 text-center">
          <p className="text-gray-400 text-lg">No Investments</p>
        </div>
      );
    }

    // Show position cards
    return (
      <div className="p-4 sm:p-6">
        {positions.map((position, index) => (
          <div key={position.symbol}>
            {index > 0 && <div className="border-t border-[#303136] my-6" />}
            <PositionCard position={position} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="mt-8">
      <div className="bg-[#222325] border border-[#303136] rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="border-b border-[#303136] px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Your Portfolio</h2>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </section>
  );
}
