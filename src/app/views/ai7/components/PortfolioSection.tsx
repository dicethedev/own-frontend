"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Info, Gift, Clock, CheckCircle2, Coins, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useOGUserStats, OGUserRewards } from "@/hooks/useOGUserStats";

// Minimum AI7 balance required for rewards
const MIN_AI7_FOR_REWARDS = 1;

// Tab types
type TabType = "portfolio" | "rewards" | "history";

// Current APY rate
const CURRENT_APY = 24;

// Format currency with proper decimals
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
  return `$${value.toFixed(2)}`;
};

// Format token balance
const formatBalance = (balance: string | number): string => {
  const num = typeof balance === "string" ? parseFloat(balance) : balance;
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  }
  if (num < 0.001 && num > 0) {
    return "< 0.001";
  }
  return num.toFixed(3);
};

// Share on X handler
const handleShareOnX = () => {
  const tweetText = encodeURIComponent(
    "Earning 24% APY by investing in ETFs onchain is the best way to save in this bear market. You can invest in AI7 Index now on @ownfinanceHQ"
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
  window.open(twitterUrl, "_blank", "noopener,noreferrer");
};

// Table Header with Info Icon
const TableHeader: React.FC<{ label: string; hasInfo?: boolean }> = ({
  label,
  hasInfo = false,
}) => (
  <th className="py-4 px-4 text-left">
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400 text-sm font-medium tracking-wide">
        {label}
      </span>
      {hasInfo && (
        <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
      )}
    </div>
  </th>
);

// Portfolio Row Props
interface PortfolioRowProps {
  tokenName: string;
  tokenLogo: string;
  size: number;
  amountInvested: number;
  entryPrice: number;
  marketPrice: number;
  accruedRewards: number;
}

// Portfolio Table Row Component
const PortfolioRow: React.FC<PortfolioRowProps> = ({
  tokenName,
  tokenLogo,
  size,
  amountInvested,
  entryPrice,
  marketPrice,
  accruedRewards,
}) => {
  // Check if user qualifies for APY rewards (balance >= 1 AI7)
  const isEligibleForAPY = size >= MIN_AI7_FOR_REWARDS;

  // Calculate values
  const currentValue = size * marketPrice;
  const unrealizedPnL = currentValue - amountInvested;
  const unrealizedPnLPercent = amountInvested > 0 ? (unrealizedPnL / amountInvested) * 100 : 0;

  // Use actual accrued rewards from API (will be 0 if not eligible)
  const rewardsPercent = amountInvested > 0 ? (accruedRewards / amountInvested) * 100 : 0;

  // Net Gain = Unrealized PnL + Actual Rewards from API
  const netGain = unrealizedPnL + accruedRewards;
  const netGainPercent = unrealizedPnLPercent + rewardsPercent;

  return (
    <tr className="border-b border-[#303136]/50 last:border-b-0">
      {/* Asset */}
      <td className="py-5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#303136]/50 border border-[#303136] flex items-center justify-center overflow-hidden">
            <Image
              src={tokenLogo}
              alt={tokenName}
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-white font-semibold">{tokenName}</span>
        </div>
      </td>

      {/* Size */}
      <td className="py-5 px-4">
        <span className="text-gray-300 font-mono">
          {formatBalance(size)}
        </span>
      </td>

      {/* Amount Invested */}
      <td className="py-5 px-4">
        <span className="text-gray-300">
          {formatCurrency(amountInvested)}
        </span>
      </td>

      {/* Entry/Market Price */}
      <td className="py-5 px-4">
        <span className="text-gray-300 font-mono">
          {entryPrice.toFixed(2)}/{marketPrice.toFixed(2)}
        </span>
      </td>

      {/* Unrealised PnL */}
      <td className="py-5 px-4">
        <span className={`font-semibold ${unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {unrealizedPnL >= 0 ? "" : "-"}{formatCurrency(Math.abs(unrealizedPnL))} ({unrealizedPnLPercent >= 0 ? "" : "-"}{Math.abs(unrealizedPnLPercent).toFixed(0)}%)
        </span>
      </td>

      {/* Rewards */}
      <td className="py-5 px-4">
        {isEligibleForAPY ? (
          <span className={`font-semibold ${accruedRewards >= 0 ? "text-emerald-400" : "text-gray-300"}`}>
            {formatCurrency(accruedRewards)} ({rewardsPercent.toFixed(1)}%)
          </span>
        ) : (
          <span className="text-gray-500">
            --
          </span>
        )}
      </td>

      {/* Net Gain */}
      <td className="py-5 px-4">
        <span className={`font-semibold ${netGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {netGain >= 0 ? "" : "-"}{formatCurrency(Math.abs(netGain))} ({netGainPercent >= 0 ? "" : "-"}{Math.abs(netGainPercent).toFixed(0)}%)
        </span>
      </td>
    </tr>
  );
};

// Low Balance Nudge Component
const LowBalanceNudge: React.FC<{ currentBalance: number }> = ({ currentBalance }) => {
  const needed = MIN_AI7_FOR_REWARDS - currentBalance;

  return (
    <div className="m-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 animate-pulse-slow">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertCircle className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-white font-semibold">Unlock 24% APY Rewards!</h4>
          </div>
          <p className="text-gray-400 text-sm mb-3">
            You need at least <span className="text-amber-400 font-semibold">1 AI7</span> to start earning rewards.
            {currentBalance > 0 ? (
              <> Get <span className="text-white font-semibold">{needed.toFixed(3)} more AI7</span> to qualify.</>
            ) : (
              <> Start investing today to earn <span className="text-emerald-400 font-semibold">24% APY</span> on your holdings.</>
            )}
          </p>
          <Link
            href="#swap"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
          >
            Get AI7 Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Rewards Summary Card Component
const RewardsSummaryCard: React.FC<{ rewards: OGUserRewards }> = ({ rewards }) => {
  const accruedUsdc = parseFloat(rewards.accrued_usdc);
  const claimedUsdc = parseFloat(rewards.claimed_usdc);
  const unclaimedUsdc = parseFloat(rewards.unclaimed_usdc);

  return (
    <div className="p-6 space-y-6">
      {/* Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Accrued */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-gray-400 text-sm font-medium">Total Accrued</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">
            {formatCurrency(accruedUsdc)}
          </p>
          <p className="text-gray-500 text-xs mt-1">USDC rewards earned</p>
        </div>

        {/* Claimed */}
        <div className="p-5 rounded-xl bg-[#303136]/30 border border-[#303136]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#303136]/50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-gray-400 text-sm font-medium">Claimed</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(claimedUsdc)}
          </p>
          <p className="text-gray-500 text-xs mt-1">Already distributed</p>
        </div>

        {/* Unclaimed */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-gray-400 text-sm font-medium">Unclaimed</span>
          </div>
          <p className="text-3xl font-bold text-cyan-400">
            {formatCurrency(unclaimedUsdc)}
          </p>
          <p className="text-gray-500 text-xs mt-1">Pending distribution</p>
        </div>
      </div>

      {/* Rewards Info */}
      <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="text-gray-300 text-sm font-medium mb-1">
              Last Accrual: {rewards.last_accrual_time
                ? new Date(rewards.last_accrual_time).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
            <p className="text-gray-500 text-xs">
              Rewards accrue daily and are distributed bi-weekly every Thursday in USDC.
            </p>
          </div>
        </div>
      </div>

      {/* Current AI7 Balance for Rewards */}
      <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">AI7 Balance Earning Rewards</p>
            <p className="text-xl font-bold text-white">
              {formatBalance(rewards.current_ai7_balance)} AI7
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Current APY</p>
            <p className="text-xl font-bold text-emerald-400">{CURRENT_APY}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Portfolio Section Component
export default function PortfolioSection() {
  const { address, isConnected } = useAccount();
  const { positions, isLoading: isLoadingPortfolio } = usePortfolio();
  const { data: ogStats, isLoading: isLoadingStats } = useOGUserStats(address);
  const [activeTab, setActiveTab] = useState<TabType>("portfolio");

  const tabs: { id: TabType; label: string }[] = [
    { id: "portfolio", label: "Portfolio" },
    { id: "rewards", label: "Rewards History" },
    { id: "history", label: "History" },
  ];

  const isLoading = isLoadingPortfolio || isLoadingStats;

  // Get AI7 position from portfolio hook (for current market price)
  const ai7Position = positions.find((p) => p.symbol === "AI7");
  const currentMarketPrice = ai7Position?.usdPrice || 0;

  // Prepare portfolio data from OG stats
  const hasOGData = ogStats && parseFloat(ogStats.net_ai7_amount) > 0;
  const ai7Balance = ogStats ? parseFloat(ogStats.net_ai7_amount) : (ai7Position ? parseFloat(ai7Position.balance) : 0);
  const isBelowMinimum = ai7Balance < MIN_AI7_FOR_REWARDS;

  // Get accrued rewards from API
  const accruedRewards = ogStats?.rewards ? parseFloat(ogStats.rewards.accrued_usdc) : 0;

  const renderContent = () => {
    // Show loader when loading
    if (isConnected && isLoading) {
      return (
        <div className="p-12 flex items-center justify-center">
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
    if (!isConnected || (!hasOGData && positions.length === 0)) {
      return (
        <div className="p-12 text-center">
          <p className="text-gray-400 text-lg">No Investments</p>
        </div>
      );
    }

    // Portfolio Tab Content
    if (activeTab === "portfolio") {
      return (
        <div>
          {/* Low Balance Nudge */}
          {isConnected && isBelowMinimum && (
            <LowBalanceNudge currentBalance={ai7Balance} />
          )}

          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-[#303136]">
              <tr>
                <TableHeader label="Asset" />
                <TableHeader label="Size" />
                <TableHeader label="Amount Invested" />
                <TableHeader label="Entry/Market Price" />
                <TableHeader label="Unrealised PnL" hasInfo />
                <TableHeader label="Rewards" />
                <TableHeader label="Net Gain" hasInfo />
              </tr>
            </thead>
            <tbody>
              {/* Show OG Stats data if available */}
              {hasOGData && (
                <PortfolioRow
                  tokenName="AI7 Index"
                  tokenLogo="/icons/ai7-logo.svg"
                  size={parseFloat(ogStats.net_ai7_amount)}
                  amountInvested={parseFloat(ogStats.total_usdc_spent)}
                  entryPrice={parseFloat(ogStats.avg_buy_price)}
                  marketPrice={currentMarketPrice}
                  accruedRewards={accruedRewards}
                />
              )}

              {/* Fallback to portfolio positions if no OG data */}
              {!hasOGData && positions.map((position) => (
                <PortfolioRow
                  key={position.symbol}
                  tokenName={position.name}
                  tokenLogo={position.logo}
                  size={parseFloat(position.balance)}
                  amountInvested={position.usdValue * 0.8}
                  entryPrice={position.usdPrice * 0.93}
                  marketPrice={position.usdPrice}
                  accruedRewards={0}
                />
              ))}
            </tbody>
          </table>

          {/* Share Button */}
          <div className="p-4 border-t border-[#303136]/50">
            <button
              onClick={handleShareOnX}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#4A4A4A] hover:bg-[#5A5A5A] text-white font-medium rounded-lg transition-all duration-200"
            >
              Share on
              <Image
                src="/icons/x/logo-white.png"
                alt="X"
                width={14}
                height={14}
              />
            </button>
          </div>
          </div>
        </div>
      );
    }

    // Rewards History Tab Content
    if (activeTab === "rewards") {
      // If balance is below minimum, only show the nudge
      if (isBelowMinimum) {
        return (
          <div className="py-6">
            <LowBalanceNudge currentBalance={ai7Balance} />
          </div>
        );
      }

      // Show rewards summary if user has data and meets minimum
      if (hasOGData && ogStats.rewards) {
        return <RewardsSummaryCard rewards={ogStats.rewards} />;
      }

      return (
        <div className="p-12 text-center">
          <p className="text-gray-400">No rewards history yet</p>
        </div>
      );
    }

    // History Tab Content
    if (activeTab === "history") {
      // Show transaction history from OG stats
      if (hasOGData) {
        return (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#303136]/30 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Buy Transactions</p>
                <p className="text-2xl font-bold text-white">{ogStats.total_buy_transactions}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#303136]/30 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Sell Transactions</p>
                <p className="text-2xl font-bold text-white">{ogStats.total_sell_transactions}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#303136]/30 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Total Bought</p>
                <p className="text-xl font-bold text-emerald-400">{formatBalance(ogStats.total_bought)} AI7</p>
              </div>
              <div className="p-4 rounded-xl bg-[#303136]/30 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Total Sold</p>
                <p className="text-xl font-bold text-white">{formatBalance(ogStats.total_sold)} AI7</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#303136]/30 border border-[#303136]">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">First Transaction</p>
                  <p className="text-white font-medium">
                    {new Date(ogStats.first_transaction_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Last Transaction</p>
                  <p className="text-white font-medium">
                    {new Date(ogStats.last_transaction_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="p-12 text-center">
          <p className="text-gray-400">No transaction history yet</p>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="mt-8">
      <div className="bg-[#1A1B1F] border border-[#303136] rounded-2xl overflow-hidden shadow-xl">
        {/* Tab Navigation */}
        <div className="flex border-b border-[#303136]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[#4A4A4A] text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#303136]/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </section>
  );
}
