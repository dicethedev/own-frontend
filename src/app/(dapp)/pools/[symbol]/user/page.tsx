"use client";

import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import PoolDetails from "@/components/pool/PoolDetails";
import React from "react";

const PoolPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
      <PoolDetails
        poolAddress="0xf6AF07a6d2Fd6551c2eb0f2DA7644F4d5dd0FB65"
        symbol="TSLA"
      />
    </div>
  );
};

export default PoolPage;
