import React from "react";
import { Card } from "@/components/ui/BaseComponents";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const UnconnectedActionsCard: React.FC = () => {
  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg p-6">
      <div className="text-center space-y-4">
        <p className="text-gray-400">
          Connect your wallet to deposit or redeem from this pool
        </p>
        <div className="flex justify-center">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="w-1/2 flex items-center justify-center gap-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    </Card>
  );
};
