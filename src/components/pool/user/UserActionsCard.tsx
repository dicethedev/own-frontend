import React, { useState, useEffect } from "react";
import { Button, Card, Input } from "@/components/ui/BaseComponents";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/TabsComponents";
import { ArrowUpDown, Info, Wallet, Loader2 } from "lucide-react";
import { Pool } from "@/types/pool";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  useClaimRequest,
  useDepositRequest,
  useRedemptionRequest,
} from "@/hooks/pool";
import toast from "react-hot-toast";
import { UserData } from "@/types/user";
import { hasPendingRequest } from "@/hooks/user";

interface UserActionsCardProps {
  pool: Pool;
  userData: UserData;
}

export const UserActionsCard: React.FC<UserActionsCardProps> = ({
  pool,
  userData,
}) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const { address } = useAccount();
  const {
    userRequest,
    isLoading: isUserDataLoading,
    error: userDataError,
  } = userData;

  // Contract interactions
  const {
    deposit,
    needsApproval,
    isLoading: isDepositing,
    error: depositError,
    isLoadingBalance,
    isSuccess: isDepositSuccess,
    formattedBalance,
    checkSufficientBalance,
  } = useDepositRequest(pool.address, pool.depositTokenAddress);

  const {
    redeem,
    isLoading: isRedeeming,
    isSuccess: isRedeemSuccess,
  } = useRedemptionRequest(pool.address);
  const { claim, isLoading: isClaiming } = useClaimRequest(pool.address);

  // Get the current cycle rebalance price
  const rebalancePrice = pool.prevRebalancePrice;

  // Effect to handle successful deposit/redeem and refetch user data
  useEffect(() => {
    if (isDepositSuccess) {
      toast.success("Deposit request submitted successfully");
      setDepositAmount("");
    }
  }, [isDepositSuccess]);

  useEffect(() => {
    if (isRedeemSuccess) {
      toast.success("Redemption request submitted successfully");
      setRedeemAmount("");
    }
  }, [isRedeemSuccess]);

  const handleDeposit = async () => {
    if (!depositAmount) {
      toast.error("Please enter an amount");
      return;
    }

    try {
      await deposit(depositAmount);
    } catch (error) {
      console.error("Deposit error:", error);
    }
  };

  const handleRedeem = async () => {
    if (!redeemAmount) {
      toast.error("Please enter an amount");
      return;
    }

    try {
      await redeem(redeemAmount);
    } catch (error) {
      console.error("Redeem error:", error);
      toast.error("Error processing redemption");
    }
  };

  const handleClaim = async () => {
    if (!address) return;
    try {
      await claim(address);
      toast.success("Request claimed successfully");
    } catch (error) {
      console.error("Claim error:", error);
      toast.error("Error claiming request");
    }
  };

  const pendingRequest = hasPendingRequest(userRequest, pool.currentCycle);
  const isRequestProcessed =
    userRequest && Number(pool.currentCycle) > Number(userRequest.requestCycle);
  const isDepositable = !pendingRequest && !isDepositing;
  const isRedeemable = !pendingRequest && !isRedeeming;

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
            disabled={!isDepositable}
            className="px-2 h-12 bg-slate-600/50 border-slate-700 text-gray-400 placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-slate-400">
              Balance:{" "}
              {isLoadingBalance ? (
                <Loader2 className="w-3 h-3 inline animate-spin ml-1" />
              ) : (
                `${formattedBalance} ${pool.depositToken}`
              )}
            </span>
            {depositAmount && !checkSufficientBalance(depositAmount) && (
              <span className="text-sm text-red-400">Insufficient balance</span>
            )}
            {depositError && (
              <span className="text-sm text-red-400">{depositError}</span>
            )}
          </div>
        </div>

        <Button
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleDeposit}
          disabled={
            !isDepositable ||
            !depositAmount ||
            !checkSufficientBalance(depositAmount)
          }
        >
          {isDepositing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Wallet className="w-4 h-4 mr-2" />
          {needsApproval
            ? `Approve & Deposit ${pool.depositToken}`
            : `Deposit ${pool.depositToken}`}
        </Button>
      </div>
      <p className="text-sm text-slate-400 flex items-center">
        <Info className="w-4 h-4 mr-1" />
        Deposits are processed at the end of each cycle
      </p>
    </TabsContent>
  );

  // Show loading state
  if (isUserDataLoading) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg p-4">
        <div className="flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </Card>
    );
  }

  if (userDataError) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg p-4">
        <div className="text-center text-red-500">
          Error loading user request status. Please try again later.
        </div>
      </Card>
    );
  }

  if (pendingRequest && userRequest) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg p-2">
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-medium text-white">Pending Request</h3>
          <div className="space-y-2">
            <p className="text-gray-400">
              Type:{" "}
              {userRequest.requestType === "DEPOSIT" ? "Deposit" : "Redemption"}
            </p>
            <p className="text-gray-400">
              Amount: {formatUnits(userRequest.amount, 6)}
            </p>
            <p className="text-gray-400">
              Cycle: #{userRequest.requestCycle.toString()}
            </p>
            {isRequestProcessed && userRequest.requestType === "DEPOSIT" && (
              <p className="text-gray-400">
                Rebalance Price:{" "}
                {rebalancePrice ? formatUnits(rebalancePrice, 18) : "-"}
              </p>
            )}
            {isRequestProcessed &&
              userRequest.requestType === "DEPOSIT" &&
              rebalancePrice && (
                <p className="text-gray-400">
                  {pool.assetTokenSymbol} Balance:{" "}
                  {(
                    Number(formatUnits(userRequest.amount, 6)) /
                    Number(formatUnits(rebalancePrice, 18))
                  ).toFixed(5)}
                </p>
              )}
            <div className="space-y-2">
              <Button
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isClaiming && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Claim{" "}
                {userRequest.requestType === "DEPOSIT"
                  ? pool.assetTokenSymbol
                  : pool.depositToken}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 border-gray-800 rounded-lg p-2">
      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1">
          <TabsTrigger
            value="deposit"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-300"
          >
            Deposit
          </TabsTrigger>
          <TabsTrigger
            value="redeem"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-300"
          >
            Redeem
          </TabsTrigger>
        </TabsList>

        {renderDepositContent()}

        <TabsContent value="redeem" className="mt-4 space-y-4">
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Amount to redeem"
              value={redeemAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRedeemAmount(e.target.value)
              }
              disabled={!isRedeemable}
              className="px-2 h-12 bg-slate-600/50 border-slate-700 text-gray-400 placeholder:text-gray-400"
            />
            <Button
              variant="secondary"
              className="w-full h-12 bg-slate-700 hover:bg-slate-600 text-slate-100"
              onClick={handleRedeem}
              disabled={!isRedeemable || !redeemAmount}
            >
              {isRedeeming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Redeem x{pool.assetSymbol}
            </Button>
          </div>
          <p className="text-sm text-slate-400 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Redemptions are processed at the end of each cycle
          </p>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
