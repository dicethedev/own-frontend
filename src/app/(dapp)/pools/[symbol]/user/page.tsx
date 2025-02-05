"use client";

import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import PoolDetails from "@/components/pool/PoolDetails";
import { usePool } from "@/context/PoolContext";
import React from "react";

const PoolPage: React.FC = () => {
  const { pool } = usePool();
  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
      <PoolDetails pool={pool} />
    </div>
  );
};

export default PoolPage;
