// src/app/(dapp)/lending/components/LendingPage.tsx
"use client";

import React from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { base } from "viem/chains";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { useMorphoMarket } from "@/hooks/morpho/useMorphoMarket";
import { useMorphoPosition } from "@/hooks/morpho/useMorphoPosition";
import { useMorphoActions } from "@/hooks/morpho/useMorphoActions";
import { MORPHO_MARKET_ID } from "@/config/morpho";

import { PositionOverview } from "./PositionOverview";
import { ActionTabs } from "./ActionTabs";

export const LendingPage: React.FC = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isCorrectChain = chainId === base.id;

  // Market data
  const market = useMorphoMarket();

  // User position
  const position = useMorphoPosition({
    totalSupplyAssets: market.totalSupplyAssets,
    totalSupplyShares: market.totalSupplyShares,
    totalBorrowAssets: market.totalBorrowAssets,
    totalBorrowShares: market.totalBorrowShares,
    lltv: market.marketParams?.lltv ?? 0n,
  });

  // Actions
  const actions = useMorphoActions(market.marketParams, () => {
    market.refetch();
    position.refetch();
  });

  // Wrong chain overlay
  if (isConnected && !isCorrectChain) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-20">
        <div className="rounded-xl border border-[#303136] bg-[#16171a] p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Wrong Network
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Morpho lending is available on Base mainnet. Please switch your
            network to continue.
          </p>
          <button
            onClick={() => switchChain({ chainId: base.id })}
            className="w-full py-3 rounded-xl font-medium bg-[#2660F5] text-white hover:opacity-90 transition"
          >
            Switch to Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-24 pb-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/trade/ai7"
            className="p-2 rounded-lg hover:bg-[#303136] transition"
          >
            <ArrowLeft className="h-4 w-4 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src="/icons/ai7-logo.svg"
                alt="AI7"
                width={36}
                height={36}
                className="rounded-full"
              />
              <Image
                src="/icons/usdc-logo.png"
                alt="USDC"
                width={18}
                height={18}
                className="rounded-full absolute -bottom-0.5 -right-1 border-2 border-[#16171a]"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">
                AI7 / USDC Lending
              </h1>
              <p className="text-xs text-gray-500">
                Morpho Blue Market on Base
              </p>
            </div>
          </div>
        </div>
        <a
          href={`https://app.morpho.org/market?id=${MORPHO_MARKET_ID}&network=base`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#303136] text-xs text-gray-400 hover:text-white hover:border-gray-500 transition"
        >
          View on Morpho
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Market overview + position */}
        <div className="lg:col-span-3 space-y-4">
          <PositionOverview
            supplyAssetsFormatted={position.supplyAssetsFormatted}
            borrowAssetsFormatted={position.borrowAssetsFormatted}
            collateralFormatted={position.collateralFormatted}
            totalSupplyFormatted={market.totalSupplyFormatted}
            totalBorrowFormatted={market.totalBorrowFormatted}
            availableLiquidityFormatted={market.availableLiquidityFormatted}
            utilization={market.utilization}
            lltv={market.lltv}
            supplyApy={market.supplyApy}
            borrowApy={market.borrowApy}
            isLoading={market.isLoading}
            isConnected={isConnected}
          />

          {/* How it works */}
          <div className="rounded-xl border border-[#303136] bg-[#16171a] p-4">
            <h3 className="text-sm font-medium text-white mb-3">
              How It Works
            </h3>
            <div className="space-y-3">
              <InfoRow
                step="1"
                title="Supply USDC"
                description="Lend USDC to the pool and earn interest from borrowers."
                color="#2660F5"
              />
              <InfoRow
                step="2"
                title="Deposit AI7 Collateral"
                description="Deposit your AI7 tokens as collateral to enable borrowing."
                color="#8b5cf6"
              />
              <InfoRow
                step="3"
                title="Borrow USDC"
                description="Borrow USDC against your AI7 collateral. Monitor your LTV to avoid liquidation."
                color="#f59e0b"
              />
              <InfoRow
                step="4"
                title="Repay & Withdraw"
                description="Repay your debt and withdraw your collateral anytime."
                color="#10b981"
              />
            </div>
          </div>
        </div>

        {/* Right: Action card */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <ActionTabs
              actions={actions}
              position={position}
              lltv={market.lltv}
              availableLiquidityFormatted={market.availableLiquidityFormatted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Info Row ──
interface InfoRowProps {
  step: string;
  title: string;
  description: string;
  color: string;
}

const InfoRow: React.FC<InfoRowProps> = ({
  step,
  title,
  description,
  color,
}) => (
  <div className="flex items-start gap-3">
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {step}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-200">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  </div>
);

export default LendingPage;
