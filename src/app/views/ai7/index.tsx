"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Blocks, Globe, Wallet } from "lucide-react";

// Company data for the Magnificent 7
const MAGNIFICENT_7 = [
  {
    symbol: "AAPL",
    name: "Apple",
    color: "#A2AAAD",
    weight: 14.3,
    logo: "/icons/apple-logo.svg",
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    color: "#00A4EF",
    weight: 14.3,
    logo: "/icons/msft-logo.svg",
  },
  {
    symbol: "GOOGL",
    name: "Google",
    color: "#4285F4",
    weight: 14.3,
    logo: "/icons/goog-logo.svg",
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    color: "#FF9900",
    weight: 14.3,
    logo: "/icons/amzn-logo.svg",
  },
  {
    symbol: "META",
    name: "Meta",
    color: "#0668E1",
    weight: 14.3,
    logo: "/icons/meta-logo.svg",
  },
  {
    symbol: "NVDA",
    name: "Nvidia",
    color: "#76B900",
    weight: 14.3,
    logo: "/icons/nvidia-logo.svg",
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    color: "#E82127",
    weight: 14.2,
    logo: "/icons/tesla-logo.svg",
  },
];

const FREQUENCY_OPTIONS = [
  { weeks: 1, label: "Weekly" },
  { weeks: 2, label: "Bi-weekly" },
  { weeks: 4, label: "Monthly" },
  { weeks: 12, label: "Quarterly" },
  { weeks: 0, label: "One-time Investment" },
];

// Orbital Company Visualization
const OrbitalConstellation = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.15) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Central AI7 Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full blur-xl opacity-60 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/20 flex items-center justify-center">
            <span className="text-2xl font-black bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
              AI7
            </span>
          </div>
        </div>
      </div>

      {/* Orbital rings */}
      <div className="absolute inset-8 border border-white/5 rounded-full" />
      <div className="absolute inset-4 border border-white/10 rounded-full" />
      <div className="absolute inset-0 border border-white/5 rounded-full" />

      {/* Orbiting companies */}
      {MAGNIFICENT_7.map((company, index) => {
        const ORBIT_RADIUS = 130; // px

        const angle = (index * (360 / 7) + rotation) * (Math.PI / 180);
        const offsetX = ORBIT_RADIUS * Math.cos(angle);
        const offsetY = ORBIT_RADIUS * Math.sin(angle);

        const isHovered = hoveredIndex === index;

        return (
          <div
            key={company.symbol}
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `50%`,
              top: `50%`,
              transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`,
              zIndex: isHovered ? 30 : 10,
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative cursor-pointer">
              <div
                className="absolute inset-0 rounded-full blur-md transition-opacity duration-300"
                style={{
                  backgroundColor: company.color,
                  opacity: isHovered ? 0.6 : 0.2,
                }}
              />
              <div
                className="relative flex items-center justify-center text-xs font-bold"
                style={{
                  borderColor: company.color,
                  color: company.color,
                }}
              >
                <Image
                  src={company.logo}
                  alt={company.name}
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              {isHovered && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-14 bg-gray-900/95 border border-white/10 rounded-lg px-3 py-2 whitespace-nowrap z-40">
                  <p className="text-white font-semibold text-sm">
                    {company.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Mini Performance Chart
const MiniChart = () => {
  const points = useMemo(() => {
    const data = [];
    let value = 100;
    for (let i = 0; i < 30; i++) {
      value += (Math.random() - 0.4) * 5;
      data.push(value);
    }
    return data;
  }, []);

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;

  const pathData = points
    .map((point, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - ((point - min) / range) * 100;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaPath = `${pathData} L 100 100 L 0 100 Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-16"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartGradient)" />
      <path
        d={pathData}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2"
      />
    </svg>
  );
};

// Price Display
const PriceDisplay = () => {
  const [price, setPrice] = useState(60);
  const [change] = useState(2.34);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * 2;
      setPrice((prev) => Math.max(60, prev + delta));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-4xl font-black text-white tracking-tight">
        ${price.toFixed(2)}
      </span>
      <span className="flex items-center gap-1 text-lg font-semibold text-emerald-400">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        +{change.toFixed(2)}%
      </span>
    </div>
  );
};

const PoweredByOwnProtocol: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated gradient mesh */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        {/* Grid lines effect */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to top, black, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent 80%)",
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Powered by badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-gray-400">Powered by</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-10">
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Own Protocol
            </span>
          </h2>

          <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
            The permissionless infrastructure for issuing tokens pegged to{" "}
            <span className="text-white font-semibold">stocks</span>,{" "}
            <span className="text-white font-semibold">indices</span> &{" "}
            <span className="text-white font-semibold">ETFs</span> onchain.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { icon: Blocks, label: "Fully Decentralized" },
            { icon: Globe, label: "Global Access" },
            { icon: Wallet, label: "Non Custodial" },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-white/[0.08] to-white/[0.03] border border-white/10 backdrop-blur-sm"
            >
              <item.icon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Link
            href="/protocol/trade"
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 overflow-hidden"
          >
            {/* Button background with animated gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />

            {/* Animated shine effect */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)",
                transform: "translateX(-100%)",
                animation: "shine 1.5s ease-in-out infinite",
              }}
            />

            {/* Button content */}
            <span className="relative z-10 text-white">
              Explore the Protocol
            </span>
            <ArrowRight className="relative z-10 w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-gray-600 text-sm mt-8">
          The future of finance is onchain. Own it.
        </p>
      </div>

      <style jsx global>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  );
};

// Main Component
export default function AI7AutoInvestPage() {
  const [selectedFrequency, setSelectedFrequency] = useState(4);
  const [investmentAmount, setInvestmentAmount] = useState("");

  const presetAmounts = [100, 250, 500, 1000];

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2" />
      </div>

      <div className="relative z-10 px-4 py-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="grid lg:grid-cols-2 gap-8 items-center mt-16 mb-16">
          {/* Content */}
          <div>
            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight text-center lg:text-left">
              Auto-Invest in the
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Magnificent Seven
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-400 mb-8 leading-relaxed text-center lg:text-left">
              AI7 token is pegged to the{" "}
              <span className="text-white font-semibold">MAGS ETF</span> —
              giving you equal exposure to the seven tech titans driving global
              innovation: Apple, Microsoft, Google, Amazon, Meta, Nvidia, and
              Tesla.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-center lg:text-left">
              <div>
                <p className="text-2xl font-bold text-white">$18.1T</p>
                <p className="text-gray-500 text-sm">Combined Market Cap</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">+20.2%</p>
                <p className="text-gray-500 text-sm">YTD Performance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">7</p>
                <p className="text-gray-500 text-sm">AI Companies</p>
              </div>
            </div>

            {/* Price */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">AI7 Price</p>
              <PriceDisplay />
              <div className="mt-3">
                <MiniChart />
              </div>
            </div>
          </div>

          {/* Orbital Visualization */}
          <div className="flex justify-center">
            <OrbitalConstellation />
          </div>
        </section>

        {/* Auto-Invest Config */}
        <section className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Set Up Your Auto-Investment
            </h2>
            <p className="text-gray-400">
              Choose your amount and frequency, then let us handle the rest
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Investment Amount (USDC)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
                  $
                </span>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-10 pr-4 py-4 text-2xl font-semibold rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setInvestmentAmount(amount.toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      investmentAmount === amount.toString()
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Investment Frequency
              </label>
              <div className="grid grid-cols-5 gap-2">
                {FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option.weeks}
                    onClick={() => setSelectedFrequency(option.weeks)}
                    className={`relative p-3 rounded-xl transition-all ${
                      selectedFrequency === option.weeks
                        ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    } border`}
                  >
                    {selectedFrequency === option.weeks && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    {option.weeks !== 0 && (
                      <span
                        className={`block text-lg font-bold ${
                          selectedFrequency === option.weeks
                            ? "text-white"
                            : "text-gray-300"
                        }`}
                      >
                        {option.weeks}w
                      </span>
                    )}
                    <span
                      className={`block text-xs mt-1 ${
                        selectedFrequency === option.weeks
                          ? "text-blue-300"
                          : "text-gray-500"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {investmentAmount && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                {selectedFrequency !== 0 ? (
                  <>
                    <p className="text-blue-300 text-sm">
                      You&apos;ll invest{" "}
                      <span className="text-white font-semibold">
                        ${Number(investmentAmount).toLocaleString()} USDC
                      </span>{" "}
                      every{" "}
                      <span className="text-white font-semibold">
                        {selectedFrequency} week
                        {selectedFrequency > 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className="text-blue-400/70 text-xs mt-1">
                      That&apos;s ~$
                      {(
                        (Number(investmentAmount) * 52) /
                        selectedFrequency
                      ).toLocaleString()}{" "}
                      per year
                    </p>
                  </>
                ) : (
                  <p className="text-blue-300 text-sm">
                    You&apos;ll make a one-time investment of{" "}
                    <span className="text-white font-semibold">
                      ${Number(investmentAmount).toLocaleString()} USDC
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              disabled={true}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              Coming Soon
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </section>
      </div>

      <PoweredByOwnProtocol />
    </div>
  );
}
