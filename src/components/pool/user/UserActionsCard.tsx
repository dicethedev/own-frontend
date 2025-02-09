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
  useCancelRequest,
  useClaimRequest,
  useDepositRequest,
  useRedemptionRequest,
  useUserRequest,
} from "@/hooks/pool";
import toast from "react-hot-toast";

interface UserActionsCardProps {
  pool: Pool;
}

export const UserActionsCard: React.FC<UserActionsCardProps> = ({ pool }) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const { address } = useAccount();

  // Contract interactions
  const {
    deposit,
    isLoading: isDepositing,
    isSuccess: isDepositSuccess,
  } = useDepositRequest(pool.address);
  const {
    redeem,
    isLoading: isRedeeming,
    isSuccess: isRedeemSuccess,
  } = useRedemptionRequest(pool.address);
  const { cancel, isLoading: isCancelling } = useCancelRequest(pool.address);
  const { claim, isLoading: isClaiming } = useClaimRequest(pool.address);

  // Get user's pending request
  const {
    data: userRequestData,
    isError: isUserRequestError,
    refetch: refetchUserRequest,
  } = useUserRequest(pool.address, address!);

  // Effect to handle successful deposit/redeem and refetch user request
  useEffect(() => {
    if (isDepositSuccess) {
      toast.success("Deposit request submitted successfully");
      setDepositAmount("");
      refetchUserRequest();
    }
  }, [isDepositSuccess, refetchUserRequest]);

  useEffect(() => {
    if (isRedeemSuccess) {
      toast.success("Redemption request submitted successfully");
      setRedeemAmount("");
      refetchUserRequest();
    }
  }, [isRedeemSuccess, refetchUserRequest]);

  // Effect to handle user request error
  useEffect(() => {
    if (isUserRequestError) {
      toast.error("Error fetching user request status");
    }
  }, [isUserRequestError]);

  const handleDeposit = async () => {
    if (!depositAmount) {
      toast.error("Please enter an amount");
      return;
    }

    try {
      await deposit(depositAmount);
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Error processing deposit");
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

  const handleCancel = async () => {
    try {
      await cancel();
      await refetchUserRequest();
      toast.success("Request cancelled successfully");
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Error cancelling request");
    }
  };

  const handleClaim = async () => {
    if (!address) return;
    try {
      await claim(address);
      await refetchUserRequest();
      toast.success("Request claimed successfully");
    } catch (error) {
      console.error("Claim error:", error);
      toast.error("Error claiming request");
    }
  };

  const hasPendingRequest = userRequestData && userRequestData[0] > BigInt(0);
  const isDepositable = !hasPendingRequest && !isDepositing;
  const isRedeemable = !hasPendingRequest && !isRedeeming;

  if (isUserRequestError) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg p-4">
        <div className="text-center text-red-500">
          Error loading user request status. Please try again later.
        </div>
      </Card>
    );
  }

  if (hasPendingRequest) {
    return (
      <Card className="bg-white/10 border-gray-800 rounded-lg p-2">
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-medium text-white">Pending Request</h3>
          <div className="space-y-2">
            <p className="text-gray-400">
              Type: {userRequestData[1] ? "Deposit" : "Redemption"}
            </p>
            <p className="text-gray-400">
              Amount: {formatUnits(userRequestData[0], 6)}
            </p>
            <p className="text-gray-400">
              Cycle: #{userRequestData[2].toString()}
            </p>
            <div className="space-y-2">
              <Button
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isCancelling && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Cancel Request
              </Button>
              <Button
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isClaiming && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Claim Request
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

        <TabsContent value="deposit" className="mt-4 space-y-4">
          <div className="space-y-3">
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
            <Button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleDeposit}
              disabled={!isDepositable || !depositAmount}
            >
              {isDepositing && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Wallet className="w-4 h-4 mr-2" />
              Deposit {pool.depositToken}
            </Button>
          </div>
          <p className="text-sm text-slate-400 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Deposits are processed at the end of each cycle
          </p>
        </TabsContent>

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
              Redeem x{pool.symbol}
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
