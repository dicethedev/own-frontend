"use client";

import React, { useState } from "react";
import { TradingViewWidget } from "../TradingViewComponent";
import { useAccount } from "wagmi";
import { Pool } from "@/types/pool";
import { LPActionsCard } from "./LPActionsCard";
import { LPRequestsCard } from "./LPRequestsCard";
import { LPPositionsCard } from "./LPPositionsCard";
import { RebalanceCard } from "./RebalanceCard";
import { useLPData } from "@/hooks/lp";
import { LPRequestType } from "@/types/lp";
import { AdditionalActionsCard } from "./AdditionalActionsCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/TabsComponents";
import { BarChart3, HelpCircle, Info } from "lucide-react";
import {
  PoolAssetHeader,
  HowUnderwritingWorksTab,
  PoolInfoTab,
  UnconnectedActionsCard,
} from "../common";

const TABS = [
  { id: "charts", label: "Chart", icon: BarChart3 },
  { id: "how-it-works", label: "How It Works", icon: HelpCircle },
  { id: "pool-info", label: "Pool Info", icon: Info },
];

const LPPage: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { isConnected } = useAccount();
  const lpData = useLPData(pool.address);
  const [activeTab, setActiveTab] = useState<string>("charts");

  // Calculate if user is blocked from new requests
  const calculateBlockedStatusForLP = () => {
    if (!lpData.lpRequest) return { isBlocked: false, message: "" };

    const hasActiveRequest =
      lpData.lpRequest.requestType !== LPRequestType.NONE;

    if (!hasActiveRequest) return { isBlocked: false, message: "" };

    const isCurrentCycle =
      Number(pool.currentCycle) === Number(lpData.lpRequest.requestCycle);

    if (isCurrentCycle) {
      return {
        isBlocked: true,
        message:
          "You already have an active request. You must wait for it to be processed before making a new one.",
      };
    }

    return {
      isBlocked: true,
      message:
        "You have an active liquidity request. You must wait for it to be processed before making a new one.",
    };
  };

  const blockedStatus = isConnected
    ? calculateBlockedStatusForLP()
    : { isBlocked: false, message: "" };

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <div className="relative z-10 px-4 max-w-7xl mx-auto pt-24 pb-16">
        {/* Asset Header */}
        <section className="mb-8">
          <PoolAssetHeader pool={pool} pageType="underwrite" />
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
                  <HowUnderwritingWorksTab />
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
              <LPActionsCard
                pool={pool}
                lpData={lpData}
                isBlockedFromNewRequests={blockedStatus.isBlocked}
                blockMessage={blockedStatus.message}
              />
            ) : (
              <UnconnectedActionsCard />
            )}
          </div>
        </section>

        {/* Bottom Section: Requests, Positions, Rebalance, Additional Actions */}
        <div className="mt-8 space-y-6">
          {/* LP Requests Card */}
          {isConnected && <LPRequestsCard pool={pool} lpData={lpData} />}

          {/* LP Positions Card */}
          {isConnected && <LPPositionsCard pool={pool} lpData={lpData} />}

          {/* Rebalance Card - Only show for registered LPs */}
          {isConnected && lpData.isLP && (
            <RebalanceCard pool={pool} lpData={lpData} />
          )}

          {/* Additional Actions Card - Only show for registered LPs */}
          {isConnected && lpData.isLP && (
            <AdditionalActionsCard pool={pool} lpData={lpData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LPPage;
