"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Token as UniToken } from "@uniswap/sdk-core";
import TokenSelect from "./TokenSelect";
import TokenInput from "./TokenIput";
import { Token } from "../../../../types/token";
import { useQuote } from "@/hooks/useQuote";
import { useSwap } from "@/hooks/useSwap";
import { useAccount } from "wagmi";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import QuoteSkeleton from "./QuoteSkeleton";
import { getTokens, convertToUniToken } from "../../../../config/token";
import toast from "react-hot-toast";
import { Shield } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/TabsComponents";
import { useTxToasts } from "@/hooks/useTxToasts";
import { useChainId } from "wagmi";
import { getExplorerUrl, getTxnExplorerUrl } from "@/utils/explorer";

export default function SwapCard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const tokenListCurrency = getTokens(chainId, "STABLECOIN");
  const tokenListRWAList = getTokens(chainId, "RWA");
  const [fromToken, setFromToken] = useState<Token>(tokenListCurrency[0]);
  const [toToken, setToToken] = useState<Token>(tokenListRWAList[0]);

  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");

  const slippage = 2; // default slippage %

  const [fromBalance, setFromBalance] = useState<string>("0");
  const [toBalance, setToBalance] = useState<string>("0");

  const [activeTab, setActiveTab] = useState<string>("buy");
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  const {
    balance: fromTokenBalance,
    refetch: refetchFromBalance,
    isLoadingBalance: isLoadingFromBalance,
  } = useTokenBalance({
    address: address!,
    tokenAddress: fromToken.address as `0x${string}`,
    decimals: Number(fromToken.decimals),
  });

  const {
    balance: toTokenBalance,
    refetch: refetchToBalance,
    isLoadingBalance: isLoadingToBalance,
  } = useTokenBalance({
    address: address!,
    tokenAddress: toToken.address as `0x${string}`,
    decimals: Number(toToken.decimals),
  });

  useEffect(() => {
    if (fromTokenBalance) setFromBalance(fromTokenBalance);
  }, [fromTokenBalance]);

  useEffect(() => {
    if (toTokenBalance) setToBalance(toTokenBalance);
  }, [toTokenBalance]);

  // Convert UI tokens to UniToken instances
  const fromUniToken: UniToken = useMemo(
    () => convertToUniToken(fromToken, chainId),
    [fromToken, chainId]
  );
  const toUniToken: UniToken = useMemo(
    () => convertToUniToken(toToken, chainId),
    [toToken, chainId]
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

  // Handle tab change
  const handleTabChange = (newTab: string) => {
    if (newTab !== activeTab) {
      // Swap tokens when changing tabs
      const tempToken = fromToken;
      const tempBalance = fromBalance;

      setFromToken(toToken);
      setFromAmount("");
      setFromBalance(toBalance);

      setToToken(tempToken);
      setToAmount("");
      setToBalance(tempBalance);
    }
    setActiveTab(newTab);
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

  const handleRefetch = useCallback(() => {
    // Clear inputs
    setFromAmount("");
    setToAmount("");

    // Clear any swap state
    resetSwapState();

    // Trigger fresh quote request
    refetchQuote();
  }, [resetSwapState, refetchQuote]);

  async function handleSwap() {
    if (!fromAmount || !quotedAmount || !address) return;

    //applying slippage
    const minOut = (parseFloat(quotedAmount) * (1 - slippage / 100)).toFixed(
      Number(toToken.decimals)
    );

    try {
      const tx = await executeSwap(fromAmount, minOut);
      setLastTxHash(tx ?? null);
    } catch (err) {
      console.error("Swap failed:", err);
      setLastTxHash(null);
    }
  }

  const exchangeRate =
    fromAmount && quotedAmount
      ? activeTab === "buy"
        ? (parseFloat(quotedAmount) / parseFloat(fromAmount)).toFixed(6)
        : (parseFloat(fromAmount) / parseFloat(quotedAmount)).toFixed(6)
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
  }, [quotedAmount]);

  useTxToasts({
    isApprovalPending,
    isPermit2ApprovalPending,
    isSwapPending,
    activeTab,
  });

  useEffect(() => {
    if (approvalConfirmed || permit2ApprovalConfirmed || swapConfirmed) {
      if (lastTxHash) {
        toast.dismiss(lastTxHash);
      }

      let toastMessage;

      if (swapConfirmed) {
        //Refresh balances immediately
        refetchFromBalance();
        refetchToBalance();
        toastMessage = (
          <div>
            Successfully swapped{" "}
            <strong>
              {fromAmount} {fromToken.symbol}
            </strong>{" "}
            for <strong>{toToken.symbol}</strong>!{" "}
            {lastTxHash && (
              <a
                href={getTxnExplorerUrl(lastTxHash, chainId)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View on explorer
              </a>
            )}
          </div>
        );
      } else if (approvalConfirmed || permit2ApprovalConfirmed) {
        toastMessage = (
          <div>
            Token approved successfully!{" "}
            {lastTxHash && (
              <a
                href={`https://basescan.org/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                View on explorer
              </a>
            )}
          </div>
        );
      }

      if (toastMessage) {
        toast.success(toastMessage, {
          duration: 5000,
        });
      }

      // Only reset state after successful swap, not after approval
      if (swapConfirmed) {
        handleRefetch?.();
      }
    }
  }, [
    approvalConfirmed,
    permit2ApprovalConfirmed,
    swapConfirmed,
    swapIsError,
    isError,
    errorMessage,
    handleRefetch,
    lastTxHash,
    fromAmount,
    fromToken,
    toToken,
    refetchFromBalance,
    refetchToBalance,
    chainId,
  ]);

  // Handle error states
  useEffect(() => {
    if ((swapIsError || isError) && errorMessage) {
      let formattedError = errorMessage;
      // Common error patterns and their user-friendly messages
      if (errorMessage.includes("User rejected")) {
        formattedError = "Transaction was cancelled!";
      } else if (errorMessage.includes("insufficient funds")) {
        formattedError = "Insufficient balance for this transaction";
      } else if (errorMessage.includes("slippage")) {
        formattedError =
          "Price changed too much. Try increasing slippage tolerance";
      } else if (errorMessage.includes("deadline")) {
        formattedError = "Transaction took too long. Please try again";
      } else if (errorMessage.includes("gas")) {
        formattedError = "Not enough gas to complete transaction";
      } else if (errorMessage.includes("reverted")) {
        formattedError =
          "Transaction failed. Please check your balance and try again";
      } else if (errorMessage.includes("network")) {
        formattedError =
          "Network error. Please check your connection and try again";
      }

      toast.error(formattedError, {
        duration: 6000,
        style: {
          maxWidth: "400px",
        },
      });

      //refresh state after error
      handleRefetch?.();
    }
  }, [swapIsError, isError, errorMessage, handleRefetch]);

  // Get button text and state
  const getButtonState = () => {
    if (!address) {
      return { text: "Connect your wallet", disabled: true };
    }

    if (!fromAmount) {
      return {
        text: `Enter an amount to ${activeTab === "buy" ? "buy" : "sell"}`,
        disabled: true,
      };
    }

    if (quoteErrorMessage) {
      return {
        text: `Cannot ${activeTab === "buy" ? "Buy" : "Sell"}`,
        disabled: true,
      };
    }

    if (isPending) {
      if (isApprovalPending) {
        return {
          text: "Getting permission to use your tokens...",
          disabled: true,
        };
      }
      if (isPermit2ApprovalPending) {
        return { text: "Setting things up for you...", disabled: true };
      }
      if (isSwapPending) {
        return {
          text: `${activeTab === "buy" ? "Buying" : "Selling"} your tokens...`,
          disabled: true,
        };
      }
      return { text: "Processing...", disabled: true };
    }

    if (erc20ApprovalNeeded || permit2ApprovalNeeded) {
      return {
        text: `Approve & ${activeTab === "buy" ? "Buy" : "Sell"}`,
        disabled: false,
      };
    }

    return {
      text: `${activeTab === "buy" ? "Buy" : "Sell"} ${
        activeTab === "buy" ? toToken.name : fromToken.name
      }`,
      disabled: false,
    };
  };

  const { text: buttonText, disabled: buttonDisabled } = getButtonState();

  return (
    <div className="flex-1 flex items-start justify-center px-4 py-8 mt-24">
      <div className="w-full max-w-md mx-auto rounded-2xl bg-[#101828] p-6 shadow-xl border border-gray-800">
        {/* Buy/Sell Tabs */}
        <Tabs
          defaultValue="buy"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full mb-4"
        >
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1">
            <TabsTrigger
              value="buy"
              disableHover={true}
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-300"
            >
              Buy
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              disableHover={true}
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-300"
            >
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="mt-8">
            {/* From Section */}
            <TokenInput
              tokenName={fromToken.name}
              tokenAddressLink={getExplorerUrl(fromToken.address, chainId)}
              amount={fromAmount}
              balance={fromBalance}
              isLoading={isLoadingFromBalance}
              align="from"
              onAmountChange={setFromAmount}
              tokenSelect={
                <TokenSelect
                  tokens={tokenListCurrency}
                  selected={fromToken}
                  onSelect={(token) => setFromToken(token)}
                />
              }
            />

            <div className="my-4" />

            {/* To Section */}
            <TokenInput
              tokenName={toToken.name}
              tokenAddressLink={getExplorerUrl(toToken.address, chainId)}
              amount={toAmount}
              balance={toBalance}
              isLoading={isLoadingToBalance}
              align="to"
              onAmountChange={setToAmount}
              tokenSelect={
                <TokenSelect
                  tokens={tokenListRWAList}
                  selected={toToken}
                  onSelect={(token) => setToToken(token)}
                />
              }
            />
          </TabsContent>

          <TabsContent value="sell" className="mt-8">
            {/* From Section */}
            <TokenInput
              tokenName={fromToken.name}
              tokenAddressLink={getExplorerUrl(fromToken.address, chainId)}
              amount={fromAmount}
              balance={fromBalance}
              isLoading={isLoadingFromBalance}
              align="from"
              onAmountChange={setFromAmount}
              tokenSelect={
                <TokenSelect
                  tokens={tokenListCurrency}
                  selected={fromToken}
                  onSelect={(token) => setFromToken(token)}
                />
              }
            />

            <div className="my-4" />

            {/* To Section */}
            <TokenInput
              tokenName={toToken.name}
              tokenAddressLink={getExplorerUrl(toToken.address, chainId)}
              amount={toAmount}
              balance={toBalance}
              isLoading={isLoadingToBalance}
              align="to"
              onAmountChange={setToAmount}
              tokenSelect={
                <TokenSelect
                  tokens={tokenListRWAList}
                  selected={toToken}
                  onSelect={(token) => setToToken(token)}
                />
              }
            />
          </TabsContent>
        </Tabs>

        {/* Quote Section */}
        {fromAmount && (
          <div className="rounded-xl flex-col bg-white/5 p-4 mb-4 space-y-2">
            {isLoading || isRefetching ? (
              <QuoteSkeleton />
            ) : quoteErrorMessage ? (
              <p className="text-red-400 text-sm">{quoteErrorMessage}</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Market Price:</p>
                  <p className="text-md">
                    1 {activeTab === "buy" ? toToken.symbol : fromToken.symbol}{" "}
                    ≈ {(1 / Number(exchangeRate)).toFixed(2)}{" "}
                    {activeTab === "buy" ? fromToken.symbol : toToken.symbol}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Buy or Sell Button */}
        <button
          onClick={handleSwap}
          className={`w-full py-3 rounded-xl font-medium transition text-white ${
            buttonDisabled
              ? "cursor-not-allowed opacity-60"
              : "hover:opacity-90"
          } ${
            activeTab === "buy"
              ? "bg-gradient-to-r from-green-500 to-green-700"
              : "bg-gradient-to-r from-red-500 to-red-700"
          }`}
          disabled={buttonDisabled}
        >
          {buttonText}
        </button>

        {/* Approval Status */}
        {address &&
          fromAmount &&
          (erc20ApprovalNeeded || permit2ApprovalNeeded) && (
            <div className="rounded-xl p-4 mt-4 mb-2 bg-[#FFFFFF0D] border border-[#FFFFFF1A]">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-200 mb-1">
                    Token Approvals Required
                  </h4>
                  <p className="text-xs text-gray-400">
                    You’ll need to approve twice - first to set up permissions,
                    and then to allow token usage for this swap.
                    {isApprovalPending && " (pending...)"}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
