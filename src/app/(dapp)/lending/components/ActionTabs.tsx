// src/app/(dapp)/lending/components/ActionTabs.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Wallet,
  Shield,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { AmountInput } from "./AmountInput";
import { MorphoActionsResult } from "@/hooks/morpho/useMorphoActions";
import { MorphoPosition } from "@/hooks/morpho/useMorphoPosition";
import { USDC_DECIMALS, AI7_DECIMALS } from "@/config/morpho";

type TabKey = "supply" | "borrow";
type SubTab = "deposit" | "withdraw";

interface ActionTabsProps {
  actions: MorphoActionsResult;
  position: MorphoPosition;
  lltv: number;
  availableLiquidityFormatted: string;
}

export const ActionTabs: React.FC<ActionTabsProps> = ({
  actions,
  position,
  lltv,
  availableLiquidityFormatted,
}) => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabKey>("supply");
  const [subTab, setSubTab] = useState<SubTab>("deposit");
  const [amount, setAmount] = useState("");

  const { reset: resetActions, isSuccess, isPending, isConfirming } = actions;

  // Reset amount on tab change
  useEffect(() => {
    setAmount("");
    resetActions();
  }, [activeTab, subTab, resetActions]);

  // Reset on success
  useEffect(() => {
    if (isSuccess) {
      setAmount("");
      position.refetch();
    }
  }, [isSuccess, position]);

  // ── Determine current action context ──
  const context = useMemo(() => {
    if (activeTab === "supply" && subTab === "deposit") {
      return {
        title: "Supply USDC",
        description: "Lend USDC to earn interest from borrowers",
        tokenSymbol: "USDC",
        tokenLogo: "/icons/usdc-logo.png",
        decimals: USDC_DECIMALS,
        balance: position.usdcBalanceFormatted,
        balanceLabel: "Wallet",
        allowance: position.usdcAllowance,
        needsApproval: (amt: string) => {
          if (!amt || parseFloat(amt) === 0) return false;
          try {
            const parsed = parseUnits(amt, USDC_DECIMALS);
            return position.usdcAllowance < parsed;
          } catch {
            return false;
          }
        },
        approve: actions.approveUsdc,
        execute: () => actions.supply(amount),
        buttonLabel: "Supply USDC",
        approveLabel: "Approve USDC",
      };
    }
    if (activeTab === "supply" && subTab === "withdraw") {
      return {
        title: "Withdraw USDC",
        description: "Withdraw your supplied USDC",
        tokenSymbol: "USDC",
        tokenLogo: "/icons/usdc-logo.png",
        decimals: USDC_DECIMALS,
        balance: position.supplyAssetsFormatted,
        balanceLabel: "Supplied",
        allowance: BigInt(Number.MAX_SAFE_INTEGER), // no approval needed
        needsApproval: () => false,
        approve: async () => {},
        execute: () => {
          // Use shares for max withdraw
          const isMax =
            amount === position.supplyAssetsFormatted ||
            parseFloat(amount) >= parseFloat(position.supplyAssetsFormatted);
          if (isMax && position.supplyShares > 0n) {
            return actions.withdraw("0", true, position.supplyShares);
          }
          return actions.withdraw(amount);
        },
        buttonLabel: "Withdraw USDC",
        approveLabel: "",
      };
    }
    if (activeTab === "borrow" && subTab === "deposit") {
      return {
        title: "Borrow USDC",
        description: "Deposit AI7 as collateral and borrow USDC against it",
        tokenSymbol: "USDC",
        tokenLogo: "/icons/usdc-logo.png",
        decimals: USDC_DECIMALS,
        balance: availableLiquidityFormatted,
        balanceLabel: "Available",
        allowance: BigInt(Number.MAX_SAFE_INTEGER), // no approval for borrow
        needsApproval: () => false,
        approve: async () => {},
        execute: () => actions.borrow(amount),
        buttonLabel: "Borrow USDC",
        approveLabel: "",
      };
    }
    // borrow + withdraw = repay
    return {
      title: "Repay USDC",
      description: "Repay your borrowed USDC",
      tokenSymbol: "USDC",
      tokenLogo: "/icons/usdc-logo.png",
      decimals: USDC_DECIMALS,
      balance: position.usdcBalanceFormatted,
      balanceLabel: "Wallet",
      allowance: position.usdcAllowance,
      needsApproval: (amt: string) => {
        if (!amt || parseFloat(amt) === 0) return false;
        try {
          const parsed = parseUnits(amt, USDC_DECIMALS);
          return position.usdcAllowance < parsed;
        } catch {
          return false;
        }
      },
      approve: actions.approveUsdc,
      execute: () => {
        const isMax =
          amount === position.borrowAssetsFormatted ||
          parseFloat(amount) >= parseFloat(position.borrowAssetsFormatted);
        if (isMax && position.borrowShares > 0n) {
          return actions.repay("0", true, position.borrowShares);
        }
        return actions.repay(amount);
      },
      buttonLabel: "Repay USDC",
      approveLabel: "Approve USDC",
    };
  }, [
    activeTab,
    subTab,
    amount,
    position,
    actions,
    availableLiquidityFormatted,
  ]);

  // ── Collateral section for borrow tab ──
  const [collateralAmount, setCollateralAmount] = useState("");

  const collateralNeedsApproval = useMemo(() => {
    if (!collateralAmount || parseFloat(collateralAmount) === 0) return false;
    try {
      const parsed = parseUnits(collateralAmount, AI7_DECIMALS);
      return position.ai7Allowance < parsed;
    } catch {
      return false;
    }
  }, [collateralAmount, position.ai7Allowance]);

  // Reset collateral on tab change
  useEffect(() => {
    setCollateralAmount("");
  }, [activeTab, subTab]);

  // ── Validation ──
  const validation = useMemo(() => {
    if (!amount || parseFloat(amount) === 0) {
      return { valid: false, message: "Enter an amount" };
    }
    const num = parseFloat(amount);

    if (activeTab === "supply" && subTab === "deposit") {
      if (num > parseFloat(position.usdcBalanceFormatted))
        return { valid: false, message: "Insufficient USDC balance" };
    }
    if (activeTab === "supply" && subTab === "withdraw") {
      if (num > parseFloat(position.supplyAssetsFormatted))
        return { valid: false, message: "Exceeds supplied amount" };
    }
    if (activeTab === "borrow" && subTab === "deposit") {
      if (num > parseFloat(availableLiquidityFormatted))
        return { valid: false, message: "Exceeds available liquidity" };
      if (parseFloat(position.collateralFormatted) === 0)
        return {
          valid: false,
          message: "Deposit collateral first",
        };
    }
    if (activeTab === "borrow" && subTab === "withdraw") {
      if (num > parseFloat(position.usdcBalanceFormatted))
        return { valid: false, message: "Insufficient USDC balance" };
      if (num > parseFloat(position.borrowAssetsFormatted))
        return { valid: false, message: "Exceeds debt amount" };
    }

    return { valid: true, message: "" };
  }, [amount, activeTab, subTab, position, availableLiquidityFormatted]);

  const isProcessing = isPending || isConfirming;
  const requiresApproval = context.needsApproval(amount);

  const handleAction = async () => {
    if (requiresApproval) {
      await context.approve(amount);
      return;
    }
    await context.execute();
  };

  const getButtonText = () => {
    if (isPending) return "Confirm in wallet...";
    if (isConfirming) return "Processing...";
    if (!validation.valid) return validation.message;
    if (requiresApproval) return context.approveLabel;
    return context.buttonLabel;
  };

  const buttonDisabled =
    !validation.valid || isProcessing || !isConnected || !amount;

  // ── Render ──
  return (
    <div className="rounded-xl border border-[#303136] bg-[#16171a] overflow-hidden">
      {/* Main Tabs */}
      <div className="flex border-b border-[#303136]">
        {(["supply", "borrow"] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSubTab("deposit");
            }}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === tab
                ? "text-white border-b-2 border-[#2660F5]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "supply" ? "Supply" : "Borrow"}
          </button>
        ))}
      </div>

      {/* Sub Tabs */}
      <div className="flex mx-4 mt-4 rounded-lg bg-[#1a1b1f] p-0.5">
        {(
          [
            {
              key: "deposit" as SubTab,
              label: activeTab === "supply" ? "Supply" : "Borrow",
            },
            {
              key: "withdraw" as SubTab,
              label: activeTab === "supply" ? "Withdraw" : "Repay",
            },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition ${
              subTab === key
                ? "bg-[#303136] text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* Description */}
        <p className="text-xs text-gray-500">{context.description}</p>

        {/* Collateral section for Borrow tab */}
        {activeTab === "borrow" && subTab === "deposit" && (
          <div className="space-y-3 pb-3 border-b border-[#303136]">
            <AmountInput
              label="Collateral"
              value={collateralAmount}
              onChange={setCollateralAmount}
              tokenSymbol="AI7"
              tokenLogo="/icons/ai7-logo.svg"
              balance={position.ai7BalanceFormatted}
              balanceLabel="Wallet"
              decimals={AI7_DECIMALS}
              disabled={isProcessing}
            />

            {/* Collateral actions */}
            <div className="flex gap-2">
              {collateralNeedsApproval ? (
                <button
                  onClick={() => actions.approveAi7(collateralAmount)}
                  disabled={
                    isProcessing ||
                    !collateralAmount ||
                    parseFloat(collateralAmount) === 0
                  }
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-[#303136] text-white hover:bg-[#404146] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actions.currentAction === "approveAi7" && isProcessing ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Approving...
                    </span>
                  ) : (
                    "Approve AI7"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => actions.supplyCollateral(collateralAmount)}
                  disabled={
                    isProcessing ||
                    !collateralAmount ||
                    parseFloat(collateralAmount) === 0
                  }
                  className="flex-1 py-2 rounded-lg text-xs font-medium bg-[#2660F5] text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actions.currentAction === "supplyCollateral" &&
                  isProcessing ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Depositing...
                    </span>
                  ) : (
                    "Deposit Collateral"
                  )}
                </button>
              )}
            </div>

            {/* Current collateral display */}
            {parseFloat(position.collateralFormatted) > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Current Collateral</span>
                <span className="text-gray-300">
                  {parseFloat(position.collateralFormatted).toFixed(4)} AI7
                </span>
              </div>
            )}
          </div>
        )}

        {/* Withdraw Collateral section for Borrow > Repay tab */}
        {activeTab === "borrow" &&
          subTab === "withdraw" &&
          parseFloat(position.collateralFormatted) > 0 && (
            <div className="space-y-3 pb-3 border-b border-[#303136]">
              <AmountInput
                label="Withdraw Collateral"
                value={collateralAmount}
                onChange={setCollateralAmount}
                tokenSymbol="AI7"
                tokenLogo="/icons/ai7-logo.svg"
                balance={position.collateralFormatted}
                balanceLabel="Deposited"
                decimals={AI7_DECIMALS}
                disabled={isProcessing}
              />
              <button
                onClick={() => actions.withdrawCollateral(collateralAmount)}
                disabled={
                  isProcessing ||
                  !collateralAmount ||
                  parseFloat(collateralAmount) === 0
                }
                className="w-full py-2 rounded-lg text-xs font-medium bg-[#303136] text-white hover:bg-[#404146] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actions.currentAction === "withdrawCollateral" &&
                isProcessing ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Withdrawing...
                  </span>
                ) : (
                  "Withdraw Collateral"
                )}
              </button>
            </div>
          )}

        {/* Main amount input */}
        <AmountInput
          label={context.title}
          value={amount}
          onChange={setAmount}
          tokenSymbol={context.tokenSymbol}
          tokenLogo={context.tokenLogo}
          balance={context.balance}
          balanceLabel={context.balanceLabel}
          decimals={context.decimals}
          disabled={isProcessing}
        />

        {/* Debt info for repay */}
        {activeTab === "borrow" &&
          subTab === "withdraw" &&
          parseFloat(position.borrowAssetsFormatted) > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Outstanding Debt</span>
              <span className="text-amber-400 font-medium">
                {parseFloat(position.borrowAssetsFormatted).toFixed(2)} USDC
              </span>
            </div>
          )}

        {/* LLTV Warning */}
        {activeTab === "borrow" && subTab === "deposit" && lltv > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-400/80">
              <p>
                Liquidation LTV is{" "}
                <span className="font-semibold text-amber-400">
                  {lltv.toFixed(0)}%
                </span>
                . Your position will be liquidated if your loan-to-value ratio
                exceeds this threshold.
              </p>
            </div>
          </div>
        )}

        {/* Approval info banner */}
        {requiresApproval && amount && parseFloat(amount) > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#303136]/50 border border-[#303136]">
            <Shield className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400">
              <p className="font-medium text-gray-300 mb-0.5">
                Token Approval Required
              </p>
              <p>
                You need to approve Morpho to use your {context.tokenSymbol}{" "}
                before this transaction.
              </p>
            </div>
          </div>
        )}

        {/* Error display */}
        {actions.errorMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{actions.errorMessage}</p>
          </div>
        )}

        {/* Success display */}
        {isSuccess && actions.txHash && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-400">
              Transaction confirmed!
            </span>
            <a
              href={`https://basescan.org/tx/${actions.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Action Button */}
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            if (!ready) {
              return (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-medium bg-[#303136] text-gray-500 cursor-not-allowed"
                >
                  Loading...
                </button>
              );
            }

            if (!connected) {
              return (
                <button
                  onClick={openConnectModal}
                  className="w-full py-3 rounded-xl font-medium bg-[#2660F5] text-white hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </button>
              );
            }

            return (
              <button
                onClick={handleAction}
                disabled={buttonDisabled}
                className={`w-full py-3 rounded-xl font-medium transition ${
                  buttonDisabled
                    ? "bg-[#303136] text-gray-500 cursor-not-allowed"
                    : requiresApproval
                      ? "bg-white text-gray-900 hover:opacity-90"
                      : "bg-[#2660F5] text-white hover:opacity-90"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {getButtonText()}
                  </span>
                ) : (
                  getButtonText()
                )}
              </button>
            );
          }}
        </ConnectButton.Custom>

        {/* Powered by Morpho */}
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-[#303136]">
          <span className="text-gray-500 text-xs">Powered by</span>
          <span className="text-gray-400 text-xs font-medium">Morpho</span>
        </div>
      </div>
    </div>
  );
};

export default ActionTabs;
