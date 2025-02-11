import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui/BaseComponents";
import { Pool } from "@/types/pool";
import { Loader2, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useRegisterLP, useLiquidityManagement, useLPStatus } from "@/hooks/lp";

interface LPActionsCardProps {
  pool: Pool;
}

export const LPActionsCard: React.FC<LPActionsCardProps> = ({ pool }) => {
  const { address } = useAccount();
  const [liquidityAmount, setLiquidityAmount] = useState("");

  const { isLP } = useLPStatus(pool.address);
  const {
    registerLP,
    isLoading: isRegistering,
    error: registerError,
  } = useRegisterLP();
  const {
    increaseLiquidity,
    decreaseLiquidity,
    isLoading: isManagingLiquidity,
    error: managementError,
  } = useLiquidityManagement();

  const handleRegisterLP = async () => {
    if (!address || !liquidityAmount) return;
    await registerLP(pool.address, address, liquidityAmount);
  };

  const handleIncreaseLiquidity = async () => {
    if (!liquidityAmount) return;
    await increaseLiquidity(pool.address, liquidityAmount);
  };

  const handleDecreaseLiquidity = async () => {
    if (!liquidityAmount) return;
    await decreaseLiquidity(pool.address, liquidityAmount);
  };

  const renderError = (error: Error | null) => {
    if (!error) return null;

    const message = error.message;
    const truncatedMessage =
      message.length > 100 ? `${message.slice(0, 50)}...` : message;

    return (
      <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-500/10 rounded">
        <AlertCircle className="w-4 h-4" />
        <span>{truncatedMessage}</span>
      </div>
    );
  };

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          LP Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Enter liquidity amount"
            value={liquidityAmount}
            onChange={(e) => setLiquidityAmount(e.target.value)}
            className="px-2 bg-slate-600/50 border-slate-700 h-12"
          />
        </div>
        {!isLP ? (
          <div className="space-y-3">
            <Button
              onClick={handleRegisterLP}
              disabled={isRegistering}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              {isRegistering && !registerError && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Register as LP
            </Button>
            {renderError(registerError)}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={handleIncreaseLiquidity}
                disabled={isManagingLiquidity}
                className="bg-green-600 hover:bg-green-700"
              >
                {isManagingLiquidity && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Increase Liquidity
              </Button>
              <Button
                onClick={handleDecreaseLiquidity}
                disabled={isManagingLiquidity}
                className="bg-red-600 hover:bg-red-700"
              >
                {isManagingLiquidity && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Decrease Liquidity
              </Button>
            </div>
            {renderError(managementError)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
