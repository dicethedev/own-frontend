// card to be displayed for non-whitelisted users

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
import { ArrowUpRight } from "lucide-react";

interface LPWhitelistCardProps {
  title: string;
}

export const LPWhitelistCard: React.FC<LPWhitelistCardProps> = ({ title }) => {
  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col items-center">
        <p className="text-gray-400">
          Access to these features are invite only!
        </p>
        <Button className="mt-4 justify-center">
          <a href="https://t.me/x0bhargav" target="_blank">
            <div className="flex items-center gap-2">
              Request Invite
              <ArrowUpRight size={14} />
            </div>
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
