"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Input } from "@/components/ui/BaseComponents";
import {
  ArrowDownUp,
  Info,
  Wallet,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useAave } from "@/hooks/useAave";
import { useAccount, useChainId } from "wagmi";
import { formatTokenBalance } from "@/utils";
import { getAaveConfig } from "@/config/aave";
import { getExplorerUrl } from "@/utils/explorer";
import Link from "next/link";

type Direction = "supply" | "withdraw";

export const ReservePage: React.FC = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const aaveConfig = getAaveConfig(chainId);

  const [direction, setDirection] = useState<Direction>("supply");
  const [amount, setAmount] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    txState,
    isBusy,
    isSupported,
    error,
    lastSuccess,
    clearLastSuccess,
    formattedUsdcBalance,
    formattedAUsdcBalance,
    isLoadingUsdcBalance,
    isLoadingAUsdcBalance,
    needsApproval,
    approveUsdc,
    supply,
    withdraw,
    refetchBalances,
  } = useAave();

  useEffect(() => {
    if (lastSuccess) {
      setAmount("");
      clearLastSuccess();
    }
  }, [lastSuccess, clearLastSuccess]);

  const isSupply = direction === "supply";
  const fromToken = isSupply ? "USDC" : "aUSDC";
  const toToken = isSupply ? "aUSDC" : "USDC";
  const currentBalance = isSupply
    ? formattedUsdcBalance
    : formattedAUsdcBalance;
  const isLoadingBalance = isSupply
    ? isLoadingUsdcBalance
    : isLoadingAUsdcBalance;

  const hasInsufficientBalance =
    amount && Number(amount) > 0
      ? Number(amount) > Number(currentBalance)
      : false;

  const requiresApproval =
    isSupply && amount && Number(amount) > 0 ? needsApproval(amount) : false;

  const handleToggleDirection = () => {
    setDirection((prev) => (prev === "supply" ? "withdraw" : "supply"));
    setAmount("");
  };

  const handleMaxClick = () => {
    setAmount(currentBalance);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchBalances();
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleApprove = () => {
    if (!amount) return;
    approveUsdc();
  };

  const handleExecute = () => {
    if (!amount) return;
    if (isSupply) {
      supply(amount);
    } else {
      withdraw(amount);
    }
  };

  const getButtonContent = () => {
    const { action, phase } = txState;

    if (isBusy) {
      let label = "";
      if (phase === "wallet") {
        label =
          action === "approve"
            ? "Confirm in wallet…"
            : `Confirm ${isSupply ? "supply" : "withdraw"} in wallet…`;
      } else if (phase === "confirming") {
        label =
          action === "approve"
            ? "Approving…"
            : `${isSupply ? "Supplying" : "Withdrawing"}…`;
      }

      return (
        <Button
          disabled
          variant="primary"
          className="w-full h-12 rounded-xl disabled:cursor-not-allowed"
        >
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {label}
        </Button>
      );
    }

    if (isSupply && requiresApproval) {
      return (
        <Button
          onClick={handleApprove}
          disabled={!amount || hasInsufficientBalance}
          variant="primary"
          className="w-full h-12 rounded-xl disabled:cursor-not-allowed"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Approve USDC for Aave
        </Button>
      );
    }

    return (
      <Button
        onClick={handleExecute}
        disabled={!amount || hasInsufficientBalance}
        variant="primary"
        className="w-full h-12 rounded-xl disabled:cursor-not-allowed"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isSupply ? "Convert USDC → aUSDC" : "Convert aUSDC → USDC"}
      </Button>
    );
  };

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">
            Switch to Base Mainnet
          </h2>
          <p className="text-gray-400 text-sm">
            Reserve management is only available on Base mainnet. Please switch
            your network to continue.
          </p>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-8 text-center">
          <Wallet className="w-10 h-10 text-gray-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">
            Connect Wallet
          </h2>
          <p className="text-gray-400 text-sm">
            Connect your wallet to manage your reserve tokens.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-8 sm:pb-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Reserve Management
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Convert between USDC and aUSDC to interact with Own Protocol pools.
        </p>
      </div>

      <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-sm">Why aUSDC?</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Own Protocol pools use aUSDC (Aave&apos;s yield-bearing USDC) as
              the reserve token. Your deposited USDC earns yield through Aave
              while being used as collateral, reducing your net cost of minting.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-gray-400">
                  1:1 backed by USDC
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-gray-400">
                  Earns yield automatically
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-gray-400">Withdraw anytime</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-400">Your Balances</p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh balances"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">USDC Balance</p>
          <p className="text-white font-semibold text-lg">
            {isLoadingUsdcBalance ? (
              <Loader2 className="w-4 h-4 animate-spin inline" />
            ) : (
              formatTokenBalance(formattedUsdcBalance)
            )}
          </p>
        </Card>
        <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">aUSDC Balance</p>
          <p className="text-white font-semibold text-lg">
            {isLoadingAUsdcBalance ? (
              <Loader2 className="w-4 h-4 animate-spin inline" />
            ) : (
              formatTokenBalance(formattedAUsdcBalance)
            )}
          </p>
        </Card>
      </div>

      <Card className="bg-[#222325] border border-[#303136] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">
            {isSupply ? "Get aUSDC" : "Get USDC"}
          </h2>
          <button
            onClick={handleToggleDirection}
            disabled={isBusy}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors bg-[#303136]/50 hover:bg-[#303136] px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            Switch
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-400">From: {fromToken}</label>
            <Input
              type="number"
              placeholder={`Amount of ${fromToken}`}
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(e.target.value)
              }
              disabled={isBusy}
              className="px-3 h-12 bg-[#303136]/50 border-[#303136] text-white placeholder:text-gray-500 rounded-xl disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-gray-400">
                Balance:{" "}
                {isLoadingBalance ? (
                  <Loader2 className="w-3 h-3 inline animate-spin ml-1" />
                ) : (
                  `${formatTokenBalance(currentBalance)} ${fromToken}`
                )}
              </span>
              <div className="flex items-center gap-2">
                {hasInsufficientBalance && (
                  <span className="text-sm text-red-400">
                    Insufficient balance
                  </span>
                )}
                <button
                  onClick={handleMaxClick}
                  disabled={isBusy}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#303136]/50 flex items-center justify-center">
              <ArrowDownUp className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-400">To: {toToken}</label>
            <div className="px-3 h-12 bg-[#303136]/30 border border-[#303136] text-white rounded-xl flex items-center">
              <span className={amount ? "text-white" : "text-gray-500"}>
                {amount ? `~${amount}` : `Amount of ${toToken}`}
              </span>
            </div>
            <p className="text-xs text-gray-500 px-2">
              {isSupply
                ? "aUSDC is 1:1 with USDC. Conversion is handled via Aave."
                : "You'll receive USDC directly to your wallet."}
            </p>
          </div>
        </div>

        <div className="mt-6">{getButtonContent()}</div>

        {error && !isBusy && (
          <div className="flex items-center gap-2 text-red-400 text-sm mt-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{error.message}</span>
          </div>
        )}

        {aaveConfig && (
          <div className="mt-5 pt-4 border-t border-[#303136]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Powered by</span>
                <Link
                  href="https://aave.com"
                  target="_blank"
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  Aave V3
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <Link
                href={getExplorerUrl(aaveConfig.poolAddress, chainId)}
                target="_blank"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                Contract
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReservePage;
