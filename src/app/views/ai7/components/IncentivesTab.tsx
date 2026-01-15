"use client";

import React from "react";
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";

export const IncentivesTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* 1. Main Incentive Card - Minimalist */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Incentives Program
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Early Adopter Phase</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-emerald-400">24%</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1">
              Fixed APY
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <ListItem text="Anyone who invests before $100k TVL gets 24% APY for 1 year" />
          <ListItem text="12% APY after $100k TVL" />
          <ListItem text="Hold atleast 1 AI7 to qualify" />
          <ListItem text="Rewards paid bi-weekly in USDC (later in protocol token)" />
        </div>

        <div className="mt-6 pt-5 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          PROGRAM ACTIVE • JAN 1, 2026
        </div>
      </div>

      {/* 2. Simplified Buying Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Option A: Protocol Mint (For Size) */}
        <Link
          href="/mint/ai7"
          className="group flex flex-col items-start text-left p-4 rounded-xl bg-[#303136]/50 border border-[#303136] transition-all"
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">
              Mint via Protocol
            </span>
            <span className="ml-auto text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              Large Size
            </span>
          </div>
          <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
            Zero slippage. Best for large entries using aUSDC.
          </p>
        </Link>

        {/* Option B: Uniswap (External Link) */}
        <a
          href="https://app.uniswap.org/explore/pools/base/0x6efd64f46691157C387A298E8d54c89fc6BB9E23"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-start text-left p-4 rounded-xl bg-[#303136]/50 border border-[#303136] transition-all"
        >
          <div className="flex items-center gap-2 mb-2 w-full">
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            <span className="text-sm font-medium text-white">
              Buy on Uniswap
            </span>
          </div>
          <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
            Standard market buy. Best for smaller trades.
          </p>
        </a>
      </div>
    </div>
  );
};

// Helper for clean list items
const ListItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
    <span className="text-sm text-zinc-300 leading-snug">{text}</span>
  </div>
);

export default IncentivesTab;
