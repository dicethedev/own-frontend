import React from "react";
import { Button, Card } from "@/components/ui/BaseComponents";
import { Wallet } from "lucide-react";
import { useConnect } from "wagmi";

export const UnconnectedActionsCard: React.FC = () => {
  const { connect, connectors } = useConnect();
  const metamask = connectors[0];

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg p-6">
      <div className="text-center space-y-4">
        <p className="text-gray-400">
          Connect your wallet to manage the liquidity of this pool
        </p>
        <Button
          key={metamask.id}
          onClick={() => connect({ connector: metamask })}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect
        </Button>
      </div>
    </Card>
  );
};
