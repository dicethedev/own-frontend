"use client";

import React from "react";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";

const CreatePool: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
    </div>
  );
};

export default CreatePool;
