import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui/BaseComponents";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/TabsComponents";
import { Pool } from "@/types/pool";
import { Loader2, AlertCircle, Info, Plus, Minus, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { useLiquidityManagement } from "@/hooks/lp";
import { LPData } from "@/types/lp";
import { formatUnits } from "viem";

interface LPActionsCardProps {
  pool: Pool;
  lpData: LPData;
}

export const LPActionsCard: React.FC<LPActionsCardProps> = ({
  pool,
  lpData,
}) => {
  const { address } = useAccount();
  const [liquidityAmount, setLiquidityAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [requiredCollateral, setRequiredCollateral] = useState<string>("0");
  const [hasApproved, setHasApproved] = useState(false);
  const [currentTab, setCurrentTab] = useState("liquidity");
  const [actionType, setActionType] = useState<"add" | "remove">("add");

  const {
    increaseLiquidity,
    decreaseLiquidity,
    addCollateral,
    reduceCollateral,
    claimInterest,
    isLoading: isManagingLiquidity,
    error: managementError,
  } = useLiquidityManagement(pool.liquidityManagerAddress);

  // Calculate required collateral amount when liquidity amount changes
  useEffect(() => {
    if (
      !liquidityAmount ||
      isNaN(Number(liquidityAmount)) ||
      actionType === "remove"
    ) {
      setRequiredCollateral("0");
      return;
    }

    // Get the LP healthy collateral ratio from the pool's strategy
    // This is typically expressed in basis points (10000 = 100%)
    const lpHealthyCollateralRatio = pool.lpHealthyCollateralRatio || 3000; // Default to 30% if not provided

    // Calculate required collateral: amount * (ratio / BPS)
    const collateralAmount = (
      (Number(liquidityAmount) * lpHealthyCollateralRatio) /
      10000
    ).toString();

    setRequiredCollateral(collateralAmount);
  }, [liquidityAmount, actionType]);

  const handleApproval = () => {
    // To be implemented in hooks
    setHasApproved(true);
  };

  const handleLiquidityAction = async () => {
    if (!liquidityAmount) return;

    if (actionType === "add") {
      await increaseLiquidity(liquidityAmount);
    } else {
      await decreaseLiquidity(liquidityAmount);
    }
  };

  const handleCollateralAction = async () => {
    if (!collateralAmount) return;

    if (actionType === "add") {
      await addCollateral(address!, collateralAmount);
    } else {
      await reduceCollateral(collateralAmount);
    }
  };

  const handleClaimInterest = async () => {
    await claimInterest();
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

  // Show loading state if LP data is still loading
  if (lpData.isLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            LP Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  // For non-LPs, show a simpler UI focused just on becoming an LP
  if (!lpData.isLP) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg">
        <CardHeader className="p-4 border-b border-gray-800">
          <CardTitle className="text-xl font-semibold text-white">
            Become a Liquidity Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">
                Liquidity Amount ({pool.reserveToken})
              </label>
              <Input
                type="number"
                placeholder="Enter amount to provide"
                value={liquidityAmount}
                onChange={(e) => setLiquidityAmount(e.target.value)}
                className="px-2 bg-slate-600/50 border-slate-700 h-12"
              />
            </div>

            {liquidityAmount && Number(liquidityAmount) > 0 && (
              <div className="p-3 bg-blue-500/10 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-blue-400">
                    Required Collateral:{" "}
                    <span className="font-medium">
                      {requiredCollateral} {pool.reserveToken}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Collateral is needed to ensure your position remains healthy
                    during price fluctuations.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {hasApproved ? (
              <Button
                onClick={handleLiquidityAction}
                disabled={isManagingLiquidity || !liquidityAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
              >
                {isManagingLiquidity && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Register as LP
              </Button>
            ) : (
              <Button
                onClick={handleApproval}
                disabled={isManagingLiquidity || !liquidityAmount}
                className="w-full bg-green-600 hover:bg-green-700 h-12"
              >
                {isManagingLiquidity && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Approve {pool.reserveToken}
              </Button>
            )}
            {renderError(managementError)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // UI for existing LPs with full functionality
  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg">
      <CardHeader className="p-4 border-b border-gray-800">
        <CardTitle className="text-xl font-semibold text-white">
          LP Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <Tabs
          defaultValue="liquidity"
          className="w-full"
          onValueChange={(value) => setCurrentTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1">
            <TabsTrigger
              value="liquidity"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-300"
            >
              Liquidity
            </TabsTrigger>
            <TabsTrigger
              value="collateral"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-300"
            >
              Collateral
            </TabsTrigger>
          </TabsList>

          {/* Liquidity Tab */}
          <TabsContent value="liquidity" className="mt-4 space-y-4">
            <div className="flex gap-2 mb-3">
              <Button
                onClick={() => setActionType("add")}
                className={`flex-1 ${
                  actionType === "add"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-700"
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
              <Button
                onClick={() => setActionType("remove")}
                className={`flex-1 ${
                  actionType === "remove"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-700"
                }`}
              >
                <Minus className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">
                  {actionType === "add" ? "Add" : "Remove"} Liquidity Amount (
                  {pool.reserveToken})
                </label>
                <Input
                  type="number"
                  placeholder={`Enter amount to ${
                    actionType === "add" ? "add" : "remove"
                  }`}
                  value={liquidityAmount}
                  onChange={(e) => setLiquidityAmount(e.target.value)}
                  className="px-2 bg-slate-600/50 border-slate-700 h-12"
                />
              </div>

              {actionType === "add" &&
                liquidityAmount &&
                Number(liquidityAmount) > 0 && (
                  <div className="p-3 bg-blue-500/10 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm text-blue-400">
                        Required Collateral:{" "}
                        <span className="font-medium">
                          {requiredCollateral} {pool.reserveToken}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Collateral is needed to ensure your position remains
                        healthy during price fluctuations.
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <div className="space-y-3">
              {actionType === "add" && !hasApproved ? (
                <Button
                  onClick={handleApproval}
                  disabled={isManagingLiquidity || !liquidityAmount}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isManagingLiquidity && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Approve {pool.reserveToken}
                </Button>
              ) : (
                <Button
                  onClick={handleLiquidityAction}
                  disabled={isManagingLiquidity || !liquidityAmount}
                  className={`w-full ${
                    actionType === "add"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isManagingLiquidity && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {actionType === "add" ? "Add" : "Remove"} Liquidity
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Collateral Tab */}
          <TabsContent value="collateral" className="mt-4 space-y-4">
            <div className="flex gap-2 mb-3">
              <Button
                onClick={() => setActionType("add")}
                className={`flex-1 ${
                  actionType === "add"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-700"
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
              <Button
                onClick={() => setActionType("remove")}
                className={`flex-1 ${
                  actionType === "remove"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-700"
                }`}
              >
                <Minus className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">
                  {actionType === "add" ? "Add" : "Remove"} Collateral Amount (
                  {pool.reserveToken})
                </label>
                <Input
                  type="number"
                  placeholder={`Enter amount to ${
                    actionType === "add" ? "add" : "remove"
                  }`}
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  className="px-2 bg-slate-600/50 border-slate-700 h-12"
                />
              </div>

              {actionType === "remove" && (
                <div className="p-3 bg-yellow-500/10 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-yellow-400">
                      Removing collateral may affect your position health.
                    </p>
                    <p className="text-xs text-gray-400">
                      You can only remove excess collateral above the required
                      minimum.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {actionType === "add" && !hasApproved ? (
                <Button
                  onClick={handleApproval}
                  disabled={isManagingLiquidity || !collateralAmount}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isManagingLiquidity && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Approve {pool.reserveToken}
                </Button>
              ) : (
                <Button
                  onClick={handleCollateralAction}
                  disabled={isManagingLiquidity || !collateralAmount}
                  className={`w-full ${
                    actionType === "add"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isManagingLiquidity && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {actionType === "add" ? "Add" : "Remove"} Collateral
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Interest Section */}
        {lpData.lpPosition?.interestAccrued &&
          Number(
            formatUnits(
              lpData.lpPosition.interestAccrued,
              pool.reserveTokenDecimals
            )
          ) > 0 && (
            <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-slate-800/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Accrued Interest</h3>
                <span className="text-green-400 font-medium">
                  {formatUnits(
                    lpData.lpPosition.interestAccrued,
                    pool.reserveTokenDecimals
                  )}{" "}
                  {pool.reserveToken}
                </span>
              </div>
              <Button
                onClick={handleClaimInterest}
                disabled={isManagingLiquidity}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isManagingLiquidity && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                <Wallet className="w-4 h-4 mr-2" />
                Claim Interest
              </Button>
            </div>
          )}

        {renderError(managementError)}
      </CardContent>
    </Card>
  );
};
