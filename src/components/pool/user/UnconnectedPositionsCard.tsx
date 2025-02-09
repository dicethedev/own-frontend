import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui/BaseComponents";
import { Wallet } from "lucide-react";
import { useConnect } from "wagmi";

export const UnconnectedPositionsCard: React.FC = () => {
  const { connect, connectors } = useConnect();
  const metamask = connectors[0];

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
        <Button
          key={metamask.id}
          onClick={() => connect({ connector: metamask })}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect
        </Button>
      </CardContent>
    </Card>
  );
};
