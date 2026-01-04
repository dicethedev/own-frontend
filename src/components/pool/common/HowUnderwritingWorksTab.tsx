"use client";

import React from "react";
import {
  Coins,
  ArrowRightLeft,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Scale,
  Wallet,
} from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    title: "1. Register & Commit",
    description:
      "Register as an LP by committing liquidity (aUSDC) and posting collateral. Your commitment backs user deposits.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Scale,
    title: "2. Stay Delta-Neutral",
    description:
      "During off-chain rebalancing, adjust your real-world holdings to match your protocol exposure and stay hedged.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: ArrowRightLeft,
    title: "3. Rebalance On-Chain",
    description:
      "Submit your rebalance price (within oracle bounds) after market close. Settle gains/losses with the pool.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: CheckCircle2,
    title: "4. Earn Yield",
    description:
      "Collect floating interest from users plus potential market-making profits from rebalancing spreads.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Floating Interest",
    description: "Earn yield from users minting exposure",
  },
  {
    icon: Coins,
    title: "Market Making",
    description: "Additional profit from rebalancing spreads",
  },
];

export const HowUnderwritingWorksTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-5">
        <h3 className="text-white font-semibold text-lg mb-3">
          How Underwriting Works
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          As a Liquidity Provider (LP), you underwrite synthetic asset exposure
          by committing capital to the pool. You earn floating interest from
          users who mint tokens, plus potential profits from market-making
          during rebalancing. LPs can stay delta-neutral by hedging off-chain
          with real assets.
        </p>
        <a
          href="https://own-protocol.gitbook.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Read full documentation <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="bg-[#303136]/30 border border-[#303136] rounded-xl p-4 flex items-start gap-4"
          >
            <div
              className={`w-10 h-10 rounded-lg ${step.bgColor} flex items-center justify-center flex-shrink-0`}
            >
              <step.icon className={`w-5 h-5 ${step.color}`} />
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">{step.title}</h4>
              <p className="text-gray-400 text-sm">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <benefit.icon className="w-5 h-5 text-purple-400" />
              <h4 className="text-white font-medium">{benefit.title}</h4>
            </div>
            <p className="text-gray-400 text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* Risk Note */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-yellow-400/90 text-sm">
          <strong>Important:</strong> LPs must actively rebalance during each
          cycle. Failure to rebalance or maintain sufficient collateral may
          result in liquidation. Automated rebalancing via delegates is
          available.
        </p>
      </div>
    </div>
  );
};

export default HowUnderwritingWorksTab;
