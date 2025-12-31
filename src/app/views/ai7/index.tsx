"use client";

import React, { useState } from "react";
import Image from "next/image";
import { TradingViewLineChart } from "./components/TradingViewLineChart";
import { ReturnsCalculator } from "./components/ReturnsCalculator";
import { ETFInfoTab } from "./components/ETFInfoTab";
import { ProtocolTab } from "./components/ProtocolTab";
import { IncentivesTab } from "./components/IncentivesTab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/TabsComponents";
import { BarChart3, Info, Blocks, Gift } from "lucide-react";
import SwapUI from "../trade/SwapUI";
import PortfolioSection from "./components/PortfolioSection";
import AssetHeader from "./components/AssetHeader";

const TABS = [
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "etf-info", label: "ETF Info", icon: Info },
  { id: "protocol", label: "Protocol", icon: Blocks },
  { id: "incentives", label: "Incentives", icon: Gift },
];

export default function AI7InvestPage() {
  const [investmentAmount, setInvestmentAmount] = useState<string>("100");
  const [activeTab, setActiveTab] = useState<string>("charts");

  const handleAmountChange = (amount: string) => {
    setInvestmentAmount(amount);
  };

  const parsedAmount = parseFloat(investmentAmount) || 0;

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <div className="relative z-10 px-4 max-w-7xl mx-auto pt-24 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-8">
          <h1 className="text-2xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
            Invest In Tokenized US ETFs
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <span className="text-sm">Powered by Own Protocol</span>
          </div>
        </section>

        {/* Banner Image */}
        <section className="mb-8 sm:mb-12">
          <div className="relative w-full mx-auto rounded-2xl overflow-hidden border border-white/10">
            {/* Mobile Banner */}
            <div className="block sm:hidden">
              <Image
                src="/banners/ai7-banner-mobile.png"
                alt="AI7 Index Banner"
                width={1534}
                height={354}
                className="w-full h-auto rounded-2xl border border-white/10"
                priority
              />
            </div>
            {/* Desktop Banner */}
            <div className="hidden sm:block relative h-[300px]">
              <Image
                src="/banners/ai7-banner.svg"
                alt="AI7 Index Banner"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* Asset Header */}
        <section className="mb-8">
          <AssetHeader />
        </section>

        {/* Main Invest UI */}
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
                  <div className="space-y-6">
                    {/* TradingView Chart */}
                    <div className="rounded-xl overflow-hidden border border-[#303136] h-[300px] lg:h-[400px]">
                      <TradingViewLineChart symbol="CBOE:MAGS" />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#303136]" />

                    {/* Returns Calculator */}
                    <ReturnsCalculator
                      investmentAmount={parsedAmount}
                      expectedGrowthRate={45}
                      boostRate={24}
                    />
                  </div>
                </TabsContent>

                {/* ETF Info Tab */}
                <TabsContent value="etf-info" className="mt-0">
                  <ETFInfoTab />
                </TabsContent>

                {/* Protocol Tab */}
                <TabsContent value="protocol" className="mt-0">
                  <ProtocolTab />
                </TabsContent>

                {/* Incentives Tab */}
                <TabsContent value="incentives" className="mt-0">
                  <IncentivesTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right Column: Swap UI */}
          <div className="lg:sticky lg:top-24">
            <SwapUI initialAmount="100" onAmountChange={handleAmountChange} />
          </div>
        </section>

        {/* Portfolio Section - Full Width Below */}
        <PortfolioSection />
      </div>
    </div>
  );
}
