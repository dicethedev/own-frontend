"use client";

import React from "react";
import {
  Coins,
  ArrowRightLeft,
  Clock,
  Shield,
  Wallet,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    title: "1. Connect & Deposit",
    description:
      "Connect your wallet and deposit aUSDC (yield-bearing USDC from Aave) as collateral to mint synthetic assets.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Clock,
    title: "2. Submit Request",
    description:
      "Your deposit request is queued and processed during the next rebalancing cycle when the market is open.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: ArrowRightLeft,
    title: "3. Rebalancing",
    description:
      "LPs rebalance their positions off-chain to hedge exposure. The protocol settles at the official open price.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: CheckCircle2,
    title: "4. Claim Tokens",
    description:
      "Once processed, claim your minted tokens. They're standard ERC-20s that can be traded freely on DEXs like Uniswap.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

const BENEFITS = [
  {
    icon: Shield,
    title: "Over-Collateralized",
    description: "All tokens backed by 115%+ in reserves",
  },
  {
    icon: Coins,
    title: "Low Net Cost",
    description: "~2% annual cost after yield offset",
  },
];

export const HowMintingWorksTab: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-5">
        <h3 className="text-white font-semibold text-lg mb-3">
          How Minting Works
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Minting allows you to gain exposure to real-world assets like ETFs and
          stocks. You deposit collateral (aUSDC) and receive tokens that track
          the asset&apos;s price. The protocol uses a Total Return Swap
          mechanism where your requests are processed during rebalancing cycles
          aligned with market hours.
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
            className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <benefit.icon className="w-5 h-5 text-emerald-400" />
              <h4 className="text-white font-medium">{benefit.title}</h4>
            </div>
            <p className="text-gray-400 text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* Important Note */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-yellow-400/90 text-sm">
          <strong>Note:</strong> Deposits and redemptions are processed during
          rebalancing cycles. Requests submitted during active periods will be
          queued for the next cycle. This ensures LPs can properly hedge their
          positions.
        </p>
      </div>
    </div>
  );
};

export default HowMintingWorksTab;
