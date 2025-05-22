import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const UnconnectedPositionsCard: React.FC = () => {
  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          User Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center space-y-4">
        <p className="text-gray-400">
          Connect your wallet to view your positions
        </p>
        <div className="flex justify-center">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="w-1/2 sm:w-1/5 flex items-center justify-center gap-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </CardContent>
    </Card>
  );
};
