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
import { Loader2, AlertCircle, Info, Plus, Minus, Wallet } from "lucide-react";
import { Pool } from "@/types/pool";
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
                Liquidity Commitment ({pool.reserveToken})
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
                  <div className="group relative">
                    <p className="text-xs text-gray-400 cursor-help underline decoration-dotted">
                      Why is collateral needed?
                    </p>
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Collateral is used to back your liquidity Commitment.
                    </div>
                  </div>
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
              Commitment
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
            {/* Radio buttons for Add/Remove */}
            <div className="flex items-center gap-6 mb-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="add-liquidity"
                  name="liquidity-action"
                  checked={actionType === "add"}
                  onChange={() => setActionType("add")}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                />
                <label
                  htmlFor="add-liquidity"
                  className="ml-2 text-sm font-medium text-gray-300"
                >
                  Add Commitment
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="remove-liquidity"
                  name="liquidity-action"
                  checked={actionType === "remove"}
                  onChange={() => setActionType("remove")}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                />
                <label
                  htmlFor="remove-liquidity"
                  className="ml-2 text-sm font-medium text-gray-300"
                >
                  Remove
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">
                  {actionType === "add" ? "Add" : "Remove"} Liquidity Commitment
                  ({pool.reserveToken})
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
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">
                        Required Collateral:
                      </span>
                      <span className="text-sm font-medium text-blue-400">
                        {requiredCollateral} {pool.reserveToken}
                      </span>
                    </div>
                    <div className="group relative mt-1">
                      <span className="text-xs text-gray-400 cursor-help underline decoration-dotted">
                        Learn more
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        Collateral is needed to back your liquidity commitment.
                      </div>
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
            {/* Radio buttons for Add/Remove */}
            <div className="flex items-center gap-6 mb-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="add-collateral"
                  name="collateral-action"
                  checked={actionType === "add"}
                  onChange={() => setActionType("add")}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                />
                <label
                  htmlFor="add-collateral"
                  className="ml-2 text-sm font-medium text-gray-300"
                >
                  Add Collateral
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="remove-collateral"
                  name="collateral-action"
                  checked={actionType === "remove"}
                  onChange={() => setActionType("remove")}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-600 focus:ring-offset-gray-800"
                />
                <label
                  htmlFor="remove-collateral"
                  className="ml-2 text-sm font-medium text-gray-300"
                >
                  Remove Collateral
                </label>
              </div>
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
                <div className="group relative">
                  <div className="flex items-center gap-1 text-yellow-500 cursor-help">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">
                      Removing collateral may affect your position health
                    </span>
                  </div>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                    You can only remove excess collateral above the required
                    minimum.
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
