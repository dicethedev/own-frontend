"use client";

import React from "react";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import CreatePoolForm from "@/components/pool/lp/CreatePoolForm";

const CreatePool: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <CreatePoolForm />
      </div>
    </div>
  );
};

export default CreatePool;
