"use client";

import React from "react";
import { TradingViewWidget } from "../TradingViewComponent";
import { useAccount } from "wagmi";
import { UserActionsCard } from "./UserActionsCard";
import { UserPositionsCard } from "./UserPositionsCard";
import { UserAdditionalActionsCard } from "./UserAdditionalActionsCard";
import { Pool } from "@/types/pool";
import { useUserData } from "@/hooks/user";
import { formatUnits } from "viem";
import { UserRequestsCard } from "./UserRequestsCard";
import { UserRequestType } from "@/types/user";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/TabsComponents";
import { BarChart3, HelpCircle, Info } from "lucide-react";
import {
  PoolAssetHeader,
  HowMintingWorksTab,
  PoolInfoTab,
  UnconnectedActionsCard,
  UnconnectedPositionsCard,
} from "../common";

interface UserPageProps {
  pool: Pool;
}

const TABS = [
  { id: "charts", label: "Chart", icon: BarChart3 },
  { id: "how-it-works", label: "How It Works", icon: HelpCircle },
  { id: "pool-info", label: "Pool Info", icon: Info },
];

const UserPage: React.FC<UserPageProps> = ({ pool }) => {
  const { isConnected } = useAccount();
  const userData = useUserData(pool.address);
  const [activeTab, setActiveTab] = React.useState<string>("charts");

  const calculateBlockedStatus = () => {
    if (!userData.userRequest) return { isBlocked: false, message: "" };

    const hasActiveRequest =
      userData.userRequest.requestType !== UserRequestType.NONE;

    if (!hasActiveRequest) return { isBlocked: false, message: "" };

    const canClaim =
      Number(pool.currentCycle) > Number(userData.userRequest.requestCycle);

    const isCurrentCycle =
      Number(pool.currentCycle) === Number(userData.userRequest.requestCycle);

    if (canClaim) {
      return {
        isBlocked: true,
        message: "Please claim your processed request before making a new one.",
      };
    }

    if (isCurrentCycle) {
      return {
        isBlocked: true,
        message:
          "You have an active request. Wait for it to be processed before making a new one.",
      };
    }

    return {
      isBlocked: true,
      message:
        "You have an active request. You must wait for it to be processed before making a new one.",
    };
  };

  const blockedStatus = isConnected
    ? calculateBlockedStatus()
    : { isBlocked: false, message: "" };

  // Check if user has a position (deposited amount > 0)
  const hasPosition =
    userData.userPosition?.depositAmount &&
    Number(
      formatUnits(
        userData.userPosition.depositAmount,
        pool.reserveTokenDecimals
      )
    ) > 0;

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <div className="relative z-10 px-4 max-w-7xl mx-auto pt-24 pb-16">
        {/* Asset Header */}
        <section className="mb-8">
          <PoolAssetHeader pool={pool} pageType="mint" />
        </section>

        {/* Main Content: Tabs + Actions */}
        <section className="grid lg:grid-cols-[60%_1fr] gap-8 items-start">
          {/* Left Column: Tabs & Content */}
          <div className="rounded-2xl bg-[#222325] p-6 shadow-xl border border-[#303136]">
            {/* Tab Navigation */}
            <Tabs
              defaultValue="charts"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* Pill-style Tab List */}
              <TabsList className="flex w-full bg-[#303136]/50 p-1 rounded-xl mb-6">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    disableHover={true}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium 
                      rounded-lg transition-colors
                      data-[state=active]:bg-[#303136] data-[state=active]:text-white
                      text-gray-400"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab Content */}
              <div>
                {/* Charts Tab */}
                <TabsContent value="charts" className="mt-0">
                  <div className="rounded-xl overflow-hidden border border-[#303136] h-[400px]">
                    {pool.assetSymbol.toLowerCase() === "ai7" ? (
                      <TradingViewWidget symbol="CBOE:MAGS" />
                    ) : (
                      <TradingViewWidget
                        symbol={`NASDAQ:${pool.assetSymbol}`}
                      />
                    )}
                  </div>
                </TabsContent>

                {/* How It Works Tab */}
                <TabsContent value="how-it-works" className="mt-0">
                  <HowMintingWorksTab />
                </TabsContent>

                {/* Pool Info Tab */}
                <TabsContent value="pool-info" className="mt-0">
                  <PoolInfoTab pool={pool} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right Column: Actions UI */}
          <div className="lg:sticky lg:top-24">
            {isConnected ? (
              <UserActionsCard
                pool={pool}
                userData={userData}
                isBlockedFromNewRequests={blockedStatus.isBlocked}
                blockMessage={blockedStatus.message}
              />
            ) : (
              <UnconnectedActionsCard />
            )}
          </div>
        </section>

        {/* Bottom Section: Requests, Positions, Additional Actions */}
        <div className="mt-8 space-y-6">
          {/* User Requests Card */}
          {isConnected && <UserRequestsCard pool={pool} userData={userData} />}

          {/* User Positions Card */}
          {isConnected ? (
            <UserPositionsCard pool={pool} userData={userData} />
          ) : (
            <UnconnectedPositionsCard />
          )}

          {/* Additional Actions Card - Only show for users with positions */}
          {isConnected && hasPosition && (
            <UserAdditionalActionsCard pool={pool} userData={userData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPage;
