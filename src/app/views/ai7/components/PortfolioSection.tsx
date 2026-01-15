"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Info, Gift, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  useOGUserStats,
  useRewardsDetails,
  RewardsDetails,
} from "@/hooks/useOGUserStats";

// Minimum AI7 balance required for rewards
const MIN_AI7_FOR_REWARDS = 1;

// Tab types
type TabType = "portfolio" | "rewards" | "history";

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
      {hasInfo && <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />}
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
  cumulativeRewards: number;
}

// Portfolio Table Row Component (Desktop)
const PortfolioRow: React.FC<PortfolioRowProps> = ({
  tokenName,
  tokenLogo,
  size,
  amountInvested,
  entryPrice,
  marketPrice,
  cumulativeRewards,
}) => {
  const currentValue = size * marketPrice;
  const unrealizedPnL = currentValue - amountInvested;
  const unrealizedPnLPercent =
    amountInvested > 0 ? (unrealizedPnL / amountInvested) * 100 : 0;
  const rewardsPercent =
    amountInvested > 0 ? (cumulativeRewards / amountInvested) * 100 : 0;
  const netGain = unrealizedPnL + cumulativeRewards;
  const netGainPercent = unrealizedPnLPercent + rewardsPercent;

  return (
    <tr className="border-b border-[#303136]/50 last:border-b-0">
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
      <td className="py-5 px-4">
        <span className="text-gray-300 font-mono">{formatBalance(size)}</span>
      </td>
      <td className="py-5 px-4">
        <span className="text-gray-300">{formatCurrency(amountInvested)}</span>
      </td>
      <td className="py-5 px-4">
        <span className="text-gray-300 font-mono">
          {entryPrice.toFixed(2)}/{marketPrice.toFixed(2)}
        </span>
      </td>
      <td className="py-5 px-4">
        <span
          className={`font-semibold ${
            unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {unrealizedPnL >= 0 ? "" : "-"}
          {formatCurrency(Math.abs(unrealizedPnL))} (
          {unrealizedPnLPercent >= 0 ? "" : "-"}
          {Math.abs(unrealizedPnLPercent).toFixed(2)}%)
        </span>
      </td>
      <td className="py-5 px-4">
        <span
          className={`font-semibold ${
            cumulativeRewards >= 0 ? "text-emerald-400" : "text-gray-300"
          }`}
        >
          {formatCurrency(cumulativeRewards)} ({rewardsPercent.toFixed(2)}%)
        </span>
      </td>
      <td className="py-5 px-4">
        <span
          className={`font-semibold ${
            netGain >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {netGain >= 0 ? "" : "-"}
          {formatCurrency(Math.abs(netGain))} ({netGainPercent >= 0 ? "" : "-"}
          {Math.abs(netGainPercent).toFixed(2)}%)
        </span>
      </td>
    </tr>
  );
};

// Portfolio Card Component (Mobile)
const PortfolioCard: React.FC<PortfolioRowProps> = ({
  tokenName,
  tokenLogo,
  size,
  amountInvested,
  entryPrice,
  marketPrice,
  cumulativeRewards,
}) => {
  const isEligibleForAPY = size >= MIN_AI7_FOR_REWARDS;
  const currentValue = size * marketPrice;
  const unrealizedPnL = currentValue - amountInvested;
  const unrealizedPnLPercent =
    amountInvested > 0 ? (unrealizedPnL / amountInvested) * 100 : 0;
  const rewardsPercent =
    amountInvested > 0 ? (cumulativeRewards / amountInvested) * 100 : 0;
  const netGain = unrealizedPnL + cumulativeRewards;
  const netGainPercent = unrealizedPnLPercent + rewardsPercent;

  return (
    <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
      {/* Header: Asset Info */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#303136]/50">
        <div className="w-10 h-10 rounded-full bg-[#303136]/50 border border-[#303136] flex items-center justify-center overflow-hidden">
          <Image
            src={tokenLogo}
            alt={tokenName}
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
        <div>
          <span className="text-white font-semibold">{tokenName}</span>
          <p className="text-gray-400 text-sm font-mono">
            {formatBalance(size)} tokens
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Amount Invested */}
        <div>
          <p className="text-gray-500 text-xs mb-1">Amount Invested</p>
          <p className="text-gray-300 font-medium">
            {formatCurrency(amountInvested)}
          </p>
        </div>

        {/* Entry/Market Price */}
        <div>
          <p className="text-gray-500 text-xs mb-1">Entry/Market</p>
          <p className="text-gray-300 font-mono text-sm">
            ${entryPrice.toFixed(2)} / ${marketPrice.toFixed(2)}
          </p>
        </div>

        {/* Unrealized PnL */}
        <div>
          <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
            Unrealised PnL
            <Info className="w-3 h-3 text-gray-600" />
          </p>
          <p
            className={`font-semibold ${
              unrealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {unrealizedPnL >= 0 ? "+" : ""}
            {formatCurrency(unrealizedPnL)}
            <span className="text-xs ml-1">
              ({unrealizedPnLPercent >= 0 ? "+" : ""}
              {unrealizedPnLPercent.toFixed(1)}%)
            </span>
          </p>
        </div>

        {/* Rewards */}
        <div>
          <p className="text-gray-500 text-xs mb-1">Rewards</p>
          {isEligibleForAPY ? (
            <p
              className={`font-semibold ${
                cumulativeRewards >= 0 ? "text-emerald-400" : "text-gray-300"
              }`}
            >
              {formatCurrency(cumulativeRewards)}
              <span className="text-xs ml-1">
                ({rewardsPercent.toFixed(2)}%)
              </span>
            </p>
          ) : (
            <p className="text-gray-500">--</p>
          )}
        </div>

        {/* Net Gain */}
        <div>
          <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
            Net Gain
            <Info className="w-3 h-3 text-gray-600" />
          </p>
          <p
            className={`font-semibold ${
              netGain >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {netGain >= 0 ? "+" : ""}
            {formatCurrency(netGain)}
            <span className="text-sm ml-1">
              ({netGainPercent >= 0 ? "+" : ""}
              {netGainPercent.toFixed(1)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Empty Rewards State Component
const EmptyRewardsState: React.FC = () => (
  <div className="p-12 text-center">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#303136]/30 flex items-center justify-center">
      <Gift className="w-8 h-8 text-gray-500" />
    </div>
    <p className="text-gray-400 text-lg mb-2">No Rewards Yet</p>
    <p className="text-gray-500 text-sm">
      Rewards will be airdropped once every 2 weeks.
    </p>
  </div>
);

// Truncate transaction hash for display
const truncateTxHash = (hash: string): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

// Rewards Summary Card Component
const RewardsSummaryCard: React.FC<{ rewardsDetails: RewardsDetails }> = ({
  rewardsDetails,
}) => {
  const airdrops = rewardsDetails.airdrop_history;

  if (airdrops.length === 0) {
    return <EmptyRewardsState />;
  }

  return (
    <div className="flex flex-col">
      {/* Desktop View: Matching Portfolio Table Style */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#303136]">
            <tr>
              <TableHeader label="Date" />
              <TableHeader label="Amount" />
              <TableHeader label="Status" />
              <TableHeader label="Transaction" />
            </tr>
          </thead>
          <tbody>
            {airdrops.map((item, index) => (
              <tr
                key={`${item.tx_hash}-${index}`}
                className="border-b border-[#303136]/50 last:border-b-0"
              >
                <td className="py-5 px-4">
                  <span className="text-gray-300">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </td>
                <td className="py-5 px-4">
                  <span className="text-emerald-400 font-semibold">
                    ${item.usdc_amount.toFixed(2)}
                  </span>
                </td>
                <td className="py-5 px-4">
                  <div className="flex items-center gap-2">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    )}
                    <span
                      className={
                        item.status === "completed"
                          ? "text-emerald-400"
                          : "text-amber-400 font-medium"
                      }
                    >
                      {item.status === "completed" ? "Completed" : "Pending"}
                    </span>
                  </div>
                </td>
                <td className="py-5 px-4">
                  <a
                    href={`https://basescan.org/tx/${item.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors font-mono text-sm"
                  >
                    {truncateTxHash(item.tx_hash)}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Matching Portfolio Card Style */}
      <div className="lg:hidden p-4 space-y-4">
        {airdrops.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Date</p>
                <p className="text-gray-300 text-sm font-medium">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs mb-1">Amount</p>
                <p className="text-emerald-400 font-bold">
                  ${item.usdc_amount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#303136]/50">
              <div className="flex items-center gap-1.5">
                {item.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                )}
                <span
                  className={`text-sm ${
                    item.status === "completed"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {item.status === "completed" ? "Completed" : "Pending"}
                </span>
              </div>
              <a
                href={`https://basescan.org/tx/${item.tx_hash}`}
                target="_blank"
                className="flex items-center gap-1 text-blue-400 font-mono text-xs"
              >
                {truncateTxHash(item.tx_hash)}{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
      {/* Info Footer */}
      <div className="mx-4 mt-2 py-6 border-t border-[#303136]/50 text-center">
        <p className="text-gray-500 text-sm">
          Rewards accrue daily and are distributed bi-weekly every Thursday in
          USDC.
        </p>
      </div>
    </div>
  );
};

// Main Portfolio Section Component
export default function PortfolioSection() {
  const { address, isConnected } = useAccount();
  const { positions, isLoading: isLoadingPortfolio } = usePortfolio();
  const { data: ogStats, isLoading: isLoadingStats } = useOGUserStats(address);
  const { data: rewardsDetails, isLoading: isLoadingRewards } =
    useRewardsDetails(address);
  const [activeTab, setActiveTab] = useState<TabType>("portfolio");

  const tabs: { id: TabType; label: string }[] = [
    { id: "portfolio", label: "Portfolio" },
    { id: "rewards", label: "Rewards" },
    { id: "history", label: "History" },
  ];

  const isLoading = isLoadingPortfolio || isLoadingStats || isLoadingRewards;

  // Get AI7 position from portfolio hook (for current market price)
  const ai7Position = positions.find((p) => p.symbol === "AI7");
  const currentMarketPrice = ai7Position?.usdPrice || 0;

  // Prepare portfolio data from OG stats
  const hasOGData = ogStats && parseFloat(ogStats.net_ai7_amount) > 0;

  // Get cumulative (total) rewards from rewards details API
  const cumulativeRewards = rewardsDetails
    ? parseFloat(rewardsDetails.claimed_usdc)
    : 0;

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

    // Show connect wallet when not connected
    if (!isConnected) {
      return (
        <div className="p-12 text-center space-y-6">
          <div>
            <p className="text-gray-400 text-sm">
              Connect your wallet to view your portfolio.
            </p>
          </div>
        </div>
      );
    }

    // Show empty state when connected but no positions
    if (!hasOGData && positions.length === 0) {
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
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#303136]">
                <tr>
                  <TableHeader label="Asset" />
                  <TableHeader label="Size" />
                  <TableHeader label="Amount Invested" />
                  <TableHeader label="Entry/Market Price" />
                  <TableHeader label="Unrealised PnL" />
                  <TableHeader label="Rewards" />
                  <TableHeader label="Net Gain" />
                </tr>
              </thead>
              <tbody>
                {hasOGData && (
                  <PortfolioRow
                    tokenName="AI7 Index"
                    tokenLogo="/icons/ai7-logo.svg"
                    size={parseFloat(ogStats.net_ai7_amount)}
                    amountInvested={
                      parseFloat(ogStats.total_usdc_spent) -
                      parseFloat(ogStats.total_usdc_received)
                    }
                    entryPrice={parseFloat(ogStats.avg_buy_price)}
                    marketPrice={currentMarketPrice}
                    cumulativeRewards={cumulativeRewards}
                  />
                )}
                {!hasOGData &&
                  positions.map((position) => (
                    <PortfolioRow
                      key={position.symbol}
                      tokenName={position.name}
                      tokenLogo={position.logo}
                      size={parseFloat(position.balance)}
                      amountInvested={position.usdValue * 0.8}
                      entryPrice={position.usdPrice * 0.93}
                      marketPrice={position.usdPrice}
                      cumulativeRewards={0}
                    />
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden p-4 space-y-4">
            {hasOGData && (
              <PortfolioCard
                tokenName="AI7 Index"
                tokenLogo="/icons/ai7-logo.svg"
                size={parseFloat(ogStats.net_ai7_amount)}
                amountInvested={parseFloat(ogStats.total_usdc_spent)}
                entryPrice={parseFloat(ogStats.avg_buy_price)}
                marketPrice={currentMarketPrice}
                cumulativeRewards={cumulativeRewards}
              />
            )}
            {!hasOGData &&
              positions.map((position) => (
                <PortfolioCard
                  key={position.symbol}
                  tokenName={position.name}
                  tokenLogo={position.logo}
                  size={parseFloat(position.balance)}
                  amountInvested={position.usdValue * 0.8}
                  entryPrice={position.usdPrice * 0.93}
                  marketPrice={position.usdPrice}
                  cumulativeRewards={0}
                />
              ))}
          </div>

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
      );
    }

    // Rewards Tab Content
    if (activeTab === "rewards") {
      // Check if user has rewards data
      if (!rewardsDetails) {
        return <EmptyRewardsState />;
      }

      return <RewardsSummaryCard rewardsDetails={rewardsDetails} />;
    }

    // History Tab Content
    if (activeTab === "history") {
      if (ogStats) {
        return (
          <div className="p-6 space-y-4">
            {/* Transaction Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Total Bought</p>
                <p className="text-white font-semibold">
                  {formatBalance(ogStats.total_bought)} AI7
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Total Sold</p>
                <p className="text-white font-semibold">
                  {formatBalance(ogStats.total_sold)} AI7
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Buy Transactions</p>
                <p className="text-white font-semibold">
                  {ogStats.total_buy_transactions}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Sell Transactions</p>
                <p className="text-white font-semibold">
                  {ogStats.total_sell_transactions}
                </p>
              </div>
            </div>

            {/* Average Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Average Buy Price</p>
                <p className="text-white font-semibold">
                  ${parseFloat(ogStats.avg_buy_price).toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
                <p className="text-gray-400 text-sm mb-1">Average Sell Price</p>
                <p className="text-white font-semibold">
                  ${parseFloat(ogStats.avg_sell_price).toFixed(2)}
                </p>
              </div>
            </div>

            {/* First/Last Transaction */}
            <div className="p-4 rounded-xl bg-[#303136]/20 border border-[#303136]">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <p className="text-gray-400 text-sm">First Transaction</p>
                  <p className="text-white font-medium">
                    {new Date(ogStats.first_transaction_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-gray-400 text-sm">Last Transaction</p>
                  <p className="text-white font-medium">
                    {new Date(ogStats.last_transaction_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
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
        <div className="flex border-b border-[#303136] overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
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
