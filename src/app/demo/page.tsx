"use client";

import React from "react";
import {
  PoolCard,
  //   DepositForm,
  //   RedemptionForm,
  //   LPRegistrationForm,
} from "../../components/PoolComponents";

const dummyPools = [
  {
    assetSymbol: "TSLA-USDC",
    depositToken: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    cycleLength: 86400, // 24 hours in seconds
    cycleState: "Active",
    xTokenSupply: "1,234,567.89",
  },
  {
    assetSymbol: "COIN-USDC",
    depositToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    cycleLength: 43200, // 12 hours in seconds
    cycleState: "Pending",
    xTokenSupply: "987,654.32",
  },
  {
    assetSymbol: "AAPL-USDC",
    depositToken: "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359",
    cycleLength: 21600, // 6 hours in seconds
    cycleState: "Completed",
    xTokenSupply: "456,789.01",
  },
];

const DemoPage = () => {
  //   const handleDeposit = (amount: string) => {
  //     console.log("Deposit:", amount);
  //   };

  //   const handleRedeem = (amount: string) => {
  //     console.log("Redeem:", amount);
  //   };

  //   const handleRegister = (amount: string) => {
  //     console.log("Register LP:", amount);
  //   };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Available Pools
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyPools.map((pool, index) => (
            <div key={index} className="space-y-6">
              <PoolCard pool={pool} />
              {/* <DepositForm onDeposit={handleDeposit} />
              <RedemptionForm onRedeem={handleRedeem} />
              <LPRegistrationForm onRegister={handleRegister} /> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
