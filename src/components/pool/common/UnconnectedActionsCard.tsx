"use client";

import React from "react";
import { Card } from "@/components/ui/BaseComponents";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

export const UnconnectedActionsCard: React.FC = () => {
  return (
    <Card
      className="bg-[#222325] border border-[#303136] rounded-2xl p-6 shadow-xl"
      data-testid="unconnected-actions-card"
    >
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#303136]/50 border border-[#303136] flex items-center justify-center">
          <Wallet className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">
            Connect Wallet
          </h3>
          <p className="text-gray-400 text-sm">
            Connect your wallet to access pool actions.
          </p>
        </div>
        <div className="flex justify-center">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    </Card>
  );
};
