"use client";

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
import { Loader2, AlertCircle, Info, Wallet } from "lucide-react";
import { Pool } from "@/types/pool";
import { UserData } from "@/types/user";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useUserPoolManagement } from "@/hooks/user";
import { formatTokenBalance } from "@/utils";

interface UserCollateralManagementCardProps {
  pool: Pool;
  userData: UserData;
}

export const UserCollateralManagementCard: React.FC<
  UserCollateralManagementCardProps
> = ({ pool, userData }) => {
  const { address } = useAccount();
  const [collateralAmount, setCollateralAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("add");

  const {
    addCollateral,
    reduceCollateral,
    approveReserve,
    reserveBalance,
    reserveApproved,
    isLoading,
    isLoadingReserveBalance,
    checkReserveApproval,
  } = useUserPoolManagement(
    pool.address,
    pool.reserveTokenAddress,
    pool.reserveTokenDecimals,
    pool.assetTokenAddress,
    pool.assetTokenDecimals
  );

  const currentCollateral = userData.userPosition?.collateralAmount
    ? Number(
        formatUnits(
          userData.userPosition.collateralAmount,
          pool.reserveTokenDecimals
        )
      )
    : 0;

  useEffect(() => {
    if (activeTab === "add" && collateralAmount && address) {
      checkReserveApproval(collateralAmount);
    }
  }, [collateralAmount, activeTab, address, checkReserveApproval]);

  const hasEnoughBalance =
    activeTab === "add" &&
    collateralAmount &&
    reserveBalance &&
    parseFloat(collateralAmount) <= parseFloat(reserveBalance);

  const canRemoveAmount =
    activeTab === "remove" &&
    collateralAmount &&
    parseFloat(collateralAmount) <= currentCollateral;

  const handleApproveReserve = async () => {
    if (!address || !collateralAmount) return;
    try {
      await approveReserve(collateralAmount);
      await checkReserveApproval(collateralAmount);
    } catch (error) {
      console.error("Failed to approve reserve token:", error);
    }
  };

  const handleAddCollateral = async () => {
    if (!address || !collateralAmount || !hasEnoughBalance) return;
    try {
      await addCollateral(address, collateralAmount);
      setCollateralAmount("");
    } catch (error) {
      console.error("Failed to add collateral:", error);
    }
  };

  const handleRemoveCollateral = async () => {
    if (!address || !collateralAmount || !canRemoveAmount) return;
    try {
      await reduceCollateral(collateralAmount);
      setCollateralAmount("");
    } catch (error) {
      console.error("Failed to remove collateral:", error);
    }
  };

  return (
    <Card className="bg-[#222325] border border-[#303136] rounded-2xl shadow-xl">
      <CardHeader className="px-6 py-4 border-b border-[#303136]">
        <CardTitle className="text-lg font-semibold text-white">
          Manage Collateral
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs
          defaultValue="add"
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setCollateralAmount("");
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-[#303136]/50 p-1 rounded-xl">
            <TabsTrigger
              value="add"
              className="data-[state=active]:bg-[#303136] data-[state=active]:text-white text-gray-400 rounded-lg"
            >
              Add
            </TabsTrigger>
            <TabsTrigger
              value="remove"
              className="data-[state=active]:bg-[#303136] data-[state=active]:text-white text-gray-400 rounded-lg"
            >
              Remove
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Input
                type="number"
                placeholder={`Amount in ${pool.reserveToken}`}
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                disabled={isLoading}
                className="bg-[#303136]/50 border-[#303136] text-white placeholder-gray-500 rounded-xl h-12"
              />

              <div className="flex justify-between text-xs px-1 text-gray-400">
                {activeTab === "add" ? (
                  <>
                    <span>
                      {isLoadingReserveBalance
                        ? "Loading balance..."
                        : `Balance: ${formatTokenBalance(
                            reserveBalance ?? 0
                          )} ${pool.reserveToken}`}
                    </span>
                    {collateralAmount && !hasEnoughBalance && (
                      <span className="text-red-400">Insufficient balance</span>
                    )}
                  </>
                ) : (
                  <>
                    <span>
                      Available: {currentCollateral.toFixed(4)}{" "}
                      {pool.reserveToken}
                    </span>
                    {collateralAmount && !canRemoveAmount && (
                      <span className="text-yellow-400">Exceeds available</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <TabsContent value="add" className="mt-0 space-y-4">
              {!reserveApproved ? (
                <Button
                  onClick={handleApproveReserve}
                  disabled={
                    isLoading ||
                    !collateralAmount ||
                    parseFloat(collateralAmount) <= 0 ||
                    !hasEnoughBalance
                  }
                  className="w-full h-12 rounded-xl"
                  variant="primary"
                >
                  {isLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  <Wallet className="w-4 h-4 mr-2" />
                  Approve {pool.reserveToken}
                </Button>
              ) : (
                <Button
                  onClick={handleAddCollateral}
                  disabled={
                    isLoading ||
                    !collateralAmount ||
                    parseFloat(collateralAmount) <= 0 ||
                    !hasEnoughBalance
                  }
                  className="w-full h-12 rounded-xl"
                  variant="primary"
                >
                  {isLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Add Collateral
                </Button>
              )}
              <div className="flex items-start gap-2 text-blue-400 bg-blue-500/10 p-3 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Adding collateral strengthens your position and reduces
                  liquidation risk.
                </span>
              </div>
            </TabsContent>

            <TabsContent value="remove" className="mt-0 space-y-4">
              <Button
                onClick={handleRemoveCollateral}
                disabled={
                  isLoading ||
                  !collateralAmount ||
                  parseFloat(collateralAmount) <= 0 ||
                  !canRemoveAmount
                }
                className="w-full h-12 rounded-xl"
                variant="secondary"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Remove Collateral
              </Button>
              <div className="flex items-start gap-2 text-yellow-400 bg-yellow-500/10 p-3 rounded-xl text-xs">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  You can only remove excess collateral if your position remains
                  healthy.
                </span>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
