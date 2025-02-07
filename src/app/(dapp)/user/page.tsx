"use client";

import React from "react";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import { PoolContainer } from "@/components/pool/PoolContainer";
import { pools } from "@/config/pool";

const UserApp: React.FC = () => {
  const [userType] = React.useState<"user" | "lp">("user");

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
      <PoolContainer pools={pools} type={userType} />
    </div>
  );
};

export default UserApp;
