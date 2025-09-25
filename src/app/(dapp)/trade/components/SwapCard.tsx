"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import { Token as UniToken } from "@uniswap/sdk-core";
import TokenSelect from "./TokenSelect";
import TokenInput from "./TokenIput";
import { Token } from "./types";
import SwapSettings from "./SwapSettings";
import { useQuote } from "@/hooks/useQuote";
import { useSwap } from "@/hooks/useSwap";
import { useAccount } from "wagmi";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import QuoteSkeleton from "./QuoteSkeleton";
import RefreshButton from "./RefreshButton";
import {
  tokenList,
  tokenListRWA,
  convertToUniToken,
} from "../../../../config/token";
import { TxStatusModal } from "./TxStatusModal";

export default function SwapCard() {
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState<Token>(tokenList[0]);
  const [toToken, setToToken] = useState<Token>(tokenListRWA[0]);

  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");

  const [slippage, setSlippage] = useState<number>(2); // default slippage %
  const [minReceived, setMinReceived] = useState<string>("0");

  const [fromBalance, setFromBalance] = useState<string>("0");
  const [toBalance, setToBalance] = useState<string>("0");

  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  const fromTokenBalance = useTokenBalance({
    address: address!,
    tokenAddress: fromToken.address as `0x${string}`,
    decimals: Number(fromToken.decimals),
  });

  const toTokenBalance = useTokenBalance({
    address: address!,
    tokenAddress: toToken.address as `0x${string}`,
    decimals: Number(toToken.decimals),
  });

  useEffect(() => {
    if (fromTokenBalance.balance) setFromBalance(fromTokenBalance.balance);
  }, [fromTokenBalance.balance]);

  useEffect(() => {
    if (toTokenBalance.balance) setToBalance(toTokenBalance.balance);
  }, [toTokenBalance.balance]);

  // Convert UI tokens to UniToken instances
  const fromUniToken: UniToken = useMemo(
    () => convertToUniToken(fromToken),
    [fromToken]
  );
  const toUniToken: UniToken = useMemo(
    () => convertToUniToken(toToken),
    [toToken]
  );

  // Determine zeroForOne: true if fromToken is token0, false if fromToken is token1
  const zeroForOne = useMemo(() => {
    return (
      fromUniToken.address.toLowerCase() < toUniToken.address.toLowerCase()
    );
  }, [fromUniToken, toUniToken]);

  // Create poolKey dynamically based on current tokens
  const poolKey = useMemo(() => {
    // Sort tokens to ensure consistent poolKey structure
    const token0 =
      fromUniToken.address.toLowerCase() < toUniToken.address.toLowerCase()
        ? fromUniToken.address
        : toUniToken.address;
    const token1 =
      fromUniToken.address.toLowerCase() < toUniToken.address.toLowerCase()
        ? toUniToken.address
        : fromUniToken.address;

    return {
      currency0: token0,
      currency1: token1,
      fee: 3000,
      tickSpacing: 60,
      hooks: "0x0000000000000000000000000000000000000000",
    };
  }, [fromUniToken, toUniToken]);

  //Swap tokens (switch between From & To)
  const handleSwitch = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    const tempBalance = fromBalance;

    setFromToken(toToken);
    setFromAmount(toAmount);
    setFromBalance(toBalance);

    setToToken(tempToken);
    setToAmount(tempAmount);
    setToBalance(tempBalance);
  };

  const {
    quotedAmount,
    isLoading,
    quoteErrorMessage,
    refetchQuote,
    isRefetching,
  } = useQuote({
    fromToken: fromUniToken,
    toToken: toUniToken,
    fromAmount,
    poolKey,
    zeroForOne,
    enabled: true,
  });

  const {
    executeSwap,
    isPending,
    isApprovalPending,
    approvalConfirmed,
    isPermit2ApprovalPending,
    permit2ApprovalConfirmed,
    isSwapPending,
    swapConfirmed,
    swapIsError,
    isError,
    errorMessage,
    resetSwapState,
    needsERC20Approval,
    needsPermit2Approval,
  } = useSwap({
    fromToken: fromUniToken,
    toToken: toUniToken,
    poolKey,
    zeroForOne,
    userAddress: address,
  });

  const handleRefetch = () => {
    // Clear inputs
    setFromAmount("");
    setToAmount("");
    setMinReceived("0");

    // Clear any swap state
    resetSwapState();

    // Trigger fresh quote request
    refetchQuote();
  };

  async function handleSwap() {
    if (!fromAmount || !quotedAmount || !address) return;

    //applying slippage
    const minOut = (parseFloat(quotedAmount) * (1 - slippage / 100)).toFixed(
      Number(toToken.decimals)
    );

    try {
      setModalOpen(true);
      const tx = await executeSwap(fromAmount, minOut);
      setLastTxHash(tx ?? null);
    } catch (err) {
      console.error("Swap failed:", err);
      setModalOpen(true); // still show modal with error
      setLastTxHash(null);
    }
  }

  const exchangeRate =
    fromAmount && quotedAmount
      ? (parseFloat(quotedAmount) / parseFloat(fromAmount)).toFixed(6)
      : "0";

  // Check approval status
  const erc20ApprovalNeeded = fromAmount
    ? needsERC20Approval?.(fromAmount)
    : false;
  const permit2ApprovalNeeded = fromAmount
    ? needsPermit2Approval?.(fromAmount)
    : false;

  useEffect(() => {
    setToAmount(quotedAmount);
    if (quotedAmount && slippage > 0) {
      const min = parseFloat(quotedAmount) * (1 - slippage / 100);
      setMinReceived(min.toFixed(6));
    }
  }, [quotedAmount, slippage]);

  // Get button text and state
  const getButtonState = () => {
    if (!address) {
      return { text: "Connect Wallet", disabled: true };
    }

    if (!fromAmount) {
      return { text: "Enter an amount", disabled: true };
    }

    if (quoteErrorMessage) {
      return { text: "Cannot Swap", disabled: true };
    }

    if (isPending) {
      if (isApprovalPending) {
        return { text: "Approving ERC20...", disabled: true };
      }
      if (isPermit2ApprovalPending) {
        return { text: "Approving Permit2...", disabled: true };
      }
      if (isSwapPending) {
        return { text: "Swapping...", disabled: true };
      }
      return { text: "Processing...", disabled: true };
    }

    if (erc20ApprovalNeeded || permit2ApprovalNeeded) {
      return { text: "Approve & Swap", disabled: false };
    }

    return { text: "Swap", disabled: false };
  };

  const { text: buttonText, disabled: buttonDisabled } = getButtonState();

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto rounded-2xl bg-[#101828] p-6 shadow-xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Swap</h2>

          <div className="flex items-center space-x-2">
            <RefreshButton onClick={refetchQuote} loading={isRefetching} />
            <SwapSettings slippage={slippage} setSlippage={setSlippage} />
          </div>
        </div>

        {/* From Section */}
        <TokenInput
          tokenName={fromToken.name}
          amount={fromAmount}
          balance={fromBalance}
          align="from"
          onAmountChange={setFromAmount}
          tokenSelect={
            <TokenSelect
              tokens={tokenList}
              selected={fromToken}
              onSelect={(token) => setFromToken(token)}
            />
          }
        />

        {/* Switch Button */}
        <div className="flex justify-center my-2">
          <button
            onClick={handleSwitch}
            className="p-2 bg-[#1B2430] rounded-full hover:bg-[#243040] transition"
          >
            <ArrowUpDown size={20} className="text-gray-300" />
          </button>
        </div>

        {/* To Section */}
        <TokenInput
          tokenName={toToken.name}
          amount={toAmount}
          balance={toBalance}
          align="to"
          onAmountChange={setToAmount}
          tokenSelect={
            <TokenSelect
              tokens={tokenListRWA}
              selected={toToken}
              onSelect={(token) => setToToken(token)}
            />
          }
        />

        {/* Approval Status (Optional - for better UX) */}
        {address &&
          fromAmount &&
          (erc20ApprovalNeeded || permit2ApprovalNeeded) && (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 mb-3">
              <p className="text-yellow-400 text-sm font-medium mb-1">
                Approvals Required:
              </p>
              <div className="space-y-1 text-xs text-yellow-300">
                {erc20ApprovalNeeded && (
                  <p>
                    • ERC20 approval for Permit2{" "}
                    {isApprovalPending && "(pending...)"}
                  </p>
                )}
                {permit2ApprovalNeeded && (
                  <p>
                    • Permit2 approval for Universal Router{" "}
                    {isPermit2ApprovalPending && "(pending...)"}
                  </p>
                )}
              </div>
            </div>
          )}

        {/* Quote Section */}
        {fromAmount && (
          <div className="rounded-xl flex-col bg-white/5 p-4 mb-3 space-y-2">
            {isLoading || isRefetching ? (
              <QuoteSkeleton />
            ) : quoteErrorMessage ? (
              <p className="text-red-400 text-sm">{quoteErrorMessage}</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Exchange Rate:</p>
                  <p className="text-md">
                    1 {fromToken.symbol} ≈ {exchangeRate} {toToken.symbol}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Slippage Tolerance:</p>
                  <p className="text-md">{slippage}%</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Minimum Received:</p>
                  <p className="text-md">
                    {minReceived} {toToken.symbol}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className={`w-full py-3 rounded-xl font-medium transition ${
            !buttonDisabled
              ? "bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] text-white hover:opacity-90"
              : "bg-gradient-to-r from-[#2563EB] to-[#1E3A8A] text-white cursor-not-allowed opacity-60"
          }`}
          disabled={buttonDisabled}
        >
          {buttonText}
        </button>
      </div>

      <TxStatusModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          handleRefetch();
        }}
        isPending={
          isPending ||
          isApprovalPending ||
          isPermit2ApprovalPending ||
          isSwapPending
        }
        isSuccess={
          swapConfirmed || approvalConfirmed || permit2ApprovalConfirmed
        }
        isError={swapIsError || isError}
        txHash={lastTxHash}
        errorMessage={errorMessage}
      />
    </div>
  );
}
