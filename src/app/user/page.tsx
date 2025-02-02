"use client";

import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import { PoolContainer } from "@/components/pool/PoolContainer";
import { Pool } from "@/components/types/pool";
import React from "react";

const pools: Pool[] = [
  {
    name: "Tesla, Inc.",
    symbol: "TSLA",
    price: 650.75,
    priceChange: 2.5,
    depositToken: "USDC",
    volume24h: "$1.2B",
    // logoUrl: "/logos/tesla.png",
  },
  {
    name: "Apple Inc.",
    symbol: "AAPL",
    price: 145.3,
    priceChange: -0.8,
    depositToken: "USDT",
    volume24h: "$980M",
  },
  {
    name: "Amazon.com, Inc.",
    symbol: "AMZN",
    price: 3380.05,
    priceChange: 1.2,
    depositToken: "DAI",
    volume24h: "$1.5B",
  },
];

const OwnApp: React.FC = () => {
  const [userType] = React.useState<"user" | "liquidity">("user");

  return (
    <div className="min-h-screen text-black relative">
      <BackgroundEffects />
      <Navbar />
      <PoolContainer pools={pools} type={userType} />
    </div>
  );
};

export default OwnApp;
