"use client";

import React from "react";
import Image from "next/image";
import {
  ExternalLink,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
} from "lucide-react";

const HOLDINGS = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    weight: "14.29%",
    logo: "/icons/apple-logo.svg",
    needsInvert: true,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    weight: "14.29%",
    logo: "/icons/msft-logo.svg",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    weight: "14.29%",
    logo: "/icons/goog-logo.svg",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    weight: "14.29%",
    logo: "/icons/amzn-logo.svg",
    needsInvert: true,
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    weight: "14.29%",
    logo: "/icons/meta-logo.svg",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    weight: "14.29%",
    logo: "/icons/nvidia-logo.svg",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    weight: "14.26%",
    logo: "/icons/tesla-logo.svg",
  },
];

export const ETFInfoTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* ETF Overview */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">
            MAGS ETF Overview
          </h3>
          <a
            href="https://www.roundhillinvestments.com/etf/mags/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View on Roundhill <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          The Roundhill Magnificent Seven ETF (MAGS) provides equal-weight
          exposure to the &quot;Magnificent Seven&quot; - the seven mega-cap
          tech stocks that have dominated market returns.
        </p>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#222325] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Expense Ratio</span>
            </div>
            <span className="text-white font-medium">0.29%</span>
          </div>
          <div className="bg-[#222325] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Inception</span>
            </div>
            <span className="text-white font-medium">Apr 2023</span>
          </div>
          <div className="bg-[#222325] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                3Y Annualized Return
              </span>
            </div>
            <span className="text-emerald-400 font-medium">+45%</span>
          </div>
          <div className="bg-[#222325] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Strategy</span>
            </div>
            <span className="text-white font-medium">Equal Weight</span>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="bg-[#303136]/50 border border-[#303136] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Holdings</h3>
        <div className="space-y-2">
          {HOLDINGS.map((holding) => (
            <div
              key={holding.symbol}
              className="flex items-center justify-between py-2 border-b border-[#303136] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#222325] flex items-center justify-center">
                  <Image
                    src={holding.logo}
                    alt={holding.symbol}
                    width={20}
                    height={20}
                    className={`object-contain ${
                      holding.needsInvert ? "invert brightness-200" : ""
                    }`}
                  />
                </div>
                <div>
                  <span className="text-white font-medium text-sm">
                    {holding.symbol}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {holding.name}
                  </span>
                </div>
              </div>
              <span className="text-gray-300 font-medium">
                {holding.weight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ETFInfoTab;
