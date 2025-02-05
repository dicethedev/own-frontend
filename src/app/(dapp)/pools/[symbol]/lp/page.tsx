"use client";

import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";

const LPPoolPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
      <div className="container mx-auto px-4">Not active</div>
    </div>
  );
};

export default LPPoolPage;
