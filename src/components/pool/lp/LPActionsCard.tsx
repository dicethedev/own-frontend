"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Loader2, AlertCircle, Info, Wallet } from "lucide-react";
import { Pool } from "@/types/pool";
import { useAccount } from "wagmi";
import { useLiquidityManagement } from "@/hooks/lp";
import { LPData } from "@/types/lp";
import { Address, formatUnits } from "viem";
import { formatTokenAmount, formatTokenBalance } from "@/utils";
import { truncateMessage } from "@/utils/truncate";

interface LPActionsCardProps {
  pool: Pool;
  lpData: LPData;
  isBlockedFromNewRequests?: boolean;
  blockMessage?: string;
}

export const LPActionsCard: React.FC<LPActionsCardProps> = ({
  pool,
  lpData,
  isBlockedFromNewRequests = false,
  blockMessage = " ",
}) => {
  const { address } = useAccount();
  const [liquidityAmount, setLiquidityAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [requiredCollateral, setRequiredCollateral] = useState<string>("0");
  const [currentTab, setCurrentTab] = useState("liquidity");
  const [actionType, setActionType] = useState<"add" | "remove">("add");
  const lpDelegateAddress: Address =
    (process.env.NEXT_PUBLIC_LP_DELEGATE_ADDRESS as Address) ||
    "0x0000000000000000000000000000000000000000";

  const currentTabRef = useRef(currentTab);

  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  const isPoolActive = pool.poolStatus === "ACTIVE";

  const {
    increaseLiquidity,
    decreaseLiquidity,
    registerLP,
    addCollateral,
    reduceCollateral,
    claimInterest,
    approve,
    checkApproval,
    checkSufficientBalance,
    isLoading,
    isLoadingBalance,
    isApproved,
    error: managementError,
    userBalance,
  } = useLiquidityManagement(
    pool.liquidityManagerAddress,
    pool.reserveTokenAddress,
    pool.reserveTokenDecimals
  );

  useEffect(() => {
    if (
      !liquidityAmount ||
      isNaN(Number(liquidityAmount)) ||
      actionType === "remove"
    ) {
      setRequiredCollateral("0");
      return;
    }

    const lpHealthyCollateralRatio = pool.lpHealthyCollateralRatio || 2000;
    const calculatedCollateral = (
      Number(liquidityAmount) *
      (lpHealthyCollateralRatio / 10000)
    ).toFixed(6);
    setRequiredCollateral(calculatedCollateral);
  }, [liquidityAmount, pool.lpHealthyCollateralRatio, actionType]);

  useEffect(() => {
    if (
      liquidityAmount &&
      actionType === "add" &&
      currentTabRef.current === "liquidity"
    ) {
      // Only check approval for collateral amount
      checkApproval(requiredCollateral);
    } else if (
      collateralAmount &&
      actionType === "add" &&
      currentTabRef.current === "collateral"
    ) {
      checkApproval(collateralAmount);
    }
  }, [
    liquidityAmount,
    collateralAmount,
    requiredCollateral,
    actionType,
    checkApproval,
  ]);

  const handleApprove = async () => {
    if (actionType === "add" && currentTab === "liquidity" && liquidityAmount) {
      // Only approve the collateral amount, not the total
      await approve(requiredCollateral);
    } else if (
      actionType === "add" &&
      currentTab === "collateral" &&
      collateralAmount
    ) {
      await approve(collateralAmount);
    }
  };

  const handleLiquidityAction = async () => {
    if (!liquidityAmount) return;
    if (actionType === "add") {
      await increaseLiquidity(liquidityAmount);
    } else {
      await decreaseLiquidity(liquidityAmount);
    }
  };

  const handleRegisterLP = async () => {
    await registerLP(liquidityAmount, lpDelegateAddress);
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
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-xl">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{truncateMessage(error.message)}</span>
      </div>
    );
  };

  const renderPoolStatusMessage = () => {
    if (isPoolActive) return null;
    return (
      <div className="flex items-center gap-2 text-gray-400 p-3 rounded-xl bg-[#303136]/30">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">
          Liquidity commitment can only be modified when the pool is active.
        </span>
      </div>
    );
  };

  const hasEnoughLiquidityBalance = liquidityAmount
    ? checkSufficientBalance(requiredCollateral)
    : false;

  const hasEnoughCollateralBalance = collateralAmount
    ? checkSufficientBalance(collateralAmount)
    : false;

  if (lpData.isLoading) {
    return (
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
        <CardHeader className="px-6 py-4 border-b border-[#303136]">
          <CardTitle className="text-lg font-semibold text-white">
            LP Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex justify-center items-center">
          <Loader2 role="status" className="w-6 h-6 animate-spin text-white" />
        </CardContent>
      </Card>
    );
  }

  // For non-LPs
  if (!lpData.isLP) {
    return (
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
        <CardHeader className="px-6 py-4 border-b border-[#303136]">
          <CardTitle className="text-lg font-semibold text-white">
            Become a Liquidity Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              Liquidity Commitment
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={liquidityAmount}
              onChange={(e) => setLiquidityAmount(e.target.value)}
              className="px-3 bg-[#303136]/50 border-[#303136] h-12 text-white placeholder:text-gray-500 rounded-xl"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">
                Balance:{" "}
                {isLoadingBalance ? (
                  <Loader2 className="w-3 h-3 inline animate-spin ml-1" />
                ) : (
                  `${formatTokenBalance(userBalance)} ${pool.reserveToken}`
                )}
              </span>
              {liquidityAmount && !hasEnoughLiquidityBalance && (
                <span className="text-xs text-red-400">
                  Insufficient balance
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#303136]/30 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">
                Liquidity Commitment
              </span>
              <span className="text-white">
                {liquidityAmount || "0"} {pool.reserveToken}
              </span>
            </div>
            <div className="border-t border-[#303136] pt-2 flex justify-between items-center">
              <span className="text-gray-400 text-sm font-medium">
                Collateral to Deposit (
                {((pool.lpHealthyCollateralRatio || 2000) / 100).toFixed(0)}%)
              </span>
              <span className="text-white font-medium">
                {requiredCollateral} {pool.reserveToken}
              </span>
            </div>
            <div className="pt-1 flex items-start gap-2 text-gray-500 text-xs">
              <span>
                You commit to underwrite {liquidityAmount || "0"}{" "}
                {pool.reserveToken} worth of asset. Only the collateral is
                deposited now.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {!isApproved ? (
              <Button
                onClick={handleApprove}
                disabled={
                  isLoading ||
                  !liquidityAmount ||
                  !hasEnoughLiquidityBalance ||
                  !isPoolActive
                }
                className="w-full h-12 rounded-xl"
                variant="primary"
              >
                {isLoading && (
                  <Loader2
                    role="status"
                    className="w-4 h-4 mr-2 animate-spin"
                  />
                )}
                <Wallet className="w-4 h-4 mr-2" />
                Approve {pool.reserveToken}
              </Button>
            ) : (
              <Button
                onClick={handleRegisterLP}
                disabled={
                  isLoading ||
                  !liquidityAmount ||
                  !hasEnoughLiquidityBalance ||
                  !isPoolActive
                }
                className="w-full h-12 rounded-xl"
                variant="primary"
              >
                {isLoading && (
                  <Loader2
                    role="status"
                    className="w-4 h-4 mr-2 animate-spin"
                  />
                )}
                Register as LP
              </Button>
            )}
            {renderPoolStatusMessage()}
            {renderError(managementError)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // UI for existing LPs
  return (
    <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white">
          LP Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <Tabs
          defaultValue="liquidity"
          value={currentTab}
          className="w-full"
          onValueChange={(value) => setCurrentTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2 bg-[#303136]/50 p-1 rounded-xl">
            <TabsTrigger
              value="liquidity"
              className="data-[state=active]:bg-[#303136] data-[state=active]:text-white text-gray-400 rounded-lg"
            >
              Commitment
            </TabsTrigger>
            <TabsTrigger
              value="collateral"
              className="data-[state=active]:bg-[#303136] data-[state=active]:text-white text-gray-400 rounded-lg"
            >
              Collateral
            </TabsTrigger>
          </TabsList>

          {/* Liquidity Tab */}
          <TabsContent value="liquidity" className="mt-4 space-y-4">
            <div className="flex items-center gap-6 mb-4 bg-[#303136]/30 rounded-xl p-3">
              {/* Add Option */}
              <div
                className="flex items-center cursor-pointer"
                onClick={() => setActionType("add")}
              >
                <input
                  type="radio"
                  id="add-liquidity"
                  name="liquidity-action"
                  checked={actionType === "add"}
                  onChange={() => setActionType("add")}
                  className="w-4 h-4 text-white bg-gray-700 border-gray-600 focus:ring-white focus:ring-offset-gray-800 cursor-pointer transition-colors"
                />
                <label
                  htmlFor="add-liquidity"
                  className={`ml-2 text-sm font-medium cursor-pointer ${
                    actionType === "add"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Add Commitment
                </label>
              </div>

              {/* Remove Option */}
              <div
                className="flex items-center cursor-pointer"
                onClick={() => setActionType("remove")}
              >
                <input
                  type="radio"
                  id="remove-liquidity"
                  name="liquidity-action"
                  checked={actionType === "remove"}
                  onChange={() => setActionType("remove")}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 focus:ring-red-600 focus:ring-offset-gray-800 cursor-pointer transition-colors"
                />
                <label
                  htmlFor="remove-liquidity"
                  className={`ml-2 text-sm font-medium cursor-pointer text-gray-400 hover:text-gray-300`}
                >
                  Remove
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                type="number"
                placeholder={`Enter amount to ${actionType}`}
                value={liquidityAmount}
                onChange={(e) => setLiquidityAmount(e.target.value)}
                className="px-3 bg-[#303136]/50 border-[#303136] h-12 text-white placeholder:text-gray-500 rounded-xl"
              />
              <div className="flex justify-between px-1">
                <span className="text-xs text-gray-400">
                  Balance:{" "}
                  {isLoadingBalance ? (
                    <Loader2 className="w-3 h-3 inline animate-spin ml-1" />
                  ) : (
                    `${formatTokenBalance(userBalance)} ${pool.reserveToken}`
                  )}
                </span>
              </div>
            </div>

            {actionType === "add" && (
              <div className="bg-[#303136]/30 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">
                    Liquidity Commitment
                  </span>
                  <span className="text-white">
                    {liquidityAmount || "0"} {pool.reserveToken}
                  </span>
                </div>
                <div className="border-t border-[#303136] pt-2 flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium">
                    Collateral to Deposit
                  </span>
                  <span className="text-white font-medium">
                    {requiredCollateral} {pool.reserveToken}
                  </span>
                </div>
                <div className="pt-1 flex items-start gap-2 text-gray-500 text-xs">
                  <span>
                    Adding {liquidityAmount || "0"} {pool.reserveToken} to your
                    commitment. Only the collateral is deposited now.
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {actionType === "add" && !isApproved ? (
                <Button
                  onClick={handleApprove}
                  disabled={
                    isLoading ||
                    !liquidityAmount ||
                    !hasEnoughLiquidityBalance ||
                    !isPoolActive ||
                    isBlockedFromNewRequests
                  }
                  className="w-full h-12 rounded-xl"
                  variant="primary"
                >
                  {isLoading && (
                    <Loader2
                      role="status"
                      className="w-4 h-4 mr-2 animate-spin"
                    />
                  )}
                  <Wallet className="w-4 h-4 mr-2" />
                  Approve {pool.reserveToken}
                </Button>
              ) : (
                <Button
                  onClick={handleLiquidityAction}
                  disabled={
                    isLoading ||
                    !liquidityAmount ||
                    !isPoolActive ||
                    isBlockedFromNewRequests
                  }
                  className={`w-full h-12 rounded-xl`}
                  variant={actionType === "add" ? "primary" : "secondary"}
                >
                  {isLoading && (
                    <Loader2
                      role="status"
                      className="w-4 h-4 mr-2 animate-spin"
                    />
                  )}
                  {actionType === "add" ? "Add" : "Remove"} Commitment
                </Button>
              )}
            </div>

            {isBlockedFromNewRequests && blockMessage && (
              <div className="flex items-center text-gray-400 gap-2 p-3 rounded-xl bg-blue-500/10">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <span className="text-sm text-blue-400">{blockMessage}</span>
              </div>
            )}

            {renderPoolStatusMessage()}
          </TabsContent>

          {/* Collateral Tab */}
          <TabsContent value="collateral" className="mt-4 space-y-4">
            <div className="flex items-center gap-6 mb-4 bg-[#303136]/30 rounded-xl p-3">
              {/* Add Option */}
              <div
                className="flex items-center cursor-pointer"
                onClick={() => setActionType("add")}
              >
                <input
                  type="radio"
                  id="add-collateral"
                  name="collateral-action"
                  checked={actionType === "add"}
                  onChange={() => setActionType("add")}
                  className="w-4 h-4 text-white bg-gray-700 border-gray-600 focus:ring-white focus:ring-offset-gray-800 cursor-pointer transition-colors"
                />
                <label
                  htmlFor="add-collateral"
                  className={`ml-2 text-sm font-medium cursor-pointer ${
                    actionType === "add"
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Add Collateral
                </label>
              </div>

              {/* Remove Option */}
              <div
                className="flex items-center cursor-pointer"
                onClick={() => setActionType("remove")}
              >
                <input
                  type="radio"
                  id="remove-collateral"
                  name="collateral-action"
                  checked={actionType === "remove"}
                  onChange={() => setActionType("remove")}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 focus:ring-red-600 focus:ring-offset-gray-800 cursor-pointer transition-colors"
                />
                <label
                  htmlFor="remove-collateral"
                  className={`ml-2 text-sm font-medium cursor-pointer text-gray-400 hover:text-gray-300`}
                >
                  Remove
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                type="number"
                placeholder={`Enter amount to ${actionType}`}
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                className="px-3 bg-[#303136]/50 border-[#303136] h-12 text-white placeholder:text-gray-500 rounded-xl"
              />
              <div className="flex justify-between px-1">
                <span className="text-xs text-gray-400">
                  Balance:{" "}
                  {isLoadingBalance ? (
                    <Loader2 className="w-3 h-3 inline animate-spin ml-1" />
                  ) : (
                    `${formatTokenBalance(userBalance)} ${pool.reserveToken}`
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {actionType === "add" && !isApproved ? (
                <Button
                  onClick={handleApprove}
                  disabled={
                    isLoading ||
                    !collateralAmount ||
                    !hasEnoughCollateralBalance
                  }
                  className="w-full h-12 rounded-xl"
                  variant="primary"
                >
                  {isLoading && (
                    <Loader2
                      role="status"
                      className="w-4 h-4 mr-2 animate-spin"
                    />
                  )}
                  <Wallet className="w-4 h-4 mr-2" />
                  Approve {pool.reserveToken}
                </Button>
              ) : (
                <Button
                  onClick={handleCollateralAction}
                  disabled={isLoading || !collateralAmount}
                  className={`w-full h-12 rounded-xl disabled:opacity-50`}
                  variant={actionType === "add" ? "primary" : "secondary"}
                >
                  {isLoading && (
                    <Loader2
                      role="status"
                      className="w-4 h-4 mr-2 animate-spin"
                    />
                  )}
                  {actionType === "add" ? "Add" : "Remove"} Collateral
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Interest Section */}
        {lpData.lpPosition?.interestAccrued &&
          currentTab === "collateral" &&
          Number(
            formatUnits(
              lpData.lpPosition.interestAccrued,
              pool.reserveTokenDecimals
            )
          ) > 0 && (
            <div className="mt-4 p-4 border border-[#303136] rounded-xl bg-[#303136]/30">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-400">
                  Accrued Interest
                </h3>
                <span className="text-emerald-400 font-medium">
                  {formatTokenAmount(
                    lpData.lpPosition.interestAccrued,
                    pool.reserveTokenDecimals
                  )}{" "}
                  {pool.reserveToken}
                </span>
              </div>
              <Button
                data-testid="ClaimInterest"
                onClick={handleClaimInterest}
                disabled={isLoading}
                className="w-full h-10 rounded-xl"
                variant="primary"
              >
                {isLoading && (
                  <Loader2
                    role="status"
                    className="w-4 h-4 mr-2 animate-spin"
                  />
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
