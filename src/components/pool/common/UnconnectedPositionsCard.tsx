"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { PieChart } from "lucide-react";

export const UnconnectedPositionsCard: React.FC = () => {
  return (
    <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white">
          Your Position
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#303136]/50 border border-[#303136] flex items-center justify-center mb-4">
            <PieChart className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-400">
            Connect your wallet to view your position
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
