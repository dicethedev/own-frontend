import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";

export const UserPositionsCard: React.FC = () => {
  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          User Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-gray-400">No positions available</p>
      </CardContent>
    </Card>
  );
};
