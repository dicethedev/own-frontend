"use client";

import React from "react";
import Image from "next/image";
import { Shield, Globe, Lock, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Over Collateralized",
    description:
      "Every AI7 token will always remain backed by more than 115% in USDC reserves.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Globe,
    title: "Global Access",
    description:
      "Access US equities from anywhere in the world without traditional brokerage barriers.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Lock,
    title: "Self-Custody",
    description:
      "Your tokens, your keys. Maintain full control of your assets at all times.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

export const ProtocolTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Protocol Overview */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#222325] flex items-center justify-center">
            <Image
              src="/own_white_mini.svg"
              alt="Own Protocol"
              width={24}
              height={24}
            />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Own Protocol</h3>
            <p className="text-gray-400 text-sm">Tokenized Real-World Assets</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed">
          Own is a permissionless protocol for issuing tokens pegged to stocks,
          indices & ETFs onchain. AI7 is powered by Own Protocol, bringing the
          Magnificent Seven to DeFi with full transparency and composability.
          What Hyperliquid is for perps, Own Protocol is for tokenization.
        </p>

        <a
          href="https://own-protocol.gitbook.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Read the docs <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="bg-[#303136]/50 border border-[#303136] rounded-xl p-4"
          >
            <div
              className={`w-10 h-10 rounded-lg ${feature.bgColor} flex items-center justify-center mb-3`}
            >
              <feature.icon className={`w-5 h-5 ${feature.color}`} />
            </div>
            <h4 className="text-white font-medium mb-2">{feature.title}</h4>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProtocolTab;
