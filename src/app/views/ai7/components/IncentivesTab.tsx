"use client";

import React from "react";
import { Sparkles, ShieldCheck, Coins, Landmark, Zap } from "lucide-react";

export const IncentivesTab: React.FC = () => {
  const tiers = [
    {
      label: "Early Adopter Tier",
      tvl: "Up to $100k TVL",
      apy: "24%",
      active: true,
    },
    { label: "Growth Tier", tvl: "Up to $1M TVL", apy: "12%", active: false },
    {
      label: "Sustainable Tier",
      tvl: "Up to $100M TVL",
      apy: "9%",
      active: false,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. APY Highlights Card */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xl tracking-tight">
              Own Yield Boost
            </h3>
            <p className="text-emerald-400/80 text-sm font-medium">
              Currently distributing 24% APY
            </p>
          </div>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          The Own Incentives Program rewards long-term holders. Secure a fixed
          yield on top of the underlying ETF performance. Rewards are
          distributed bi-weekly to eligible wallets.
        </p>
      </div>

      {/* 2. Acquisition Channels (Uniswap vs Mint) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#303136]/30 border border-[#303136] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h4 className="text-white text-sm font-semibold">
              Primary Minting
            </h4>
          </div>
          <p className="text-gray-400 text-xs leading-normal">
            Mint AI7 directly via the protocol using{" "}
            <span className="text-white">aUSDC</span>. Best for large entries or
            when liquidity is thin.
          </p>
        </div>
        <div className="bg-[#303136]/30 border border-[#303136] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Landmark className="w-4 h-4 text-cyan-400" />
            <h4 className="text-white text-sm font-semibold">
              Secondary Market
            </h4>
          </div>
          <p className="text-gray-400 text-xs leading-normal">
            Purchase AI7 directly from{" "}
            <span className="text-white">Uniswap</span> if there is sufficient
            liquidity for your trade size.
          </p>
        </div>
        <div className="bg-[#303136]/30 border border-[#303136] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h4 className="text-white text-sm font-semibold">
              1-Year Rate Protection
            </h4>
          </div>
          <p className="text-gray-400 text-xs leading-normal">
            Lock in your entry tier APY for a minimum of 12 months, regardless
            of TVL growth.
          </p>
        </div>
        <div className="bg-[#303136]/30 border border-[#303136] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="w-4 h-4 text-cyan-400" />
            <h4 className="text-white text-sm font-semibold">
              Multi-Asset Rewards
            </h4>
          </div>
          <p className="text-gray-400 text-xs leading-normal">
            Distributed in USDC initially, transitioning to Protocol Tokens
            post-launch.
          </p>
        </div>
      </div>

      {/* 4. Tier Roadmap */}
      <div className="bg-[#303136]/20 border border-[#303136] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#303136] flex justify-between items-center">
          <h4 className="text-white font-semibold text-sm">
            Reward Milestones
          </h4>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Incentive Schedule
          </span>
        </div>
        <div className="divide-y divide-[#303136]">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-5 transition-colors ${
                tier.active ? "bg-emerald-500/5" : "opacity-60"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      tier.active ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {tier.label}
                  </span>
                  {tier.active && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-tight">
                        Active
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-xs font-medium">{tier.tvl}</p>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-black ${
                    tier.active ? "text-emerald-400" : "text-gray-600"
                  }`}
                >
                  {tier.apy}
                  <span className="text-[10px] font-medium ml-1 text-gray-500">
                    APY
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Footer Requirements */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <p className="text-gray-500 text-[11px] leading-relaxed text-center italic">
          * To qualify, users must hold at least 1 AI7 token. Rewards are
          calculated based on daily snapshots and distributed bi-weekly. Your
          APY tier is determined by the Protocol TVL at the moment of your first
          holding.
        </p>
      </div>
    </div>
  );
};

export default IncentivesTab;
