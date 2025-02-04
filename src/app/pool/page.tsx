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
      <PoolDetails />
    </div>
  );
};

export default PoolPage;
