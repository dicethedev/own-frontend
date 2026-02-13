"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Input } from "@/components/ui/BaseComponents";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/TabsComponents";
import {
  ArrowUpDown,
  Info,
  Wallet,
  Loader2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Pool } from "@/types/pool";
import { UserData } from "@/types/user";
import { useUserPoolManagement } from "@/hooks/user";
import {
  calculateAvailableLiquidity,
  doesDepositExceedLiquidity,
  formatLiquidityAmount,
} from "@/utils/liquidity";
import toast from "react-hot-toast";
import { formatTokenBalance } from "@/utils";
import { truncateMessage } from "@/utils/truncate";
import { GetReserveButton } from "@/components/reserve/GetReserveButton";
import { isAaveSupported } from "@/config/aave";
import { useChainId } from "wagmi";
import { useAnalytics } from "@/hooks/useAnalytics";

interface UserActionsCardProps {
  pool: Pool;
  userData: UserData;
  isBlockedFromNewRequests?: boolean;
  blockMessage?: string;
}

export const UserActionsCard: React.FC<UserActionsCardProps> = ({
  pool,
  userData,
  isBlockedFromNewRequests = false,
  blockMessage = " ",
}) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [requiredCollateral, setRequiredCollateral] = useState<string>("0");
  const [liquidityError, setLiquidityError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("deposit");
  const { isLoading: isUserDataLoading, error: userDataError } = userData;
  const chainId = useChainId();

  const { trackDepositInitiated, trackDepositCompleted } = useAnalytics();

  // Check if pool is active
  const isPoolActive = pool.poolStatus === "ACTIVE";

  // Calculate available liquidity
  const liquidityData = calculateAvailableLiquidity(pool);

  // Use the hook for contract interactions
  const {
    depositRequest,
    redemptionRequest,
    checkReserveApproval,
    checkAssetApproval,
    approveReserve,
    approveAsset,
    checkSufficientReserveBalance,
    checkSufficientAssetBalance,
    isLoading,
    error: useUserPoolManagementError,
    reserveBalance,
    assetBalance,
    isLoadingReserveBalance,
    isLoadingAssetBalance,
    reserveApproved,
    assetApproved,
  } = useUserPoolManagement(
    pool.address,
    pool.reserveTokenAddress,
    pool.reserveTokenDecimals,
    pool.assetTokenAddress,
    18, // asset token decimals
  );

  // Calculate required collateral amount when deposit amount changes
  useEffect(() => {
    if (!depositAmount || isNaN(Number(depositAmount))) {
      setRequiredCollateral("0");
      setLiquidityError("");
      return;
    }

    // Get the user healthy collateral ratio from the pool's strategy
    const userHealthyCollateralRatio = pool.userHealthyCollateralRatio || 2000;

    // Calculate required collateral: amount * (ratio / BPS)
    const calculatedCollateral = (
      Number(depositAmount) *
      (userHealthyCollateralRatio / 10000)
    ).toString();

    setRequiredCollateral(calculatedCollateral);

    // Check if deposit exceeds available liquidity
    if (
      doesDepositExceedLiquidity(
        depositAmount,
        liquidityData.availableLiquidity,
      )
    ) {
      setLiquidityError(
        `Deposit amount exceeds available liquidity. Maximum available: ${formatLiquidityAmount(
          liquidityData.availableLiquidity,
          pool.reserveToken,
        )}`,
      );
    } else {
      setLiquidityError("");
    }
  }, [
    depositAmount,
    pool.userHealthyCollateralRatio,
    liquidityData.availableLiquidity,
    pool.reserveToken,
    chainId,
  ]);

  // Check approval status when amounts change
  useEffect(() => {
    const checkApprovals = async () => {
      if (depositAmount && Number(depositAmount) > 0 && !liquidityError) {
        const totalAmount = (
          Number(depositAmount) + Number(requiredCollateral)
        ).toString();
        await checkReserveApproval(totalAmount);
      }

      if (redeemAmount && Number(redeemAmount) > 0) {
        await checkAssetApproval(redeemAmount);
      }
    };

    checkApprovals();
  }, [
    depositAmount,
    redeemAmount,
    requiredCollateral,
    liquidityError,
    checkReserveApproval,
    checkAssetApproval,
  ]);

  const handleDeposit = async () => {
    if (!depositAmount) {
      toast.error("Please enter an amount");
      return;
    }

    if (liquidityError) {
      toast.error("Deposit exceeds available liquidity");
      return;
    }

    const eventData = {
      pool_symbol: pool.assetSymbol,
      pool_address: pool.address,
      deposit_amount: depositAmount,
      collateral_amount: requiredCollateral,
      chain_id: chainId,
    };

    try {
      trackDepositInitiated(eventData);
      await depositRequest(depositAmount, requiredCollateral);
      setDepositAmount("");
      trackDepositCompleted(eventData);
    } catch (error) {
      console.error("Deposit error:", error);
    }
  };

  const handleApproveDeposit = async () => {
    if (!depositAmount) {
      toast.error("Please enter an amount");
      return;
    }

    if (liquidityError) {
      toast.error("Cannot approve: deposit exceeds available liquidity");
      return;
    }

    try {
      const totalAmount = (
        Number(depositAmount) + Number(requiredCollateral)
      ).toString();
      await approveReserve(totalAmount);
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  const handleApproveRedeem = async () => {
    if (!redeemAmount) {
      toast.error("Please enter an amount");
      return;
    }

    try {
      await approveAsset(redeemAmount);
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  const handleRedeem = async () => {
    if (!redeemAmount) {
      toast.error("Please enter an amount");
      return;
    }

    try {
      await redemptionRequest(redeemAmount);
      setRedeemAmount("");
    } catch (error) {
      console.error("Redeem error:", error);
      toast.error("Error processing redemption");
    }
  };

  const isDepositable = isPoolActive && !isLoading && !liquidityError;
  const isRedeemable = isPoolActive && !isLoading;

  // Check if there's enough balance for the current action
  const hasEnoughDepositBalance =
    depositAmount && requiredCollateral
      ? checkSufficientReserveBalance(
          (Number(depositAmount) + Number(requiredCollateral)).toString(),
        )
      : true;

  // Show "Get aUSDC" button when user has zero reserve balance on a supported chain
  const showGetReserve =
    isAaveSupported(chainId) &&
    depositAmount &&
    !hasEnoughDepositBalance &&
    reserveBalance !== undefined;

  // Render error if present
  const renderError = (error: Error | null) => {
    if (!error) return null;

    return (
      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
        <AlertCircle className="w-4 h-4" />
        <span>{truncateMessage(error.message, 100)}</span>
      </div>
    );
  };

  // Render deposit tab content
  const renderDepositContent = () => (
    <TabsContent value="deposit" className="mt-4 space-y-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <Input
            type="number"
            placeholder="Amount to deposit"
            value={depositAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDepositAmount(e.target.value)
            }
            className="px-3 h-12 bg-[#303136]/50 border-[#303136] text-white placeholder:text-gray-500 rounded-xl"
          />
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-gray-400">
              Balance:{" "}
              {isLoadingReserveBalance ? (
                <Loader2
                  role="status"
                  className="w-3 h-3 inline animate-spin ml-1"
                />
              ) : (
                `${formatTokenBalance(reserveBalance)} ${pool.reserveToken}`
              )}
            </span>
            {depositAmount && !hasEnoughDepositBalance && (
              <span className="text-sm text-red-400">Insufficient balance</span>
            )}
          </div>
        </div>

        {/* Liquidity Error Display */}
        {liquidityError && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 p-3 rounded-xl">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{liquidityError}</span>
          </div>
        )}

        {/* Collateral Info */}
        <div className="bg-[#303136]/30 p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Deposit Amount</span>
            <span className="text-white">
              {depositAmount || "0"} {pool.reserveToken}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">
              Required Collateral (
              {((pool.userHealthyCollateralRatio || 2000) / 100).toFixed(0)}%)
            </span>
            <span className="text-white">
              {requiredCollateral} {pool.reserveToken}
            </span>
          </div>
          <div className="border-t border-[#303136] pt-2 flex justify-between items-center">
            <span className="text-gray-400 text-sm font-medium">
              Total Required
            </span>
            <span className="text-white font-medium">
              {(
                Number(depositAmount || 0) + Number(requiredCollateral)
              ).toFixed(2)}{" "}
              {pool.reserveToken}
            </span>
          </div>
          <div className="pt-2 flex items-start gap-2 text-gray-500 text-xs">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>
              Collateral is used to pay the pool interest. The total amount
              deposited is the sum of the deposit amount and the required
              collateral.
            </span>
          </div>
        </div>

        {showGetReserve ? (
          <GetReserveButton tokenSymbol={pool.reserveToken} />
        ) : !reserveApproved ? (
          <Button
            onClick={handleApproveDeposit}
            disabled={
              !isDepositable ||
              !depositAmount ||
              !hasEnoughDepositBalance ||
              !!liquidityError ||
              isBlockedFromNewRequests
            }
            variant="primary"
            className="w-full h-12 rounded-xl disabled:cursor-not-allowed"
          >
            {isLoading && (
              <Loader2 role="status" className="w-4 h-4 mr-2 animate-spin" />
            )}
            <Wallet className="w-4 h-4 mr-2" />
            Approve {pool.reserveToken}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full h-12 rounded-xl disabled:cursor-not-allowed"
            onClick={handleDeposit}
            disabled={
              !isDepositable ||
              !depositAmount ||
              !hasEnoughDepositBalance ||
              !!liquidityError ||
              isBlockedFromNewRequests
            }
          >
            {isLoading && (
              <Loader2 role="status" className="w-4 h-4 mr-2 animate-spin" />
            )}
            <Wallet className="w-4 h-4 mr-2" />
            Deposit {pool.reserveToken}
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-400 flex items-center">
        <Info className="w-4 h-4 mr-1 flex-shrink-0" />
        {isPoolActive
          ? isBlockedFromNewRequests && blockMessage
            ? blockMessage
            : "Deposits are processed at the end of each cycle"
          : `Pool is currently ${pool.poolStatus.toLowerCase()}. Actions are disabled.`}
      </p>

      {renderError(useUserPoolManagementError)}
    </TabsContent>
  );

  // Show loading state
  if (isUserDataLoading) {
    return (
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-6 shadow-xl">
        <div className="flex justify-center items-center py-8">
          <Loader2 role="status" className="w-6 h-6 animate-spin text-white" />
        </div>
      </Card>
    );
  }

  if (userDataError) {
    return (
      <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-6 shadow-xl">
        <div className="text-center text-red-400 py-8">
          Error loading user data. Please try again later.
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-4 shadow-xl">
      <Tabs
        defaultValue="deposit"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-[#303136]/50 p-1 rounded-xl">
          <TabsTrigger
            value="deposit"
            className="data-[state=active]:bg-[#303136] data-[state=active]:text-white text-gray-400 rounded-lg"
          >
            Deposit
          </TabsTrigger>
          <TabsTrigger
            value="redeem"
            className="data-[state=active]:bg-[#303136] data-[state=active]:text-white text-gray-400 rounded-lg"
          >
            Redeem
          </TabsTrigger>
        </TabsList>

        {renderDepositContent()}

        <TabsContent value="redeem" className="mt-4 space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Input
                type="number"
                placeholder="Amount to redeem"
                value={redeemAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRedeemAmount(e.target.value)
                }
                className="px-3 h-12 bg-[#303136]/50 border-[#303136] text-white placeholder:text-gray-500 rounded-xl"
              />
              <div className="flex items-center justify-between px-2">
                <span className="text-sm text-gray-400">
                  Balance:{" "}
                  {isLoadingAssetBalance ? (
                    <Loader2
                      role="status"
                      className="w-3 h-3 inline animate-spin ml-1"
                    />
                  ) : (
                    `${formatTokenBalance(assetBalance)} ${
                      pool.assetTokenSymbol
                    }`
                  )}
                </span>
                {redeemAmount && !checkSufficientAssetBalance(redeemAmount) && (
                  <span className="text-sm text-red-400">
                    Insufficient balance
                  </span>
                )}
              </div>
            </div>

            {!assetApproved ? (
              <Button
                onClick={handleApproveRedeem}
                disabled={
                  !isRedeemable ||
                  !redeemAmount ||
                  !checkSufficientAssetBalance(redeemAmount) ||
                  isBlockedFromNewRequests
                }
                variant="secondary"
                className="w-full h-12 rounded-xl"
              >
                {isLoading && (
                  <Loader2
                    role="status"
                    className="w-4 h-4 mr-2 animate-spin"
                  />
                )}
                <Wallet className="w-4 h-4 mr-2" />
                Approve {pool.assetTokenSymbol}
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full h-12 rounded-xl"
                onClick={handleRedeem}
                disabled={
                  !isRedeemable ||
                  !redeemAmount ||
                  !checkSufficientAssetBalance(redeemAmount) ||
                  isBlockedFromNewRequests
                }
              >
                {isLoading && (
                  <Loader2
                    role="status"
                    className="w-4 h-4 mr-2 animate-spin"
                  />
                )}
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Redeem {pool.assetTokenSymbol}
              </Button>
            )}
          </div>

          <p className="text-sm text-gray-400 flex items-center">
            <Info className="w-4 h-4 mr-1 flex-shrink-0" />
            {isPoolActive
              ? isBlockedFromNewRequests && blockMessage
                ? blockMessage
                : "Redemptions are processed at the end of each cycle"
              : `Pool is currently ${pool.poolStatus.toLowerCase()}. Actions are disabled.`}
          </p>

          {renderError(useUserPoolManagementError)}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
